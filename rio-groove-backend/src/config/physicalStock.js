/**
 * Manifesto do estoque físico real (caderno jul/2026).
 * Camisa = Oversized Tradicional
 * Regata = Machão
 * Cropped = Cropped Oversized
 */
const {
  generateSKU,
  UNIT_COST_BY_CATEGORY,
  COLORS,
  GENDER_NEUTRAL,
  stockDedupKey,
} = require('../config/inventory');

const COLOR_META = Object.fromEntries(COLORS.map((c) => [c.key, c]));

const PHYSICAL_STOCK_ENTRIES = [
  { category: 'Camisa', gender: 'Masculino', model: 'Oversized Tradicional', color_key: 'off', size: 'G', quantity: 3 },
  { category: 'Camisa', gender: 'Masculino', model: 'Oversized Tradicional', color_key: 'off', size: 'GG', quantity: 7 },
  { category: 'Camisa', gender: 'Masculino', model: 'Oversized Tradicional', color_key: 'off', size: 'G1', quantity: 3 },

  { category: 'Camisa', gender: 'Masculino', model: 'Oversized Tradicional', color_key: 'blk', size: 'M', quantity: 4 },
  { category: 'Camisa', gender: 'Masculino', model: 'Oversized Tradicional', color_key: 'blk', size: 'G', quantity: 9 },
  { category: 'Camisa', gender: 'Masculino', model: 'Oversized Tradicional', color_key: 'blk', size: 'GG', quantity: 3 },
  { category: 'Camisa', gender: 'Masculino', model: 'Oversized Tradicional', color_key: 'blk', size: 'G1', quantity: 5 },

  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'off', size: 'P', quantity: 3 },
  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'off', size: 'M', quantity: 4 },
  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'off', size: 'GG', quantity: 3 },
  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'off', size: 'XG', quantity: 1 },

  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'blk', size: 'P', quantity: 3 },
  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'blk', size: 'M', quantity: 2 },
  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'blk', size: 'G', quantity: 2 },
  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'blk', size: 'GG', quantity: 2 },
  { category: 'Regata', gender: GENDER_NEUTRAL, model: 'Machão', color_key: 'blk', size: 'XG', quantity: 2 },

  { category: 'Camisa', gender: 'Feminino', model: 'Cropped Oversized', color_key: 'off', size: 'P', quantity: 1 },
  { category: 'Camisa', gender: 'Feminino', model: 'Cropped Oversized', color_key: 'off', size: 'M', quantity: 1 },
  { category: 'Camisa', gender: 'Feminino', model: 'Cropped Oversized', color_key: 'blk', size: 'G', quantity: 2 },
];

function buildPhysicalStockRows() {
  return PHYSICAL_STOCK_ENTRIES.map((entry) => {
    const color = COLOR_META[entry.color_key];
    if (!color) throw new Error(`Cor inválida no manifesto físico: ${entry.color_key}`);

    const fabric = 'Lisa';
    return {
      category: entry.category,
      gender: entry.gender,
      model: entry.model,
      fabric,
      color_key: entry.color_key,
      color_label: color.label,
      color_hex: color.hex,
      size: entry.size,
      quantity: entry.quantity,
      min_stock: 1,
      unit_cost: UNIT_COST_BY_CATEGORY[entry.category] || 0,
      sku: generateSKU(
        entry.category,
        entry.model,
        entry.color_key,
        entry.size,
        fabric,
        entry.gender,
      ),
      is_active: true,
    };
  });
}

function isPhysicalStockItem(row) {
  if (!row) return false;
  const desired = buildPhysicalStockRows();
  const key = stockDedupKey({
    category: row.category,
    gender: row.gender,
    model: row.model,
    fabric: row.fabric || 'Lisa',
    color_key: row.color_key,
    size: row.size,
  });
  return desired.some((item) => stockDedupKey(item) === key);
}

module.exports = {
  PHYSICAL_STOCK_ENTRIES,
  buildPhysicalStockRows,
  isPhysicalStockItem,
};
