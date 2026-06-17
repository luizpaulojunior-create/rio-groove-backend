const supabase = require('../lib/supabase');
const { getStock } = require('./stock.service');
const {
  DTF_INSUMOS,
  getConfig,
} = require('./insumoCosts.service');
const {
  buildGeneralCostsBreakdown,
  GENERAL_COST_GROUPS,
  GENERAL_COST_LABELS,
} = require('../config/generalCosts');

const CATALOG_CATEGORIES = ['Camisa', 'Regata', 'Boné', 'Caneca', 'Acessório'];

const PAID_STATUSES = new Set(['paid', 'pagamento_aprovado', 'fulfilled']);
const CANCELLED_STATUSES = new Set(['cancelled', 'cancelado', 'refunded', 'payment_failed']);

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function marginPct(profit, sale) {
  if (!sale || sale <= 0) return null;
  return round2((profit / sale) * 100);
}

function blankCategoryForDtf(insumo) {
  if (insumo === 'Cropped') return 'Camisa';
  return insumo;
}

function dtfInsumoForCategory(category) {
  if (category === 'Camisa') return 'Camisa';
  if (category === 'Acessório') return null;
  if (DTF_INSUMOS.includes(category)) return category;
  return null;
}

function resolveCustomInsumo(order) {
  if (order.insumo === 'Camisa' && String(order.segmento || '').toLowerCase() === 'cropped') {
    return 'Cropped';
  }
  return order.insumo;
}

function skuToCategory(sku) {
  const value = String(sku || '').trim().toUpperCase();
  if (!value) return 'Camisa';
  if (value.startsWith('MUG-')) return 'Caneca';
  if (value.startsWith('CAP-') || value.startsWith('TRK-') || value.startsWith('DAD-') || value.startsWith('SNP-')) {
    return 'Boné';
  }
  if (value.startsWith('RGT-') || value.startsWith('MCH-')) return 'Regata';
  return 'Camisa';
}

function isPaidCatalogOrder(order) {
  if (CANCELLED_STATUSES.has(String(order.status || '').toLowerCase())) return false;
  if (order.fulfillment_status === 'cancelado') return false;
  if (order.paid_at) return true;
  if (order.payment_status === 'paid' || order.payment_status === 'approved') return true;
  return PAID_STATUSES.has(String(order.status || '').toLowerCase());
}

function parseMonthParam(monthStr) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthStr || '').trim());
  const now = new Date();
  if (!match) {
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return { year: now.getFullYear(), month: now.getMonth() + 1, key };
  }
  return { year: Number(match[1]), month: Number(match[2]), key: monthStr };
}

function monthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function isDateInMonth(isoDate, start, end) {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  return date >= start && date < end;
}

function unitCogs(config, { category, dtfInsumo, stockBySku, sku }) {
  const skuKey = String(sku || '').trim().toUpperCase();
  if (skuKey && stockBySku.has(skuKey)) {
    return round2(stockBySku.get(skuKey));
  }

  const blank = round2(config.blank_unit_cost?.[category] || 0);
  if (!dtfInsumo) return blank;
  return round2(blank + (config.dtf_transfer_cost?.[dtfInsumo] || 0));
}

function customUnitCogs(config, order) {
  const insumo = resolveCustomInsumo(order);
  const category = blankCategoryForDtf(insumo);
  const blank = round2(config.blank_unit_cost?.[category] || 0);
  const dtf = round2(config.dtf_transfer_cost?.[insumo] || 0);
  return round2(blank + dtf);
}

