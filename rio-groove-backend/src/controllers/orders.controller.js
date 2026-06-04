const asyncHandler = require('../utils/asyncHandler');
const { validateCheckoutPayload } = require('../utils/validation');
const { createOrder, createOrderItems, getOrderWithItems, getOrders, updateOrderById, getOrderByReference } = require('../services/orders.service');
const { buildOrderNumber, buildExternalReference } = require('../utils/order');
const {
  FULFILLMENT_STATUSES,
  buildOrderUpdatesFromFulfillment,
  appendOrderLog,
} = require('../utils/orderFulfillment');
const { restoreStockForOrder } = require('../services/stockCheckout.service');
const {
  verifyOrderPublicStatusAccess,
  buildPublicOrderStatusResponse,
  PUBLIC_ORDER_DENIED,
} = require('../utils/order-public-status');
const { reconcileMercadoPagoReturn } = require('../services/payments.service');

const getAllOrders = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;
  const result = await getOrders({ limit, offset });
  return res.json(result);
});

const createManualOrder = asyncHandler(async (req, res) => {
  const validation = validateCheckoutPayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Payload de pedido inválido.',
      errors: validation.errors
    });
  }

  const payload = validation.data;
  const orderNumber = buildOrderNumber();
  const externalReference = buildExternalReference(orderNumber);

  const order = await createOrder({
    order: {
      order_number: orderNumber,
      external_reference: externalReference,
      status: 'created',
      payment_status: 'pending',
      payment_provider: 'manual',
      currency: 'BRL',
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone,
      customer_cpf: payload.customer.cpf || null,
      accepts_marketing: payload.customer.acceptsMarketing,
      shipping_method: payload.shipping.label,
      shipping_amount: payload.shipping.price,
      shipping_deadline: payload.shipping.deadline || null,
      shipping_cep: payload.address.cep,
      shipping_street: payload.address.street,
      shipping_number: payload.address.number,
      shipping_complement: payload.address.complement || null,
      shipping_neighborhood: payload.address.neighborhood,
      shipping_city: payload.address.city,
      shipping_state: payload.address.state,
      notes: payload.address.notes || null,
      items_count: payload.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal_amount: payload.subtotal,
      total_amount: payload.total,
      fulfillment_status: 'aguardando_pagamento',
      order_logs: [{
        id: '1',
        action: 'Pedido criado',
        message: 'Pedido criado',
        user: 'Sistema',
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }],
      raw_checkout_payload: payload.rawPayload
    }
  });

  await createOrderItems(
    payload.items.map((item) => ({
      order_id: order.id,
      product_name: item.productName,
      product_slug: item.slug || null,
      image_url: item.imageUrl || null,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      metadata_json: item.raw
    }))
  );

  return res.status(201).json({
    message: 'Pedido criado com sucesso.',
    orderNumber,
    externalReference,
    orderId: order.id
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const reference = req.params.reference;
  const order = await getOrderWithItems(reference);

  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  return res.json({ order });
});

const getOrderPublicStatus = asyncHandler(async (req, res) => {
  const order = await getOrderWithItems(req.params.reference);

  const emailHint =
    req.body?.email || req.body?.customer_email || req.query.email || req.query.customer_email;

  if (!order) {
    return res.status(404).json({ message: PUBLIC_ORDER_DENIED });
  }

  const access = verifyOrderPublicStatusAccess(order, emailHint);
  if (!access.ok) {
    if (access.status === 403) {
      return res.status(404).json({ message: PUBLIC_ORDER_DENIED });
    }
    return res.status(access.status).json({ message: access.message });
  }

  return res.json(buildPublicOrderStatusResponse(order));
});

const reconcileOrderPayment = asyncHandler(async (req, res) => {
  const reference = req.params.reference;
  const paymentId =
    req.body?.payment_id ||
    req.body?.paymentId ||
    req.query.payment_id ||
    req.query.paymentId;

  try {
    const result = await reconcileMercadoPagoReturn({
      paymentId,
      externalReference: reference,
      emailHint: req.body?.email || req.query.email || req.query.customer_email,
    });

    const order = await getOrderWithItems(reference);
    if (!order) {
      return res.status(404).json({ message: PUBLIC_ORDER_DENIED });
    }

    return res.json({
      ...result,
      order: buildPublicOrderStatusResponse(order),
    });
  } catch (error) {
    const status = error.status === 403 ? 404 : (error.status || 400);
    const message =
      status === 404
        ? PUBLIC_ORDER_DENIED
        : (error.message || 'Falha ao reconciliar pagamento.');
    return res.status(status).json({ message });
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, tracking_code, tracking_url, log_message, log_user } = req.body;

  if (!status || !FULFILLMENT_STATUSES.has(status)) {
    return res.status(400).json({
      message: 'Status operacional inválido.',
    });
  }

  const existingOrder = await getOrderByReference(req.params.id);
  if (!existingOrder) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  const updates = buildOrderUpdatesFromFulfillment(status, existingOrder);

  if (tracking_code !== undefined && tracking_code !== null && String(tracking_code).trim()) {
    updates.shipping_tracking_code = String(tracking_code).trim();
  }

  if (tracking_url !== undefined && tracking_url !== null && String(tracking_url).trim()) {
    updates.shipping_label_url = String(tracking_url).trim();
  }

  if (log_message) {
    updates.order_logs = appendOrderLog(existingOrder.order_logs, {
      action: log_message,
      message: log_message,
      user: log_user || 'Operador',
    });
  }

  const order = await updateOrderById(existingOrder.id, updates);
  const orderWithItems = await getOrderWithItems(order.id);

  if (status === 'cancelado') {
    try {
      await restoreStockForOrder(orderWithItems, orderWithItems.items || []);
    } catch (error) {
      console.error('[Orders] Falha ao devolver estoque no cancelamento:', error.message);
    }
  }

  return res.json(orderWithItems || order);
});

module.exports = {
  getAllOrders,
  createManualOrder,
  getOrder,
  getOrderPublicStatus,
  reconcileOrderPayment,
  updateOrderStatus
};
