/**
 * Taxonomia operacional Rio Groove — fonte única para seed e APIs de estoque.
 * Manter alinhado com rio-groove-admin/src/config/inventory.js
 */

const CATEGORIES = [
  'Camisa',
  'Regata',
  'Boné',
  'Caneca',
  'Acessório'
];

const GENDERS = ['Masculino', 'Feminino'];

/** Valor persistido quando a categoria não usa gênero (coluna NOT NULL no DB). */
const GENDER_NEUTRAL = 'Unissex';

/** Valor persistido quando a categoria não usa malha (coluna NOT NULL no DB). */
const FABRIC_NEUTRAL = 'N/A';

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

const MODELS_REGATA = ['Regular', 'Machão'];
const MODELS_BONE = ['Trucker', 'Dad Hat', 'Snapback'];
const MODEL_CANECA = '330ml';
const MATERIAL_CANECA = 'Porcelana';
const VALID_CANECA_SKU = 'MUG-330-WHT-U';

const FABRICS = ['Lisa', 'Estonada'];

const APPAREL_SIZES = ['P', 'M', 'G', 'GG', 'XGG'];
const ONE_SIZE = 'Tamanho Único';

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
  'Regata Cropped Boxy': 'RCB',
  Regular: 'RGT',
  'Machão': 'MCH',
  Trucker: 'TRK',
  'Dad Hat': 'DAD',
  Snapback: 'SNP',
  '330ml': '330'
};

const RELAXED_FIT_PREFIX_BY_GENDER = {
  Masculino: 'RLM',
  Feminino: 'RLF'
};

const UNIT_COST_BY_CATEGORY = {
  Camisa: 42,
  Regata: 25,
  'Boné': 25,
  Caneca: 10,
  'Acessório': 42
};

const SEED_DEFAULTS = {
  quantity: 10,
  min_stock: 5,
  is_active: true
};

const SEED_CATEGORIES = ['Camisa', 'Regata', 'Boné', 'Caneca'];

function normalizeCategory(category) {
  if (category === 'Camiseta') return 'Camisa';
  return category;
}

function categoryUsesGender(category) {
  return normalizeCategory(category) === 'Camisa';
}

function categoryUsesFabric(category) {
  const cat = normalizeCategory(category);
  return cat === 'Camisa' || cat === 'Regata';
}

function categoryUsesMaterial(category) {
  return normalizeCategory(category) === 'Caneca';
}

function categoryHasSeedGrade(category) {
  return SEED_CATEGORIES.includes(normalizeCategory(category));
}

function categoryAllowsManualCreate(category) {
  return normalizeCategory(category) !== 'Acessório';
}

function getModelsForCategory(category, gender) {
  const cat = normalizeCategory(category);
  if (cat === 'Camisa') {
    return MODELS_BY_GENDER[gender] || [];
  }
  if (cat === 'Regata') return MODELS_REGATA;
  if (cat === 'Boné') return MODELS_BONE;
  if (cat === 'Caneca') return [MODEL_CANECA];
  if (cat === 'Acessório') return [];
  return [];
}

function getMaterialsForCategory(category) {
  if (normalizeCategory(category) === 'Caneca') return [MATERIAL_CANECA];
  return [];
}

function getColorsForCategory(category) {
  if (normalizeCategory(category) === 'Caneca') {
    return COLORS.filter((c) => c.key === 'wht');
  }
  return COLORS;
}

function getSizesForCategory(category) {
  const cat = normalizeCategory(category);
  if (cat === 'Camisa' || cat === 'Regata') return APPAREL_SIZES;
  return [ONE_SIZE];
}

function getModelPrefix(model, gender) {
  if (model === 'Relaxed Fit' && gender && RELAXED_FIT_PREFIX_BY_GENDER[gender]) {
    return RELAXED_FIT_PREFIX_BY_GENDER[gender];
  }
  return MODEL_PREFIXES[model] || null;
}

function generateSKU(category, model, colorKey, size, fabric, gender) {
  const cat = normalizeCategory(category);

  if (cat === 'Caneca') {
    return VALID_CANECA_SKU;
  }

  if (cat === 'Boné') {
    const prefix = getModelPrefix(model, null);
    return [prefix, String(colorKey).toUpperCase(), 'U'].filter(Boolean).join('-');
  }

  if (cat === 'Acessório') {
    return null;
  }

  const parts = [];
  const modelPrefix = getModelPrefix(model, gender);

  if (modelPrefix) {
    parts.push(modelPrefix);
  } else if (model) {
    parts.push(model.substring(0, 3).toUpperCase());
  } else {
    parts.push('SKU');
  }

  if (colorKey) {
    parts.push(String(colorKey).toUpperCase());
  }

  if (size) {
    const sizeStr = size === ONE_SIZE ? 'U' : size;
    parts.push(String(sizeStr).toUpperCase());
  }

  if (fabric && categoryUsesFabric(cat)) {
    parts.push(fabric === 'Estonada' ? 'EST' : 'LS');
  }

  return parts.join('-');
}