function buildUnitEconomics(config = getConfig()) {
  const rows = [];

  for (const category of CATALOG_CATEGORIES) {
    const salePrice = round2(config.catalog_selling_price?.[category] || 0);
    const dtfInsumo = dtfInsumoForCategory(category);
    const cogs = unitCogs(config, { category, dtfInsumo, stockBySku: new Map() });
    const profit = round2(salePrice - cogs);

    rows.push({
      id: `catalog-${category}`,
      section: 'Catálogo',
      label: category,
      saleType: 'Peça catálogo',
      salePrice,
      cogs,
      profit,
      marginPct: marginPct(profit, salePrice),
    });
  }

  const selling = config.dtf_selling || {};
  const discount = round2(selling.ready_art_discount || 0);

  for (const insumo of DTF_INSUMOS) {
    const category = blankCategoryForDtf(insumo);
    const cogs = round2(
      (config.blank_unit_cost?.[category] || 0) + (config.dtf_transfer_cost?.[insumo] || 0),
    );
    const artFee = round2(selling.exclusive_art_fee?.[insumo] || 0);
    const productPrice = round2(selling.printed_product_price?.[insumo] || 0);
    const packageTotal = round2(artFee + productPrice);
    const readyPrice = round2(packageTotal - discount);

    rows.push({
      id: `ready-${insumo}`,
      section: 'Personalizado',
      label: insumo,
      saleType: 'Arte pronta (peça)',
      salePrice: readyPrice,
      cogs,
      profit: round2(readyPrice - cogs),
      marginPct: marginPct(round2(readyPrice - cogs), readyPrice),
    });

    rows.push({
      id: `exclusive-piece-${insumo}`,
      section: 'Personalizado',
      label: insumo,
      saleType: 'Peça (arte exclusiva)',
      salePrice: productPrice,
      cogs,
      profit: round2(productPrice - cogs),
      marginPct: marginPct(round2(productPrice - cogs), productPrice),
    });

    rows.push({
      id: `exclusive-art-${insumo}`,
      section: 'Personalizado',
      label: insumo,
      saleType: 'Taxa arte exclusiva',
      salePrice: artFee,
      cogs: 0,
      profit: artFee,
      marginPct: artFee > 0 ? 100 : null,
    });
  }

  return rows;
}

async function loadStockCostMap() {
  const stockItems = await getStock().catch(() => []);
  const map = new Map();
  for (const item of stockItems || []) {
    const sku = String(item.sku || '').trim().toUpperCase();
    if (!sku) continue;
    map.set(sku, round2(item.unit_cost));
  }
  return map;
}

async function loadCatalogOrders(start, end) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    if (error.code === 'PGRST205') return [];
    throw error;
  }

  return (data || []).filter((order) => {
    if (!isPaidCatalogOrder(order)) return false;
    const paidAt = order.paid_at || order.created_at;
    return isDateInMonth(paidAt, start, end);
  });
}

async function loadCustomOrders(start, end) {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('*')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return [];
    throw error;
  }

  return (data || []).filter((order) => {
    const productPaid = order.product_payment_status === 'paid'
      && isDateInMonth(order.product_paid_at, start, end);
    const artPaid = order.art_payment_status === 'paid'
      && isDateInMonth(order.art_fee_paid_at, start, end);
    return productPaid || artPaid;
  });
}

function aggregateCatalogOrders(orders, config, stockBySku) {
  let revenueProducts = 0;
  let revenueShipping = 0;
  let cogs = 0;
  let itemsSold = 0;

  for (const order of orders) {
    revenueShipping += round2(order.shipping_amount || 0);
    const items = order.order_items || order.items || [];
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      itemsSold += qty;
      const lineRevenue = round2(
        item.line_total ?? (Number(item.unit_price || item.price || 0) * qty),
      );
      revenueProducts += lineRevenue;

      const category = skuToCategory(item.sku);
      const dtfInsumo = dtfInsumoForCategory(category);
      const itemCogs = unitCogs(config, {
        category,
        dtfInsumo,
        stockBySku,
        sku: item.sku,
      });
      cogs += round2(itemCogs * qty);
    }
  }

  return {
    revenueProducts: round2(revenueProducts),
    revenueShipping: round2(revenueShipping),
    cogs: round2(cogs),
    itemsSold,
    ordersCount: orders.length,
  };
}

