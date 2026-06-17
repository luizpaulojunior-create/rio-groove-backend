const supabase = require('../lib/supabase');

const CONFIG_ID = 'default';

const DTF_INSUMOS = ['Camisa', 'Cropped', 'Regata', 'Caneca', 'Boné'];

const DEFAULT_CONFIG = {
  blank_unit_cost: {
    Camisa: 42,
    Regata: 25,
    Boné: 25,
    Caneca: 10,
    Acessório: 42,
  },
  dtf_transfer_cost: {
    Camisa: 0,
    Cropped: 0,
    Regata: 0,
    Caneca: 0,
    Boné: 0,
  },
  dtf_selling: {
    ready_art_discount: 20,
    exclusive_art_fee: {
      Camisa: 79.9,
      Cropped: 79.9,
      Regata: 79.9,
      Caneca: 49.9,
      Boné: 39.9,
    },
    printed_product_price: {
      Camisa: 99.9,
      Cropped: 39.9,
      Regata: 39.9,
      Boné: 29.9,
      Caneca: 29.9,
    },
  },
  catalog_selling_price: {
    Camisa: 0,
    Regata: 0,
    Boné: 0,
    Caneca: 0,
    Acessório: 0,
  },
  dre_monthly_expenses: {},
};

let cachedConfig = null;
let cachedUpdatedAt = null;

function parseMoney(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.round(num * 100) / 100;
}

function mergeNumericMap(defaults, overrides) {
  const result = { ...defaults };
  if (!overrides || typeof overrides !== 'object') return result;
  for (const key of Object.keys(defaults)) {
    if (overrides[key] !== undefined && overrides[key] !== null && overrides[key] !== '') {
      result[key] = parseMoney(overrides[key], defaults[key]);
    }
  }
  return result;
}

function normalizeExpensesMap(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const result = {};
  for (const [monthKey, values] of Object.entries(raw)) {
    if (!values || typeof values !== 'object') continue;
    result[monthKey] = {
      payroll: parseMoney(values.payroll, 0),
      marketing: parseMoney(values.marketing, 0),
      rent: parseMoney(values.rent, 0),
      utilities: parseMoney(values.utilities, 0),
      other: parseMoney(values.other, 0),
    };
  }
  return result;
}

function normalizeConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const selling = source.dtf_selling && typeof source.dtf_selling === 'object' ? source.dtf_selling : {};

  return {
    blank_unit_cost: mergeNumericMap(DEFAULT_CONFIG.blank_unit_cost, source.blank_unit_cost),
    dtf_transfer_cost: mergeNumericMap(DEFAULT_CONFIG.dtf_transfer_cost, source.dtf_transfer_cost),
    dtf_selling: {
      ready_art_discount: parseMoney(
        selling.ready_art_discount,
        DEFAULT_CONFIG.dtf_selling.ready_art_discount,
      ),
      exclusive_art_fee: mergeNumericMap(
        DEFAULT_CONFIG.dtf_selling.exclusive_art_fee,
        selling.exclusive_art_fee,
      ),
      printed_product_price: mergeNumericMap(
        DEFAULT_CONFIG.dtf_selling.printed_product_price,
        selling.printed_product_price,
      ),
    },
    catalog_selling_price: mergeNumericMap(
      DEFAULT_CONFIG.catalog_selling_price,
      source.catalog_selling_price,
    ),
    dre_monthly_expenses: normalizeExpensesMap(source.dre_monthly_expenses),
  };
}

function getConfig() {
  return cachedConfig || DEFAULT_CONFIG;
}

function getConfigMeta() {
  return {
    config: getConfig(),
    updated_at: cachedUpdatedAt,
  };
}

function getBlankUnitCosts() {
  return getConfig().blank_unit_cost;
}

function getBlankUnitCost(category) {
  const map = getBlankUnitCosts();
  return map[category] ?? map.Camisa ?? 0;
}

function getDtfTransferCost(insumo) {
  const map = getConfig().dtf_transfer_cost;
  return map[insumo] ?? 0;
}

function getReadyArtDiscount() {
  return getConfig().dtf_selling.ready_art_discount;
}

function getExclusiveArtFee(insumo) {
  const fee = getConfig().dtf_selling.exclusive_art_fee[insumo];
  return fee == null ? null : fee;
}

function getPrintedProductUnitPrice(insumo) {
  const price = getConfig().dtf_selling.printed_product_price[insumo];
  return price == null ? null : price;
}

async function loadInsumoCostConfig() {
  try {
    const { data, error } = await supabase
      .from('insumo_cost_config')
      .select('config, updated_at')
      .eq('id', CONFIG_ID)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        console.warn('[insumoCosts] Tabela insumo_cost_config ausente — usando defaults em memória');
        cachedConfig = { ...DEFAULT_CONFIG };
        return cachedConfig;
      }
      throw error;
    }

    cachedConfig = normalizeConfig(data?.config);
    cachedUpdatedAt = data?.updated_at || null;
    return cachedConfig;
  } catch (err) {
    console.error('[insumoCosts] Falha ao carregar config:', err.message);
    cachedConfig = { ...DEFAULT_CONFIG };
    return cachedConfig;
  }
}

async function saveInsumoCostConfig(payload) {
  const next = normalizeConfig(payload);
  const { data, error } = await supabase
    .from('insumo_cost_config')
    .upsert(
      {
        id: CONFIG_ID,
        config: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('config, updated_at')
    .single();

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      throw new Error('Tabela insumo_cost_config não encontrada. Execute supabase/36_insumo_cost_config.sql');
    }
    throw error;
  }

  cachedConfig = normalizeConfig(data.config);
  cachedUpdatedAt = data.updated_at;
  return { config: cachedConfig, updated_at: data.updated_at };
}

module.exports = {
  CONFIG_ID,
  DTF_INSUMOS,
  DEFAULT_CONFIG,
  getConfig,
  getConfigMeta,
  getBlankUnitCosts,
  getBlankUnitCost,
  getDtfTransferCost,
  getReadyArtDiscount,
  getExclusiveArtFee,
  getPrintedProductUnitPrice,
  loadInsumoCostConfig,
  saveInsumoCostConfig,
  normalizeConfig,
};
