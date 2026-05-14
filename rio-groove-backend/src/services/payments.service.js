const { paymentClient } = require('../lib/mercadopago');
const {
  getOrderByExternalReference,
  updateOrderByExternalReference,
  getOrderWithItems,
  registerWebhookEvent
} = require('./orders.service');
const {
  purchaseShipping,
  generateShippingLabel,
  isPickupShippingMethod
} = require('./shipping.service');
const { sendOrderTrackingNotification } = require('./notifications.service');
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

  if (payment.status === 'approved' && updatedOrder.melhor_envio_shipment_id && !isPickupShippingMethod(updatedOrder.shipping_method) && !updatedOrder.shipping_notification_sent_at) {
    try {
      const orderWithItems = await getOrderWithItems(externalReference);
      const purchaseResult = await purchaseShipping(orderWithItems, updatedOrder.melhor_envio_shipment_id);
      const labelResult = await generateShippingLabel(updatedOrder.melhor_envio_shipment_id);
      const labelUrl = labelResult.result?.url || labelResult.result?.label_url || labelResult.labelUrl || null;
      const trackingCode = labelResult.trackingCode || labelResult.result?.tracking_code || labelResult.result?.trackingCode || '';
      const trackingUrl = labelResult.trackingUrl || labelResult.result?.tracking_url || labelResult.result?.trackingUrl || labelUrl || null;

      const notificationResult = await sendOrderTrackingNotification(orderWithItems, {
        carrier: updatedOrder.shipping_provider,
        trackingCode,
        deadline: updatedOrder.shipping_deadline,
        trackingUrl
      });

      const notificationStatus = [notificationResult.email?.status, notificationResult.whatsapp?.status].includes('sent') ? 'sent' : 'failed';
      await updateOrderByExternalReference(externalReference, {
        shipping_status: 'label_generated',
        shipping_purchased_at: new Date().toISOString(),
        shipping_label_generated_at: new Date().toISOString(),
        shipping_label_url: labelUrl,
        shipping_tracking_code: trackingCode || updatedOrder.shipping_tracking_code,
        shipping_notification_status: notificationStatus,
        shipping_notification_sent_at: new Date().toISOString(),
        shipping_notification_log: JSON.stringify(notificationResult),
        shipping_email_status: notificationResult.email?.status || 'skipped',
        shipping_whatsapp_status: notificationResult.whatsapp?.status || 'skipped'
      });
      console.log('[PaymentsService] Frete comprado, etiqueta gerada e notificações enviadas para pedido', externalReference, purchaseResult, notificationResult);
    } catch (error) {
      console.error('[PaymentsService] Falha ao processar frete após pagamento aprovado', error.message);
    }
  }

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
