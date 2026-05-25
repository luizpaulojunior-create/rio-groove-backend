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

const CATEGORY_PREFIXES = {
  Camisa: 'CAM',
  Regata: 'RGT',
  'Boné': 'CAP',
  Caneca: 'MUG',
  'Acessório': 'ACC'
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

function categoryUsesGender(category) {
  return category === 'Camisa' || category === 'Acessório';
}

function categoryUsesFabric(category) {
  return category === 'Camisa' || category === 'Regata' || category === 'Acessório';
}

function getModelsForCategory(category, gender) {
  if (category === 'Camisa' || category === 'Acessório') {
    return MODELS_BY_GENDER[gender] || [];
  }
  if (category === 'Regata') return MODELS_REGATA;
  if (category === 'Boné') return MODELS_BONE;
  if (category === 'Caneca') return [MODEL_CANECA];
  return [];
}

function getColorsForCategory(category) {
  if (category === 'Caneca') {
    return COLORS.filter((c) => c.key === 'wht');
  }
  return COLORS;
}

function getSizesForCategory(category) {
  if (category === 'Camisa' || category === 'Regata') return APPAREL_SIZES;
  return [ONE_SIZE];
}

function normalizeCategory(category) {
  if (category === 'Camiseta') return 'Camisa';
  return category;
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
    return `MUG-330-${String(colorKey || 'wht').toUpperCase()}-U`;
  }

  if (cat === 'Boné') {
    const prefix = getModelPrefix(model, null);
    return [prefix, String(colorKey).toUpperCase(), 'U'].filter(Boolean).join('-');
  }

  if (cat === 'Acessório') {
    const parts = ['ACC'];
    const modelPrefix = getModelPrefix(model, gender);
    if (modelPrefix) parts.push(modelPrefix);
    if (colorKey) parts.push(String(colorKey).toUpperCase());
    parts.push('U');
    if (fabric) parts.push(fabric === 'Estonada' ? 'EST' : 'LS');
    return parts.join('-');
  }

  const parts = [];
  const modelPrefix = getModelPrefix(model, gender);

  if (modelPrefix) {
    parts.push(modelPrefix);
  } else if (CATEGORY_PREFIXES[cat]) {
    parts.push(CATEGORY_PREFIXES[cat]);
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
    return `${cat}|${model}|${color_key}|${size}`;
  }
  if (cat === 'Boné') {
    return `${cat}|${model}|${color_key}|${size}`;
  }
  if (cat === 'Regata') {
    return `${cat}|${model}|${fabric}|${color_key}|${size}`;
  }
  if (cat === 'Camisa' || cat === 'Acessório') {
    return `${cat}|${gender}|${model}|${fabric}|${color_key}|${size}`;
  }
  return `${cat}|${gender}|${model}|${fabric}|${color_key}|${size}`;
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
      unit_cost: UNIT_COST_BY_CATEGORY[item.category] ?? UNIT_COST_BY_CATEGORY['Acessório']
    });
  };

  // Camisas — modelos apparel por gênero
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

  // Regatas — taxonomia separada
  for (const model of MODELS_REGATA) {
    for (const fabric of FABRICS) {
      for (const color of COLORS) {
        for (const size of APPAREL_SIZES) {
          pushItem({
            category: 'Regata',
            gender: null,
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

  // Bonés
  for (const model of MODELS_BONE) {
    for (const color of COLORS) {
      pushItem({
        category: 'Boné',
        gender: null,
        model,
        fabric: null,
        color_key: color.key,
        color_label: color.label,
        color_hex: color.hex,
        size: ONE_SIZE,
        sku: generateSKU('Boné', model, color.key, ONE_SIZE, null, null)
      });
    }
  }

  // Caneca — item único
  const canecaColor = COLORS.find((c) => c.key === 'wht');
  pushItem({
    category: 'Caneca',
    gender: null,
    model: MODEL_CANECA,
    fabric: null,
    color_key: canecaColor.key,
    color_label: canecaColor.label,
    color_hex: canecaColor.hex,
    size: ONE_SIZE,
    sku: generateSKU('Caneca', MODEL_CANECA, canecaColor.key, ONE_SIZE, null, null)
  });

  // Acessórios — fallback operacional anterior
  for (const gender of GENDERS) {
    for (const model of MODELS_BY_GENDER[gender]) {
      for (const fabric of FABRICS) {
        for (const color of COLORS) {
          pushItem({
            category: 'Acessório',
            gender,
            model,
            fabric,
            color_key: color.key,
            color_label: color.label,
            color_hex: color.hex,
            size: ONE_SIZE,
            sku: generateSKU('Acessório', model, color.key, ONE_SIZE, fabric, gender)
          });
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
  MODELS_REGATA,
  MODELS_BONE,
  MODEL_CANECA,
  FABRICS,
  APPAREL_SIZES,
  ONE_SIZE,
  COLORS,
  UNIT_COST_BY_CATEGORY,
  SEED_DEFAULTS,
  categoryUsesGender,
  categoryUsesFabric,
  getModelsForCategory,
  getColorsForCategory,
  getSizesForCategory,
  normalizeCategory,
  getModelPrefix,
  generateSKU,
  stockDedupKey,
  buildOperationalStockItems
};
