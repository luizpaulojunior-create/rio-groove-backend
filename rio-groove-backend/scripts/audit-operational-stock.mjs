/**
 * Audita stock_items vs catálogo operacional.
 * node scripts/audit-operational-stock.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const envPath = path.join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const {
  buildOperationalCatalogStockItems,
  isOperationalCatalogStockItem,
  stockDedupKey,
  normalizeCategory,
} = require('../src/config/inventory');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL e chave ausentes no .env');
  process.exit(1);
}

const expected = buildOperationalCatalogStockItems({ quantity: 10, min_stock: 5, is_active: true });
const expectedBySku = new Map(expected.map((i) => [i.sku, i]));
const expectedKeys = new Set(expected.map((i) => stockDedupKey(i)));

const res = await fetch(
  `${url}/rest/v1/stock_items?select=id,sku,category,gender,model,fabric,color_key,size,quantity,is_active&order=category,model,color_key,size`,
  {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  }
);

if (!res.ok) {
  console.error('Falha ao ler stock_items:', res.status, await res.text());
  process.exit(1);
}

const rows = await res.json();
const invalid = [];
const valid = [];
const missing = [];

for (const row of rows) {
  const ok = isOperationalCatalogStockItem(row);
  if (ok) valid.push(row);
  else invalid.push(row);
}

for (const item of expected) {
  const keyStr = stockDedupKey(item);
  const found = rows.some(
    (r) =>
      stockDedupKey({
        category: normalizeCategory(r.category),
        gender: r.gender,
        model: r.model,
        fabric: r.fabric,
        color_key: r.color_key,
        size: r.size,
      }) === keyStr
  );
  if (!found) missing.push(item);
}

function groupSummary(list, fields) {
  const map = new Map();
  for (const row of list) {
    const k = fields.map((f) => row[f] ?? '').join(' | ');
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

console.log('=== AUDITORIA ESTOQUE ===\n');
console.log(`Esperado (catálogo): ${expected.length} SKUs`);
console.log(`No banco:            ${rows.length} linhas`);
console.log(`Válidas:             ${valid.length}`);
console.log(`INVÁLIDAS:           ${invalid.length}`);
console.log(`Faltando:            ${missing.length}\n`);

if (invalid.length) {
  console.log('--- LINHAS QUE NÃO DEVERIAM ESTAR ---');
  const byModel = groupSummary(invalid, ['category', 'gender', 'model', 'color_key']);
  for (const [k, n] of byModel) console.log(`  ${n}x  ${k}`);
  console.log('\nAmostra SKUs inválidos:');
  invalid.slice(0, 15).forEach((r) => {
    console.log(`  ${r.sku} | ${r.category} | ${r.gender} | ${r.model} | ${r.color_key} | qty=${r.quantity} active=${r.is_active}`);
  });
  if (invalid.length > 15) console.log(`  ... +${invalid.length - 15} mais`);
}

if (missing.length) {
  console.log('\n--- SKUs DO CATÁLOGO AUSENTES ---');
  missing.slice(0, 15).forEach((i) => console.log(`  ${i.sku} | ${i.model} | ${i.color_key} | ${i.size}`));
  if (missing.length > 15) console.log(`  ... +${missing.length - 15} mais`);
}

const validGroups = groupSummary(valid, ['category', 'gender', 'model']);
console.log('\n--- CATÁLOGO VÁLIDO (resumo) ---');
for (const [k, n] of validGroups) console.log(`  ${n} SKUs | ${k}`);

const wrongQty = valid.filter((r) => Number(r.quantity) !== 10);
if (wrongQty.length) {
  console.log(`\n--- Qtd ≠ 10 (${wrongQty.length} SKUs — você pode ter ajustado manualmente) ---`);
  wrongQty.slice(0, 10).forEach((r) => console.log(`  ${r.sku}: ${r.quantity}`));
}

process.exit(invalid.length > 0 || missing.length > 0 ? 1 : 0);
