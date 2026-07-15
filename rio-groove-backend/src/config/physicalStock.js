/**
 * Manifesto do estoque físico real (caderno jul/2026).
 * Camisa = Oversized Tradicional → P, M, G, GG, XGG
 * Regata = Machão → P, M, G, GG, XGG
 * Cropped = Cropped Oversized → P, M, G (somente)
 * G1 / XG no caderno = XGG
 * Tamanhos ausentes no caderno entram com quantity 0.
 */
const {
  generateSKU,
  UNIT_COST_BY_CATEGORY,
  COLORS,
  GENDER_NEUTRAL,
  stockDedupKey,
} = require('../config/inventory');

const COLOR_META = Object.fromEntries(COLORS.map((c) => [c.key, c]));

const SIZES_FULL = ['P', 'M', 'G', 'GG', 'XGG'];
const SIZES_CROPPED = ['P', 'M', 'G'];

/** Quantidades explícitas do caderno (após mapear G1/XG → XGG). */
const COUNTED = {
  'Camisa|Masculino|Oversized Tradicional|off|G': 3,
  'Camisa|Masculino|Oversized Tradicional|off|GG': 7,
  'Camisa|Masculino|Oversized Tradicional|off|XGG': 3,
  'Camisa|Masculino|Oversized Tradicional|blk|M': 4,
  'Camisa|Masculino|Oversized Tradicional|blk|G': 9,
  'Camisa|Masculino|Oversized Tradicional|blk|GG': 3,
  'Camisa|Masculino|Oversized Tradicional|blk|XGG': 5,
  'Regata|Unissex|Machão|off|P': 3,
  'Regata|Unissex|Machão|off|M': 4,
  'Regata|Unissex|Machão|off|GG': 3,
  'Regata|Unissex|Machão|off|XGG': 1,
  'Regata|Unissex|Machão|blk|P': 3,
  'Regata|Unissex|Machão|blk|M': 2,
  'Regata|Unissex|Machão|blk|G': 2,
  'Regata|Unissex|Machão|blk|GG': 2,
  'Regata|Unissex|Machão|blk|XGG': 2,
  'Camisa|Feminino|Cropped Oversized|off|P': 1,
  'Camisa|Feminino|Cropped Oversized|off|M': 1,
  'Camisa|Feminino|Cropped Oversized|blk|G': 2,
};

const LINES = [
  {
    category: 'Camisa',
    gender: 'Masculino',
    model: 'Oversized Tradicional',
    colorKeys: ['off', 'blk'],
    sizes: SIZES_FULL,
  },
  {
    category: 'Regata',
    gender: GENDER_NEUTRAL,
    model: 'Machão',
    colorKeys: ['off', 'blk'],
    sizes: SIZES_FULL,
  },
  {
    category: 'Camisa',
    gender: 'Feminino',
    model: 'Cropped Oversized',
    colorKeys: ['off', 'blk'],
    sizes: SIZES_CROPPED,
  },
];

function buildPhysicalStockEntries() {
  const entries = [];
  for (const line of LINES) {
    for (const color_key of line.colorKeys) {
      for (const size of line.sizes) {
        const key = `${line.category}|${line.gender}|${line.model}|${color_key}|${size}`;
        entries.push({
          category: line.category,
          gender: line.gender,
          model: line.model,
          color_key,
          size,
          quantity: COUNTED[key] ?? 0,
        });
      }
    }
  }
  return entries;
}

const PHYSICAL_STOCK_ENTRIES = buildPhysicalStockEntries();

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
      min_stock: entry.quantity > 0 ? 1 : 0,
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
  SIZES_FULL,
  SIZES_CROPPED,
  PHYSICAL_STOCK_ENTRIES,
  buildPhysicalStockRows,
  isPhysicalStockItem,
};
