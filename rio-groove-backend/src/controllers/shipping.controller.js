const asyncHandler = require('../utils/asyncHandler');
const { normalizeString } = require('../utils/order');
const {
  validateShippingQuotePayload,
  validateOrderReferencePayload
} = require('../utils/validation');
const {
  getShippingQuote,
  purchaseShipping,
  generateShippingLabel,
  isPickupShippingMethod
} = require('../services/shipping.service');
const {
  getOrderWithItems,
  updateOrderById
} = require('../services/orders.service');
const {
  sendOrderTrackingNotification
} = require('../services/notifications.service');

const shippingQuote = asyncHandler(async (req, res) => {
  console.log('[MelhorEnvio] Cotação de frete requisitada', req.body);

  const validation = validateShippingQuotePayload(req.body || {});

  if (!validation.valid) {
    console.warn('[MelhorEnvio] Payload inválido', validation.errors);
    return res.status(400).json({
      message: 'Payload de cotação de frete inválido.',
      errors: validation.errors
    });
  }

  const shippingOptions = await getShippingQuote(validation.data);
  console.log('[MelhorEnvio] Retornando opções de cotação', { count: shippingOptions.length });

  return res.status(200).json(shippingOptions);
});

const purchaseOrderShipping = asyncHandler(async (req, res) => {
  const validation = validateOrderReferencePayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Referência de pedido inválida.',
      errors: validation.errors
    });
  }

  const order = await getOrderWithItems(validation.data.reference);
  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  if (!order.melhor_envio_shipment_id) {
    return res.status(400).json({ message: 'Pedido não possui shipment_id do Melhor Envio.' });
  }

  if (isPickupShippingMethod(order.shipping_method)) {
    return res.status(400).json({ message: 'Pedido com retirada presencial não requer compra de frete.' });
  }

  const purchaseResult = await purchaseShipping(order, order.melhor_envio_shipment_id);
  const updatedOrder = await updateOrderById(order.id, {
    shipping_status: 'purchased',
    shipping_purchased_at: new Date().toISOString()
  });

  return res.status(200).json({ purchaseResult, order: updatedOrder });
});

const generateOrderShippingLabel = asyncHandler(async (req, res) => {
  const validation = validateOrderReferencePayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Referência de pedido inválida.',
      errors: validation.errors
    });
  }

  const order = await getOrderWithItems(validation.data.reference);
  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  if (!order.melhor_envio_shipment_id) {
    return res.status(400).json({ message: 'Pedido não possui shipment_id do Melhor Envio.' });
  }

  const labelResult = await generateShippingLabel(order.melhor_envio_shipment_id);
  const labelUrl = labelResult.result?.url || labelResult.result?.label_url || labelResult.labelUrl || null;
  const trackingCode = labelResult.trackingCode || labelResult.result?.tracking_code || labelResult.result?.trackingCode || '';
  const trackingUrl = labelResult.trackingUrl || labelResult.result?.tracking_url || labelResult.result?.trackingUrl || labelUrl || null;

  const notificationResult = await sendOrderTrackingNotification(order, {
    carrier: order.shipping_provider,
    trackingCode,
    deadline: order.shipping_deadline,
    trackingUrl
  });

  const notificationStatus = [notificationResult.email?.status, notificationResult.whatsapp?.status].includes('sent') ? 'sent' : 'failed';
  const updatedOrder = await updateOrderById(order.id, {
    shipping_status: 'label_generated',
    shipping_label_url: labelUrl,
    shipping_tracking_code: trackingCode || order.shipping_tracking_code,
    shipping_label_generated_at: new Date().toISOString(),
    shipping_notification_status: notificationStatus,
    shipping_notification_sent_at: new Date().toISOString(),
    shipping_notification_log: JSON.stringify(notificationResult),
    shipping_email_status: notificationResult.email?.status || 'skipped',
    shipping_whatsapp_status: notificationResult.whatsapp?.status || 'skipped'
  });

  return res.status(200).json({ labelResult, notificationResult, order: updatedOrder });
});

const getShippingTracking = asyncHandler(async (req, res) => {
  const reference = normalizeString(req.params.id);

  if (!reference) {
    return res.status(400).json({ message: 'Referência de pedido inválida.' });
  }

  const order = await getOrderWithItems(reference);
  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  return res.status(200).json({
    order_id: order.id,
    order_number: order.order_number,
    external_reference: order.external_reference,
    shipping_method: order.shipping_method,
    shipping_provider: order.shipping_provider,
    shipping_status: order.shipping_status,
    shipping_tracking_code: order.shipping_tracking_code,
    shipping_label_url: order.shipping_label_url,
    melhor_envio_shipment_id: order.melhor_envio_shipment_id
  });
});

module.exports = {
  shippingQuote,
  purchaseOrderShipping,
  generateOrderShippingLabel,
  getShippingTracking
};
