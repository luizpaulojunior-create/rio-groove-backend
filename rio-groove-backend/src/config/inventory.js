/**
 * Taxonomia operacional Rio Groove — fonte única para seed e APIs de estoque.
 * Manter alinhado com rio-groove-admin/src/config/inventory.js
 */

const CATEGORIES = [
  'Camisa',
  'Camiseta',
  'Boné',
  'Caneca',
  'Acessório'
];

const GENDERS = ['Masculino', 'Feminino'];

const MODELS_BY_GENDER = {
  Masculino: [
    'Oversized Boxy',
    'Relaxed Fit',
    'Regular Fit',
    'Oversized Tradicional'
  ],
  Feminino: [
    'Baby Tee Altíssima',
    'Oversized Feminina',
    'Boxy Cropped',
    'Relaxed Fit',
    'Cropped Tradicional',
    'Regata Cropped Boxy'
  ]
};

const FABRICS = ['Lisa', 'Estonada'];

const APPAREL_SIZES = ['P', 'M', 'G', 'GG', 'XGG'];
const ONE_SIZE = 'Tamanho Único';

const APPAREL_CATEGORIES = ['Camisa', 'Camiseta'];
const ACCESSORY_CATEGORIES = ['Boné', 'Caneca', 'Acessório'];

const COLORS = [
  { label: 'Black', key: 'blk', hex: '#000000' },
  { label: 'Off White', key: 'off', hex: '#F5F1E8' },
  { label: 'White', key: 'wht', hex: '#FFFFFF' },
  { label: 'Verde', key: 'grn', hex: '#2D5016' },
  { label: 'Vermelho', key: 'red', hex: '#8B0000' }
];

const MODEL_PREFIXES = {
  'Oversized Boxy': 'OVR',
  'Regular Fit': 'REG',
  'Oversized Tradicional': 'OVT',
  'Baby Tee Altíssima': 'BTA',
  'Oversized Feminina': 'OVF',
  'Boxy Cropped': 'BOX',
  'Cropped Tradicional': 'CRO',
  'Regata Cropped Boxy': 'RCB'
};

const RELAXED_FIT_PREFIX_BY_GENDER = {
  Masculino: 'RLM',
  Feminino: 'RLF'
};

const CATEGORY_PREFIXES = {
  Camisa: 'CAM',
  Camiseta: 'TSH',
  'Boné': 'CAP',
  Caneca: 'MUG',
  'Acessório': 'ACC'
};

const SEED_DEFAULTS = {
  quantity: 10,
  min_stock: 5,
  unit_cost: 42.0,
  is_active: true
};

function getModelPrefix(model, gender) {
  if (model === 'Relaxed Fit' && gender && RELAXED_FIT_PREFIX_BY_GENDER[gender]) {
    return RELAXED_FIT_PREFIX_BY_GENDER[gender];
  }
  return MODEL_PREFIXES[model] || null;
}

function generateSKU(category, model, colorKey, size, fabric, gender) {
  const parts = [];

  if (ACCESSORY_CATEGORIES.includes(category) && CATEGORY_PREFIXES[category]) {
    parts.push(CATEGORY_PREFIXES[category]);
    const modelPrefix = getModelPrefix(model, gender);
    if (modelPrefix) {
      parts.push(modelPrefix);
    }
  } else {
    const modelPrefix = getModelPrefix(model, gender);
    if (modelPrefix) {
      parts.push(modelPrefix);
    } else if (category && CATEGORY_PREFIXES[category]) {
      parts.push(CATEGORY_PREFIXES[category]);
    } else if (model) {
      parts.push(model.substring(0, 3).toUpperCase());
    } else {
      parts.push('SKU');
    }
  }

  if (colorKey) {
    parts.push(String(colorKey).toUpperCase());
  }

  if (size) {
    const sizeStr = size === ONE_SIZE ? 'U' : size;
    parts.push(String(sizeStr).toUpperCase());
  }

  if (fabric) {
    parts.push(fabric === 'Estonada' ? 'EST' : 'LS');
  }

  return parts.join('-');
}

function stockDedupKey({ category, gender, model, fabric, color_key, size }) {
  if (ACCESSORY_CATEGORIES.includes(category)) {
    return `${category}|${gender}|${model}|${fabric}|${color_key}|${size}`;
  }
  return `${gender}|${model}|${fabric}|${color_key}|${size}`;
}

function buildOperationalStockItems(defaults = SEED_DEFAULTS) {
  const items = [];
  const seenApparel = new Set();

  for (const category of CATEGORIES) {
    const sizes = ACCESSORY_CATEGORIES.includes(category)
      ? [ONE_SIZE]
      : APPAREL_SIZES;

    for (const gender of GENDERS) {
      const models = MODELS_BY_GENDER[gender] || [];

      for (const model of models) {
        for (const fabric of FABRICS) {
          for (const color of COLORS) {
            for (const size of sizes) {
              const storedCategory = APPAREL_CATEGORIES.includes(category)
                ? 'Camiseta'
                : category;

              const base = {
                category: storedCategory,
                gender,
                model,
                fabric,
                color_key: color.key,
                color_label: color.label,
                color_hex: color.hex,
                size
              };

              if (APPAREL_CATEGORIES.includes(category)) {
                const apparelKey = stockDedupKey(base);
                if (seenApparel.has(apparelKey)) continue;
                seenApparel.add(apparelKey);
              }

              items.push({
                ...base,
                sku: generateSKU(category, model, color.key, size, fabric, gender),
                quantity: defaults.quantity,
                min_stock: defaults.min_stock,
                unit_cost: defaults.unit_cost,
                is_active: defaults.is_active
              });
            }
          }
        }
      }
    }
  }

  return items;
}

module.exports = {
  CATEGORIES,
  GENDERS,
  MODELS_BY_GENDER,
  FABRICS,
  APPAREL_SIZES,
  ONE_SIZE,
  APPAREL_CATEGORIES,
  ACCESSORY_CATEGORIES,
  COLORS,
  SEED_DEFAULTS,
  getModelPrefix,
  generateSKU,
  stockDedupKey,
  buildOperationalStockItems
};