function stockDedupKey({ category, gender, model, fabric, color_key, size }) {
  const cat = normalizeCategory(category);

  if (cat === 'Caneca') {
    return `${cat}|${MODEL_CANECA}|${color_key}|${size}`;
  }
  if (cat === 'Boné') {
    return `${cat}|${model}|${color_key}|${size}`;
  }
  if (cat === 'Regata') {
    return `${cat}|${model}|${fabric}|${color_key}|${size}`;
  }
  if (cat === 'Camisa') {
    return `${cat}|${gender}|${model}|${fabric}|${color_key}|${size}`;
  }
  return `${cat}|${gender}|${model}|${fabric}|${color_key}|${size}`;
}

function classifyLegacyInvalidStockItem(row) {
  const cat = normalizeCategory(row.category);
  const sku = String(row.sku || '');

  if (cat === 'Acessório' || sku.startsWith('ACC-')) {
    return 'accessory';
  }
  if (cat === 'Boné' && (!MODELS_BONE.includes(row.model) || sku.startsWith('CAP-'))) {
    return 'invalid_bone';
  }
  if (sku.startsWith('MUG-') && sku !== VALID_CANECA_SKU) {
    return 'invalid_mug';
  }
  if (cat === 'Caneca' && sku !== VALID_CANECA_SKU) {
    return 'invalid_mug';
  }
  return null;
}

function isLegacyInvalidStockItem(row) {
  return classifyLegacyInvalidStockItem(row) !== null;
}

function buildOperationalStockItems(defaults = SEED_DEFAULTS) {
  const items = [];

  const pushItem = (item) => {
    items.push({
      ...item,
      category: normalizeCategory(item.category),
      quantity: defaults.quantity,
      min_stock: defaults.min_stock,
      is_active: defaults.is_active,
      unit_cost: UNIT_COST_BY_CATEGORY[item.category] ?? UNIT_COST_BY_CATEGORY.Camisa
    });
  };

  for (const gender of GENDERS) {
    for (const model of MODELS_BY_GENDER[gender]) {
      for (const fabric of FABRICS) {
        for (const color of COLORS) {
          for (const size of APPAREL_SIZES) {
            pushItem({
              category: 'Camisa',
              gender,
              model,
              fabric,
              color_key: color.key,
              color_label: color.label,
              color_hex: color.hex,
              size,
              sku: generateSKU('Camisa', model, color.key, size, fabric, gender)
            });
          }
        }
      }
    }
  }

  for (const model of MODELS_REGATA) {
    for (const fabric of FABRICS) {
      for (const color of COLORS) {
        for (const size of APPAREL_SIZES) {
          pushItem({
            category: 'Regata',
            gender: GENDER_NEUTRAL,
            model,
            fabric,
            color_key: color.key,
            color_label: color.label,
            color_hex: color.hex,
            size,
            sku: generateSKU('Regata', model, color.key, size, fabric, null)
          });
        }
      }
    }
  }

  for (const model of MODELS_BONE) {
    for (const color of COLORS) {
      pushItem({
        category: 'Boné',
        gender: GENDER_NEUTRAL,
        model,
        fabric: FABRIC_NEUTRAL,
        color_key: color.key,
        color_label: color.label,
        color_hex: color.hex,
        size: ONE_SIZE,
        sku: generateSKU('Boné', model, color.key, ONE_SIZE, null, null)
      });
    }
  }

  const canecaColor = COLORS.find((c) => c.key === 'wht');
  pushItem({
    category: 'Caneca',
    gender: GENDER_NEUTRAL,
    model: MODEL_CANECA,
    fabric: FABRIC_NEUTRAL,
    color_key: canecaColor.key,
    color_label: canecaColor.label,
    color_hex: canecaColor.hex,
    size: ONE_SIZE,
    sku: VALID_CANECA_SKU
  });

  return items;
}

module.exports = {
  CATEGORIES,
  GENDERS,
  GENDER_NEUTRAL,
  FABRIC_NEUTRAL,
  MODELS_BY_GENDER,
  MODELS_REGATA,
  MODELS_BONE,
  MODEL_CANECA,
  MATERIAL_CANECA,
  VALID_CANECA_SKU,
  FABRICS,
  APPAREL_SIZES,
  ONE_SIZE,
  COLORS,
  UNIT_COST_BY_CATEGORY,
  SEED_DEFAULTS,
  SEED_CATEGORIES,
  categoryUsesGender,
  categoryUsesFabric,
  categoryUsesMaterial,
  categoryHasSeedGrade,
  categoryAllowsManualCreate,
  getModelsForCategory,
  getMaterialsForCategory,
  getColorsForCategory,
  getSizesForCategory,
  normalizeCategory,
  getModelPrefix,
  generateSKU,
  stockDedupKey,
  classifyLegacyInvalidStockItem,
  isLegacyInvalidStockItem,
  buildOperationalStockItems
};
