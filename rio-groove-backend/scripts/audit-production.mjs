/**
 * Auditoria operacional Rio Groove — produção e .env local (opcional).
 *
 *   node scripts/audit-production.mjs
 *   node scripts/audit-production.mjs --local-only
 *   node scripts/audit-production.mjs --json
 *
 * Exit 0 = tudo OK | Exit 1 = alguma falha
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULTS = {
  backendUrl: process.env.AUDIT_BACKEND_URL || 'https://rio-groove-backend.onrender.com',
  storeUrl: process.env.AUDIT_STORE_URL || 'https://store.riogroovemovimentos.com.br',
  adminUrl: process.env.AUDIT_ADMIN_URL || 'https://admin.riogroovemovimentos.com.br',
  probeOrder: process.env.AUDIT_PROBE_ORDER || 'RG-2026-25940869',
  fakeOrder: 'RG-2026-99999999',
};

const args = new Set(process.argv.slice(2));
const jsonOut = args.has('--json');
const localOnly = args.has('--local-only');
const strict = args.has('--strict');

function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!existsSync(envPath)) return false;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
  return true;
}

function isLegacyJwtKey(key) {
  return typeof key === 'string' && key.startsWith('eyJ');
}

function isNewPublishableKey(key) {
  return typeof key === 'string' && key.startsWith('sb_publishable_');
}

function isNewSecretKey(key) {
  return typeof key === 'string' && (key.startsWith('sb_secret_') || key.startsWith('sbp_'));
}

async function fetchStatus(url, options = {}) {
  const res = await fetch(url, { ...options, redirect: 'follow' });
  const text = options.method === 'HEAD' ? '' : await res.text().catch(() => '');
  return { status: res.status, ok: res.ok, text, headers: res.headers };
}

const results = [];

function record(name, ok, detail, scope = 'prod') {
  results.push({ name, ok, detail, scope, warn: false });
}

function warn(name, detail, scope = 'local') {
  results.push({ name, ok: true, detail, scope, warn: true });
}

async function auditProduction() {
  const base = DEFAULTS.backendUrl.replace(/\/$/, '');

  try {
    const health = await fetchStatus(`${base}/api/health`);
    const healthOk = health.status === 200;
    let healthBody = {};
    try {
      healthBody = JSON.parse(health.text);
    } catch {
      /* ignore */
    }
    record(
      'backend /api/health',
      healthOk && healthBody.ok === true,
      healthOk ? `200 ok=${healthBody.ok}` : `HTTP ${health.status}`,
    );
  } catch (e) {
    record('backend /api/health', false, e.message);
  }

  let imageUrl = null;
  try {
    const products = await fetchStatus(`${base}/api/products?limit=1`);
    const data = JSON.parse(products.text);
    const list = data.products || data;
    const first = Array.isArray(list) ? list[0] : null;
    imageUrl = first?.image_url || first?.images?.[0]?.url || null;
    record('backend /api/products', products.status === 200 && Boolean(first), products.status === 200 ? 'catálogo OK' : `HTTP ${products.status}`);
  } catch (e) {
    record('backend /api/products', false, e.message);
  }

  if (imageUrl) {
    try {
      const img = await fetchStatus(imageUrl, { method: 'HEAD' });
      const blocked = img.status === 402 || img.status === 429;
      record(
        'supabase storage (imagem produto)',
        img.status === 200,
        blocked ? `HTTP ${img.status} — limite/billing?` : `HTTP ${img.status}`,
      );
    } catch (e) {
      record('supabase storage (imagem produto)', false, e.message);
    }
  } else {
    record('supabase storage (imagem produto)', false, 'sem URL de imagem no catálogo');
  }

  try {
    const probe = await fetchStatus(`${base}/api/orders/${DEFAULTS.probeOrder}/public-status`);
    const exists = probe.status === 400;
    record(
      `pedido referência ${DEFAULTS.probeOrder}`,
      exists,
      exists ? '400 sem e-mail (pedido existe)' : `HTTP ${probe.status}`,
    );
  } catch (e) {
    record(`pedido referência ${DEFAULTS.probeOrder}`, false, e.message);
  }

  try {
    const fake = await fetchStatus(`${base}/api/orders/${DEFAULTS.fakeOrder}/public-status`);
    record('pedido inexistente (controle)', fake.status === 404, `HTTP ${fake.status}`);
  } catch (e) {
    record('pedido inexistente (controle)', false, e.message);
  }

  for (const [label, url] of [
    ['loja', DEFAULTS.storeUrl],
    ['admin', DEFAULTS.adminUrl],
  ]) {
    try {
      const r = await fetchStatus(url);
      record(`${label} (${url})`, r.status === 200, `HTTP ${r.status}`);
    } catch (e) {
      record(`${label} (${url})`, false, e.message);
    }
  }

  try {
    const admin = await fetchStatus(DEFAULTS.adminUrl);
    const match = admin.text.match(/src="(\/assets\/[^"]+\.js)"/);
    if (!match) {
      record('admin bundle (fixes pedidos)', false, 'bundle JS não encontrado no HTML');
    } else {
      const bundleUrl = `${DEFAULTS.adminUrl.replace(/\/$/, '')}${match[1]}`;
      const bundle = await fetchStatus(bundleUrl);
      const hasLookup = bundle.text.includes('Abrir pedido') || bundle.text.includes('lookupOrders');
      record('admin bundle (fixes pedidos)', hasLookup, hasLookup ? bundleUrl : 'strings de pedidos ausentes');
    }
  } catch (e) {
    record('admin bundle (fixes pedidos)', false, e.message);
  }
}

