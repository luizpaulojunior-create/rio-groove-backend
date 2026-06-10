/**
 * Gera SQL idempotente para SKUs amarelos (Camisa, Regata, Boné) com quantity=10.
 * Execute no Supabase SQL Editor se o script sync-yellow-stock.js não puder rodar localmente.
 *
 *   node scripts/generate-yellow-stock-sql.js > ../supabase/20_sync_yellow_stock.sql
 */
const fs = require('fs');
const path = require('path');
const {
  buildOperationalStockItems,
  normalizeCategory,
  GENDER_NEUTRAL,
  FABRIC_NEUTRAL,
  categoryUsesFabric,
  SEED_DEFAULTS
} = require('../src/config/inventory');

const QUANTITY = 10;
const MIN_STOCK = 5;

function sqlString(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

const items = buildOperationalStockItems({ ...SEED_DEFAULTS, quantity: QUANTITY })
  .filter(
    (item) =>
      item.color_key === 'yel' &&
      ['Camisa', 'Regata', 'Boné'].includes(normalizeCategory(item.category))
  )
  .map((item) => {
    const cat = normalizeCategory(item.category);
    return {
      ...item,
      gender: item.gender || GENDER_NEUTRAL,
      fabric: item.fabric || (categoryUsesFabric(cat) ? 'Lisa' : FABRIC_NEUTRAL),
      quantity: QUANTITY,
      min_stock: MIN_STOCK,
      is_active: true
    };
  });

const lines = [
  '-- Rio Groove — sincronizar estoque amarelo (Camisa, Regata, Boné) com 10 un.',
  'BEGIN;',
  ''
];

for (const item of items) {
  lines.push(`INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  ${sqlString(item.category)},
  ${sqlString(item.gender)},
  ${sqlString(item.model)},
  ${sqlString(item.fabric)},
  ${sqlString(item.color_key)},
  ${sqlString(item.color_label)},
  ${sqlString(item.color_hex)},
  ${sqlString(item.size)},
  ${QUANTITY},
  ${MIN_STOCK},
  ${Number(item.unit_cost)},
  ${sqlString(item.sku)},
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;`);
  lines.push('');
}

lines.push(`UPDATE stock_items
SET quantity = ${QUANTITY}
WHERE color_key = 'yel'
  AND category IN ('Camisa', 'Regata', 'Boné');`);
lines.push('');
lines.push('COMMIT;');
lines.push('');

const outPath = path.join(__dirname, '../../../rio-groove-admin/supabase/20_sync_yellow_stock.sql');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Generated ${items.length} SKU statements -> ${outPath}`);
