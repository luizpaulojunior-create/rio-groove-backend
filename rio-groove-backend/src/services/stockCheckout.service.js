const supabase = require('../lib/supabase');
const { decrementStockIfAvailable, incrementStock } = require('./stock.service');
const { updateOrderById, getOrderByReference } = require('./orders.service');
const { appendOrderLog } = require('../utils/orderFulfillment');

const COLOR_ALIASES = {
  preto: ['preto', 'preta', 'black', 'blk'],
  preta: ['preto', 'preta', 'black', 'blk'],
  branco: ['branco', 'white', 'wht'],
  'off white': ['off white', 'offwhite', 'off'],
};

function normalizeLabel(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeSize(value) {
  return String(value || '').trim().toUpperCase();
}

function colorsMatch(stockRow, itemColor) {
  const target = normalizeLabel(itemColor);
  if (!target) return false;

  const label = normalizeLabel(stockRow.color_label);
  const key = normalizeLabel(stockRow.color_key);

  if (target === label || target === key) return true;

  for (const aliases of Object.values(COLOR_ALIASES)) {
    if (!aliases.includes(target)) continue;
    if (aliases.includes(label) || aliases.includes(key)) return true;
  }

  return false;
}

function isStockManagedItem(item) {
  const color = normalizeLabel(item.color);
  const size = normalizeSize(item.size);
  if (!color || !size) return false;
  if (['—', '-', 'n/a', 'único', 'unico'].includes(color) && ['—', '-', 'n/a', 'único', 'UNICO'].includes(size)) {
    return Boolean(item.sku);
  }
  return true;
}

async function loadActiveStockItems() {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

function findStockMatch(stockItems, item) {
  const sku = String(item.sku || item.raw?.sku || '').trim().toUpperCase();
  const size = normalizeSize(item.size);

  if (sku) {
    const bySku = stockItems.find((row) => String(row.sku || '').trim().toUpperCase() === sku);
    if (bySku) return bySku;
  }

  return stockItems.find((row) => colorsMatch(row, item.color) && normalizeSize(row.size) === size) || null;
}

function buildRequirements(items, stockItems) {
  const requirements = new Map();

  for (const item of items) {
    if (!isStockManagedItem(item)) continue;

    const stockRow = findStockMatch(stockItems, item);
    if (!stockRow) {
      throw new Error(
        `Estoque indisponível para ${item.productName || 'produto'} (${item.color} · ${item.size}).`
      );
    }

    const qty = Number(item.quantity) || 1;
    const current = requirements.get(stockRow.id) || { stockRow, quantity: 0, items: [] };
    current.quantity += qty;
    current.items.push(item);
    requirements.set(stockRow.id, current);
  }

  return requirements;
}

async function validateStockForItems(items = []) {
  const stockItems = await loadActiveStockItems();
  const requirements = buildRequirements(items, stockItems);

  for (const { stockRow, quantity } of requirements.values()) {
    const available = Number(stockRow.quantity) || 0;
    if (available < quantity) {
      throw new Error(
        `Estoque insuficiente para ${stockRow.color_label || stockRow.color_key} · Tam ${stockRow.size} (disponível: ${available}, solicitado: ${quantity}).`
      );
    }
  }

  return true;
}

async function reserveStockForOrder(order, items = []) {
  const freshOrder = await getOrderByReference(order.id);
  const target = freshOrder || order;

  if (target?.stock_reserved_at || target?.stock_deducted_at) {
    return { skipped: true, reason: 'Estoque já reservado para este pedido.' };
  }

  const stockItems = await loadActiveStockItems();
  const requirements = buildRequirements(items, stockItems);
  const reservations = [];

  for (const { stockRow, quantity } of requirements.values()) {
    const updated = await decrementStockIfAvailable(
      stockRow.id,
      quantity,
      `Reserva checkout — pedido ${target.order_number || target.id}`,
    );
    reservations.push({ stockId: stockRow.id, quantity, remaining: updated.quantity });
  }

  if (reservations.length > 0) {
    await updateOrderById(target.id, {
      stock_reserved_at: new Date().toISOString(),
      order_logs: appendOrderLog(target.order_logs, {
        action: 'Estoque reservado',
        message: `Reserva automática de ${reservations.length} variante(s) no checkout.`,
        user: 'Sistema',
      }),
    });
  }

  return { skipped: false, reservations };
}

async function deductStockForOrder(order, items = []) {
  const freshOrder = await getOrderByReference(order.id);
  const target = freshOrder || order;

  if (target?.stock_deducted_at) {
    return { skipped: true, reason: 'Estoque já baixado anteriormente.' };
  }

  if (target?.stock_reserved_at) {
    await updateOrderById(target.id, {
      stock_deducted_at: new Date().toISOString(),
      order_logs: appendOrderLog(target.order_logs, {
        action: 'Estoque baixado',
        message: 'Reserva convertida em baixa após pagamento aprovado.',
        user: 'Sistema',
      }),
    });
    return { skipped: false, fromReservation: true };
  }

  const stockItems = await loadActiveStockItems();
  const requirements = buildRequirements(items, stockItems);
  const deductions = [];

  for (const { stockRow, quantity } of requirements.values()) {
    const updated = await decrementStockIfAvailable(
      stockRow.id,
      quantity,
      `Baixa automática — pedido ${target.order_number || target.id}`,
    );
    deductions.push({ stockId: stockRow.id, quantity, remaining: updated.quantity });
  }

  if (deductions.length > 0) {
    await updateOrderById(target.id, {
      stock_deducted_at: new Date().toISOString(),
      stock_reserved_at: target.stock_reserved_at || new Date().toISOString(),
      order_logs: appendOrderLog(target.order_logs, {
        action: 'Estoque baixado',
        message: `Baixa automática de ${deductions.length} variante(s) após pagamento aprovado.`,
        user: 'Sistema',
      }),
    });
  }

  return { skipped: false, deductions };
}

async function restoreStockForOrder(order, items = []) {
  const freshOrder = await getOrderByReference(order.id);
  const target = freshOrder || order;

  if (!target?.stock_deducted_at && !target?.stock_reserved_at) {
    return { skipped: true, reason: 'Estoque não havia sido reservado ou baixado.' };
  }

  const stockItems = await loadActiveStockItems();
  const requirements = buildRequirements(items, stockItems);
  const restorations = [];

  for (const { stockRow, quantity } of requirements.values()) {
    const updated = await incrementStock(
      stockRow.id,
      quantity,
      `Devolução automática — pedido ${target.order_number || target.id}`,
    );
    restorations.push({ stockId: stockRow.id, quantity, remaining: updated.quantity });
  }

  await updateOrderById(target.id, {
    stock_deducted_at: null,
    stock_reserved_at: null,
    order_logs: appendOrderLog(target.order_logs, {
      action: 'Estoque devolvido',
      message: `Devolução automática de ${restorations.length} variante(s).`,
      user: 'Sistema',
    }),
  });

  return { skipped: false, restorations };
}

module.exports = {
  validateStockForItems,
  reserveStockForOrder,
  deductStockForOrder,
  restoreStockForOrder,
  findStockMatch,
  isStockManagedItem,
};