async function auditLocalEnv() {
  const hasEnv = loadDotEnv();
  if (!hasEnv) {
    warn('arquivo .env local', 'ausente — scripts locais usam Render/produção; copie de .env.example se precisar');
    return;
  }
  record('arquivo .env local', true, 'encontrado', 'local');

  const url = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SB_SECRET_KEY
    || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url) {
    record('SUPABASE_URL', false, 'ausente', 'local');
    return;
  }
  record('SUPABASE_URL', true, url, 'local');

  if (isLegacyJwtKey(serviceKey)) {
    warn(
      'SUPABASE_SERVICE_ROLE_KEY',
      'formato eyJ… no .env local — Supabase pode bloquear REST local; produção (Render) não é afetada se lá estiver outra variável',
    );
  } else if (!serviceKey) {
    record('SUPABASE_SERVICE_ROLE_KEY', false, 'ausente', 'local');
  } else if (isNewSecretKey(serviceKey)) {
    record('SUPABASE_SERVICE_ROLE_KEY', true, 'formato novo (sb_secret_/sbp_)', 'local');
  } else {
    record('SUPABASE_SERVICE_ROLE_KEY', true, 'definida', 'local');
  }

  if (isLegacyJwtKey(anonKey)) {
    warn('SUPABASE_ANON_KEY', 'formato eyJ… — opcional no backend; admin usa VITE_SUPABASE_ANON_KEY');
  } else if (!anonKey) {
    warn('SUPABASE_ANON_KEY', 'ausente (opcional no backend)');
  } else if (isNewPublishableKey(anonKey)) {
    record('SUPABASE_ANON_KEY', true, 'formato novo (sb_publishable_)', 'local');
  } else {
    record('SUPABASE_ANON_KEY', true, 'definida', 'local');
  }

  if (!serviceKey || isLegacyJwtKey(serviceKey)) return;

  try {
    const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const body = await res.text();
    const legacyDisabled = body.includes('Legacy API keys are disabled');
    record(
      'supabase DB (local .env)',
      res.ok,
      legacyDisabled ? 'Legacy API keys are disabled (só afeta dev local)' : `HTTP ${res.status}`,
      'local',
    );
  } catch (e) {
    record('supabase DB (local .env)', false, e.message);
  }

  try {
    const res = await fetch(`${url}/storage/v1/bucket`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    record('supabase storage API (local .env)', res.ok || res.status === 200, `HTTP ${res.status}`, 'local');
  } catch (e) {
    record('supabase storage API (local .env)', false, e.message);
  }
}

async function main() {
  if (!localOnly) await auditProduction();
  await auditLocalEnv();

  const prodResults = results.filter((r) => r.scope === 'prod');
  const localResults = results.filter((r) => r.scope === 'local');
  const prodFailed = prodResults.filter((r) => !r.ok);
  const localFailed = strict ? localResults.filter((r) => !r.ok) : [];
  const failed = [...prodFailed, ...localFailed];
  const warnings = results.filter((r) => r.warn);

  if (jsonOut) {
    console.log(JSON.stringify({
      ok: failed.length === 0,
      production: { passed: prodResults.filter((r) => r.ok).length, failed: prodFailed.length },
      local: { passed: localResults.filter((r) => r.ok && !r.warn).length, warnings: warnings.length },
      results,
    }, null, 2));
  } else {
    console.log('\n=== Rio Groove — auditoria operacional ===\n');
    if (prodResults.length) {
      console.log('--- Produção ---\n');
      for (const r of prodResults) {
        const icon = r.ok ? 'OK  ' : 'FAIL';
        console.log(`[${icon}] ${r.name}`);
        console.log(`      ${r.detail}\n`);
      }
    }
    if (localResults.length) {
      console.log('--- Ambiente local (.env) ---\n');
      for (const r of localResults) {
        const icon = r.warn ? 'WARN' : r.ok ? 'OK  ' : 'FAIL';
        console.log(`[${icon}] ${r.name}`);
        console.log(`      ${r.detail}\n`);
      }
    }
    console.log(`Produção: ${prodResults.filter((r) => r.ok).length}/${prodResults.length} OK`);
    if (warnings.length) console.log(`Local: ${warnings.length} aviso(s) (não afeta a loja em produção)`);
    if (prodFailed.length) console.log(`Falhas em produção: ${prodFailed.length}`);
    console.log('');
  }

  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
