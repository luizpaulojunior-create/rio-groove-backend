const { paymentClient } = require('../lib/mercadopago');
const {
  getOrderByExternalReference,
  updateOrderByExternalReference,
  registerWebhookEvent
} = require('./orders.service');
const { mapMercadoPagoPaymentStatus } = require('../utils/order');

function extractNotificationInfo(req) {
  const topic = req.body?.type || req.query.type || req.query.topic || req.body?.topic || '';
  const action = req.body?.action || req.query.action || '';
  const resourceId = req.body?.data?.id || req.query['data.id'] || req.query.id || '';

  return {
    topic: String(topic || '').toLowerCase(),
    action: String(action || '').toLowerCase(),
    resourceId: String(resourceId || '')
  };
}

async function processMercadoPagoWebhook(req) {
  const notification = extractNotificationInfo(req);

  await registerWebhookEvent({
    provider: 'mercado_pago',
    topic: notification.topic || 'unknown',
    action: notification.action || 'unknown',
    resourceId: notification.resourceId || 'unknown',
    payload: req.body || {}
  });

  if (notification.topic !== 'payment' || !notification.resourceId) {
    return { ignored: true, reason: 'Notificação sem pagamento.' };
  }

  const payment = await paymentClient.get({ id: notification.resourceId });
  const externalReference = payment.external_reference;

  if (!externalReference) {
    return { ignored: true, reason: 'Pagamento sem external_reference.' };
  }

  const existingOrder = await getOrderByExternalReference(externalReference);
  if (!existingOrder) {
    return { ignored: true, reason: 'Pedido não encontrado.' };
  }

  const statusMap = mapMercadoPagoPaymentStatus(payment.status);
  const updatedOrder = await updateOrderByExternalReference(externalReference, {
    status: statusMap.orderStatus,
    payment_status: statusMap.paymentStatus,
    mercado_pago_payment_id: payment.id ? String(payment.id) : existingOrder.mercado_pago_payment_id,
    mercado_pago_merchant_order_id: payment.order?.id ? String(payment.order.id) : existingOrder.mercado_pago_merchant_order_id,
    mercado_pago_status: payment.status || null,
    mercado_pago_status_detail: payment.status_detail || null,
    paid_at: payment.status === 'approved' ? new Date().toISOString() : existingOrder.paid_at,
    payment_payload: payment
  });

  return {
    ignored: false,
    order: updatedOrder,
    paymentId: payment.id,
    paymentStatus: payment.status
  };
}

module.exports = {
  extractNotificationInfo,
  processMercadoPagoWebhook
};
