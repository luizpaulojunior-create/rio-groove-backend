/**
 * Mostra apenas formato das chaves (sem expor valor completo).
 * node scripts/check-env-keys.mjs
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

function classify(key) {
  if (!key) return { kind: 'ausente', works: null };
  if (key.startsWith('eyJ')) return { kind: 'legacy-jwt (eyJ…)', works: 'pode estar desabilitada no REST' };
  if (key.startsWith('sb_publishable_')) return { kind: 'publishable nova', works: 'ok' };
  if (key.startsWith('sb_secret_') || key.startsWith('sbp_')) return { kind: 'secret nova', works: 'ok' };
  return { kind: 'formato desconhecido', works: '?' };
}

if (!existsSync(envPath)) {
  console.log('Sem .env local');
  process.exit(0);
}

const vars = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
}

for (const name of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY']) {
  const v = vars[name] || '';
  const c = classify(v);
  console.log(`${name}: ${c.kind} (len=${v.length || 0})`);
}

const url = vars.SUPABASE_URL;
const key = vars.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const body = await res.text();
  const legacy = body.includes('Legacy API keys are disabled');
  console.log(`Teste REST local: HTTP ${res.status}${legacy ? ' — Legacy API keys are disabled' : res.ok ? ' — OK' : ''}`);
}
