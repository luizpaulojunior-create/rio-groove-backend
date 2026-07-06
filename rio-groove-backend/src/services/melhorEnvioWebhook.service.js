const { verifyMelhorEnvioWebhookSignature } = require('../utils/melhor-envio-webhook');
const { getOrderByMelhorEnvioShipmentId, updateOrderById } = require('./orders.service');
const {
  mapMelhorEnvioStatusToFulfillment,
  normalizeTrackingCode,
  buildTrackingSyncUpdates,
} = require('./shipping.service');
const { appendOrderLog } = require('../utils/orderFulfillment');

const ME_EVENT_TO_STATUS = {
  'order.created': 'preparando_envio',
  'order.pending': 'preparando_envio',
  'order.released': 'etiqueta_gerada',
  'order.generated': 'etiqueta_gerada',
  'order.received': 'em_transito',
  'order.posted': 'postado',
  'order.delivered': 'entregue',
  'order.cancelled': 'cancelado',
  'order.canceled': 'cancelado',
  'order.undelivered': 'em_transito',
  'order.paused': 'em_transito',
  'order.suspended': 'em_transito',
};

function mapMelhorEnvioEventToFulfillment(eventName, dataStatus) {
  const fromEvent = ME_EVENT_TO_STATUS[String(eventName || '').toLowerCase().trim()];
  if (fromEvent) return fromEvent;
  return mapMelhorEnvioStatusToFulfillment(dataStatus);
}

function buildWebhookDedupKey(eventName, shipmentId) {
  return `melhor_envio:${eventName}:${shipmentId}`;
}

async function processMelhorEnvioWebhook(req) {
  const signatureCheck = verifyMelhorEnvioWebhookSignature(req);
  if (!signatureCheck.valid) {
    throw new Error(signatureCheck.reason || 'Assinatura do webhook inválida.');
  }

  const body = req.body || {};
  const eventName = body.event || body.type || '';
  const data = body.data || body;
  const shipmentId = data.id || data.shipment_id || data.order_id;

  if (!shipmentId) {
    return { ignored: true, reason: 'Webhook sem id de envio.' };
  }

  const order = await getOrderByMelhorEnvioShipmentId(String(shipmentId));
  if (!order) {
    console.warn('[MelhorEnvioWebhook] Pedido não encontrado para envio', shipmentId);
    return { ignored: true, reason: 'Pedido não encontrado para este envio.' };
  }

  const mappedFulfillment = mapMelhorEnvioEventToFulfillment(eventName, data.status);
  const trackingCode = normalizeTrackingCode(
    data.tracking || data.tracking_code || data.trackingCode || order.shipping_tracking_code,
  );

  const updates = buildTrackingSyncUpdates(order, {
    fulfillmentStatus: mappedFulfillment,
    trackingCode,
    melhorEnvioStatus: data.status || eventName,
  });

  if (!Object.keys(updates).length) {
    return {
      ignored: true,
      order_id: order.id,
      reason: 'Status já atualizado.',
      fulfillment_status: order.fulfillment_status,
    };
  }

  const logLabel = mappedFulfillment || data.status || eventName;
  updates.order_logs = appendOrderLog(order.order_logs, {
    action: `Rastreamento Melhor Envio: ${logLabel}`,
    message: `Webhook ${eventName || data.status || 'atualização'} — status ${logLabel}`,
    user: 'Melhor Envio',
  });

  const updatedOrder = await updateOrderById(order.id, updates);

  return {
    ignored: false,
    order_id: updatedOrder.id,
    fulfillment_status: updatedOrder.fulfillment_status,
    shipping_tracking_code: updatedOrder.shipping_tracking_code,
    event: eventName,
    melhor_envio_status: data.status || null,
  };
}

module.exports = {
  processMelhorEnvioWebhook,
  buildWebhookDedupKey,
};