function aggregateCustomOrders(orders, config, start, end) {
  let revenueProducts = 0;
  let revenueArt = 0;
  let revenueShipping = 0;
  let cogs = 0;
  let piecesSold = 0;
  let ordersCount = 0;

  for (const order of orders) {
    if (String(order.status || '').toLowerCase() === 'cancelled') continue;

    const qty = Math.max(1, Number(order.quantity) || 1);
    const unitCogsValue = customUnitCogs(config, order);
    let countedOrder = false;

    if (
      order.product_payment_status === 'paid'
      && isDateInMonth(order.product_paid_at || order.updated_at, start, end)
    ) {
      const productRevenue = round2((Number(order.product_unit_amount) || 0) * qty);
      revenueProducts += productRevenue;
      revenueShipping += round2(order.shipping_amount || 0);
      cogs += round2(unitCogsValue * qty);
      piecesSold += qty;
      countedOrder = true;
    }

    if (
      order.art_payment_status === 'paid'
      && isDateInMonth(order.art_fee_paid_at || order.updated_at, start, end)
    ) {
      revenueArt += round2(Number(order.art_fee_amount) || 0);
      countedOrder = true;
    }

    if (countedOrder) ordersCount += 1;
  }

  return {
    revenueProducts: round2(revenueProducts),
    revenueArt: round2(revenueArt),
    revenueShipping: round2(revenueShipping),
    cogs: round2(cogs),
    piecesSold,
    ordersCount,
  };
}

  const { year, month, key } = parseMonthParam(monthStr);
  const { start, end } = monthRange(year, month);
  const config = getConfig();

  const [stockBySku, catalogOrders, customOrders] = await Promise.all([
    loadStockCostMap(),
    loadCatalogOrders(start, end),
    loadCustomOrders(start, end),
  ]);

  const catalog = aggregateCatalogOrders(catalogOrders, config, stockBySku);
  const custom = aggregateCustomOrders(customOrders, config, start, end);

  const revenue = {
    catalogProducts: catalog.revenueProducts,
    catalogShipping: catalog.revenueShipping,
    customProducts: custom.revenueProducts,
    customArtFees: custom.revenueArt,
    customShipping: custom.revenueShipping,
  };

  const grossRevenue = round2(
    revenue.catalogProducts
    + revenue.catalogShipping
    + revenue.customProducts
    + revenue.customArtFees
    + revenue.customShipping,
  );

  const cogs = round2(catalog.cogs + custom.cogs);
  const grossProfit = round2(grossRevenue - cogs);

  const generalCosts = buildGeneralCostsBreakdown(config, key);
  const totalExpenses = generalCosts.total;
  const netProfit = round2(grossProfit - totalExpenses);

  return {
    month: key,
    label: new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    revenue,
    grossRevenue,
    cogs,
    grossProfit,
    grossMarginPct: marginPct(grossProfit, grossRevenue),
    generalCosts: generalCosts.costs,
    generalCostGroups: generalCosts.groups,
    totalExpenses,
    netProfit,
    netMarginPct: marginPct(netProfit, grossRevenue),
    volume: {
      catalogOrders: catalog.ordersCount,
      catalogItems: catalog.itemsSold,
      customOrders: custom.ordersCount,
      customPieces: custom.piecesSold,
    },
    notes: [
      'Receita = pedidos pagos do catálogo + personalizados pagos no mês (peça e taxa de arte).',
      'CMV = custo blank + DTF por peça (ou unit_cost do SKU no estoque, quando existir).',
      'Despesas = custos gerais lançados na aba Custos gerais para o mesmo mês.',
      'Frete entra na receita; custo real de envio pode ser lançado em Frete / Logística operacional.',
    ],
  };
}

module.exports = {
  CATALOG_CATEGORIES,
  GENERAL_COST_GROUPS,
  GENERAL_COST_LABELS,
  buildUnitEconomics,
  getMonthlyDre,
};
