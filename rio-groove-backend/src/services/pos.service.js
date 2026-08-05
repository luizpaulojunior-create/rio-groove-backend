const {
  createOrder,
  createOrderItems,
  deleteOrder,
  getOrderWithItems,
} = require('./orders.service');
const { buildOrderNumber, buildExternalReference } = require('../utils/order');
const {
  validateStockForItems,
  deductStockForOrder,
  findStockMatch,
  loadActiveStockItems,
} = require('./stockCheckout.service');

const PAYMENT_LABELS = {
  pix: 'Pix',
  cash: 'Dinheiro',
  card: 'Cartão',
};

async function resolveStockSnapshots(items) {
  const stockItems = await loadActiveStockItems();
  return items.map((item) => {
    const stockRow = findStockMatch(stockItems, item);
    if (!stockRow) {
      throw new Error(
        `Estoque indisponível para ${item.productName || 'produto'} (${item.color} · ${item.size}).`,
      );
    }
    return {
      item,
      stockRow,
      remainingBefore: Number(stockRow.quantity) || 0,
    };
  });
}

/**
 * Venda presencial (feira): baixa blank imediatamente e registra a estampa no pedido.
 */
async function createFairSale({ payload, adminEmail }) {
  const now = new Date().toISOString();
  const orderNumber = buildOrderNumber();
  const externalReference = buildExternalReference(orderNumber);
  const paymentLabel = PAYMENT_LABELS[payload.paymentMethod] || payload.paymentMethod;
  const fairLabel = payload.fairName || 'Feira';

  const snapshots = await resolveStockSnapshots(payload.items);
  const checkoutItems = snapshots.map(({ item, stockRow }) => ({
    ...item,
    sku: stockRow.sku,
    stockItemId: stockRow.id,
    raw: {
      ...(item.raw || {}),
      sku: stockRow.sku,
      stockItemId: stockRow.id,
      color_key: stockRow.color_key,
      blank_category: stockRow.category,
      blank_model: stockRow.model,
      blank_gender: stockRow.gender,
      blank_fabric: stockRow.fabric,
      channel: 'feira',
      fairName: payload.fairName || null,
      paymentMethod: payload.paymentMethod,
      estampa: item.productName,
    },
  }));

  await validateStockForItems(checkoutItems);

  const notesParts = [
    `Venda feira · ${paymentLabel}`,
    payload.fairName ? `Local: ${payload.fairName}` : null,
    payload.notes || null,
  ].filter(Boolean);

  const order = await createOrder({
    order: {
      order_number: orderNumber,
      external_reference: externalReference,
      status: 'paid',
      payment_status: 'paid',
      payment_provider: 'feira',
      paid_at: now,
      currency: 'BRL',
      customer_name: payload.customerName,
      customer_email: 'feira@riogroovemovimentos.com.br',
      customer_phone: '00000000000',
      customer_cpf: null,
      accepts_marketing: false,
      shipping_method: `Retirada · ${fairLabel}`,
      shipping_amount: 0,
      shipping_deadline: null,
      shipping_cep: '00000000',
      shipping_street: fairLabel,
      shipping_number: 'S/N',
      shipping_complement: null,
      shipping_neighborhood: 'Presencial',
      shipping_city: 'Feira',
      shipping_state: 'RJ',
      notes: notesParts.join(' | '),
      items_count: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal_amount: payload.subtotal,
      total_amount: payload.total,
      fulfillment_status: 'entregue',
      stock_reserved_at: null,
      stock_deducted_at: null,
      order_logs: [
        {
          id: '1',
          action: 'Venda feira',
          message: `Venda presencial registrada (${paymentLabel}).`,
          user: adminEmail || 'Admin',
          created_at: now,
          createdAt: now,
        },
      ],
      raw_checkout_payload: {
        channel: 'feira',
        paymentMethod: payload.paymentMethod,
        fairName: payload.fairName || null,
        items: payload.rawPayload?.items || checkoutItems,
      },
    },
  });

  try {
    await createOrderItems(
      checkoutItems.map((item) => ({
        order_id: order.id,
        product_name: item.productName,
        product_slug: item.slug || null,
        sku: item.sku || null,
        image_url: item.imageUrl || null,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
        metadata_json: item.raw,
      })),
    );

    const deductResult = await deductStockForOrder(order, checkoutItems);
    const orderWithItems = await getOrderWithItems(order.id);

    const lines = snapshots.map(({ item, stockRow }) => ({
      estampa: item.productName,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      blankSku: stockRow.sku,
      blankLabel: `${stockRow.category} ${stockRow.model} · ${stockRow.color_label || stockRow.color_key} · ${stockRow.size}`,
      remainingBefore: Number(stockRow.quantity) || 0,
      remainingAfter: Math.max(0, (Number(stockRow.quantity) || 0) - Number(item.quantity || 0)),
    }));

    return {
      order: orderWithItems || order,
      orderNumber,
      externalReference,
      paymentMethod: payload.paymentMethod,
      paymentLabel,
      lines,
      deductResult,
    };
  } catch (error) {
    try {
      await deleteOrder(order.id);
    } catch (cleanupError) {
      console.error('[POS] Falha ao limpar pedido após erro de estoque:', cleanupError.message);
    }
    throw error;
  }
}

module.exports = {
  createFairSale,
  PAYMENT_LABELS,
};
