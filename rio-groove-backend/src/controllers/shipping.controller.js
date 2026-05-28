const asyncHandler = require('../utils/asyncHandler');
const { normalizeString } = require('../utils/order');
const {
  validateShippingQuotePayload,
  validateOrderReferencePayload
} = require('../utils/validation');
const {
  getShippingQuote,
  generateShippingLabel,
  downloadShippingLabelPdf,
  isPickupShippingMethod,
  resolveMelhorEnvioShipmentId,
  ensureShippingPurchased,
  syncOrderTrackingFromMelhorEnvio,
  isMelhorEnvioShipmentUuid,
} = require('../services/shipping.service');
const {
  getOrderWithItems,
  updateOrderById
} = require('../services/orders.service');
const {
  sendOrderTrackingNotification
} = require('../services/notifications.service');
const {
  buildOrderUpdatesFromFulfillment,
  appendOrderLog,
} = require('../utils/orderFulfillment');

async function loadOrderOr404(reference, res) {
  const order = await getOrderWithItems(reference);
  if (!order) {
    res.status(404).json({ message: 'Pedido não encontrado.' });
    return null;
  }
  return order;
}

async function fulfillLabelForOrder(order, { notifyCustomer = true } = {}) {
  if (isPickupShippingMethod(order.shipping_method)) {
    throw new Error('Pedido com retirada presencial não requer etiqueta de envio.');
  }

  let shipmentId = await resolveMelhorEnvioShipmentId(order, true);
  if (!shipmentId) {
    throw new Error('Pedido sem envio vinculado ao Melhor Envio.');
  }

  if (!order.melhor_envio_shipment_id || !isMelhorEnvioShipmentUuid(order.melhor_envio_shipment_id)) {
    await updateOrderById(order.id, {
      melhor_envio_shipment_id: shipmentId,
      shipping_status: order.shipping_status === 'label_generated' ? order.shipping_status : 'processing',
    });
    order.melhor_envio_shipment_id = shipmentId;
  }

  const purchaseResult = await ensureShippingPurchased(order, shipmentId);
  if (purchaseResult && order.shipping_status !== 'label_generated') {
    await updateOrderById(order.id, {
      shipping_status: 'purchased',
      shipping_purchased_at: order.shipping_purchased_at || new Date().toISOString(),
    });
    order.shipping_status = 'purchased';
  }

  try {
    await syncOrderTrackingFromMelhorEnvio(order);
  } catch (syncError) {
    console.warn('[Shipping] sync antes de gerar etiqueta:', syncError.message);
  }

  const labelResult = await generateShippingLabel(shipmentId);
  const labelUrl = labelResult.labelUrl || labelResult.result?.url || labelResult.result?.label_url || null;
  const trackingCode =
    labelResult.trackingCode ||
    labelResult.result?.tracking_code ||
    labelResult.result?.trackingCode ||
    order.shipping_tracking_code ||
    '';
  const trackingUrl =
    labelResult.trackingUrl ||
    labelResult.result?.tracking_url ||
    labelResult.result?.trackingUrl ||
    labelUrl ||
    null;

  let notificationResult = null;
  if (notifyCustomer && trackingCode) {
    notificationResult = await sendOrderTrackingNotification(order, {
      carrier: order.shipping_provider,
      trackingCode,
      deadline: order.shipping_deadline,
      trackingUrl,
    });
  }

  const notificationStatus = notificationResult
    ? [notificationResult.email?.status, notificationResult.whatsapp?.status].includes('sent')
      ? 'sent'
      : 'failed'
    : order.shipping_notification_status;

  const fulfillmentUpdates = buildOrderUpdatesFromFulfillment('etiqueta_gerada', order);
  const logMessage = trackingCode
    ? `Etiqueta gerada automaticamente. Rastreio: ${trackingCode}`
    : 'Etiqueta gerada automaticamente via Melhor Envio';

  await updateOrderById(order.id, {
    ...fulfillmentUpdates,
    shipping_status: 'label_generated',
    shipping_label_url: labelUrl,
    shipping_tracking_code: trackingCode,
    shipping_label_generated_at: new Date().toISOString(),
    shipping_notification_status: notificationStatus,
    shipping_notification_sent_at: notificationResult ? new Date().toISOString() : order.shipping_notification_sent_at,
    shipping_notification_log: notificationResult ? JSON.stringify(notificationResult) : order.shipping_notification_log,
    shipping_email_status: notificationResult?.email?.status || order.shipping_email_status || 'skipped',
    shipping_whatsapp_status: notificationResult?.whatsapp?.status || order.shipping_whatsapp_status || 'skipped',
    order_logs: appendOrderLog(order.order_logs, {
      action: logMessage,
      message: logMessage,
      user: 'Melhor Envio',
    }),
  });

  const updatedOrder = await getOrderWithItems(order.id);

  return {
    labelResult,
    notificationResult,
    order: updatedOrder,
    trackingCode,
    labelUrl,
    shipmentId,
  };
}

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

  const order = await loadOrderOr404(validation.data.reference, res);
  if (!order) return;

  const shipmentId = await resolveMelhorEnvioShipmentId(order, true);
  if (!shipmentId) {
    return res.status(400).json({ message: 'Pedido não possui shipment_id do Melhor Envio.' });
  }

  if (isPickupShippingMethod(order.shipping_method)) {
    return res.status(400).json({ message: 'Pedido com retirada presencial não requer compra de frete.' });
  }

  const purchaseResult = await ensureShippingPurchased(order, shipmentId);
  const updatedOrder = await updateOrderById(order.id, {
    melhor_envio_shipment_id: shipmentId,
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

  const order = await loadOrderOr404(validation.data.reference, res);
  if (!order) return;

  try {
    const result = await fulfillLabelForOrder(order);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Falha ao gerar etiqueta.' });
  }
});

const fulfillOrderShippingLabel = asyncHandler(async (req, res) => {
  const validation = validateOrderReferencePayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Referência de pedido inválida.',
      errors: validation.errors
    });
  }

  const order = await loadOrderOr404(validation.data.reference, res);
  if (!order) return;

  try {
    const result = await fulfillLabelForOrder(order);
    return res.status(200).json({
      message: 'Etiqueta gerada com sucesso.',
      ...result,
    });
  } catch (error) {
    console.error('[Shipping] fulfillOrderShippingLabel', error);
    return res.status(400).json({ message: error.message || 'Falha ao gerar etiqueta.' });
  }
});

const downloadOrderShippingLabelPdf = asyncHandler(async (req, res) => {
  const reference = normalizeString(req.params.id);

  if (!reference) {
    return res.status(400).json({ message: 'Referência de pedido inválida.' });
  }

  const order = await loadOrderOr404(reference, res);
  if (!order) return;

  if (isPickupShippingMethod(order.shipping_method)) {
    return res.status(400).json({ message: 'Pedido com retirada presencial não possui etiqueta.' });
  }

  const shipmentId = order.melhor_envio_shipment_id || (await resolveMelhorEnvioShipmentId(order, false));
  if (!shipmentId) {
    return res.status(400).json({ message: 'Gere a etiqueta antes de baixar o PDF.' });
  }

  try {
    try {
      await syncOrderTrackingFromMelhorEnvio(order);
    } catch (syncError) {
      console.warn('[Shipping] sync antes do PDF:', syncError.message);
    }

    const downloadResult = await downloadShippingLabelPdf(shipmentId);

    if (downloadResult.pdf) {
      const filename = `etiqueta-${order.order_number || order.id}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(downloadResult.pdf);
    }

    if (downloadResult.labelUrl) {
      await updateOrderById(order.id, { shipping_label_url: downloadResult.labelUrl });
      return res.status(200).json({
        message: 'PDF indisponível para download direto. Use o link da etiqueta.',
        labelUrl: downloadResult.labelUrl,
      });
    }

    return res.status(400).json({
      message: 'Etiqueta ainda não disponível para impressão. Gere a etiqueta primeiro.',
    });
  } catch (error) {
    console.error('[Shipping] downloadOrderShippingLabelPdf', error);
    return res.status(400).json({ message: error.message || 'Falha ao baixar PDF da etiqueta.' });
  }
});

const getShippingTracking = asyncHandler(async (req, res) => {
  const reference = normalizeString(req.params.id);

  if (!reference) {
    return res.status(400).json({ message: 'Referência de pedido inválida.' });
  }

  const order = await loadOrderOr404(reference, res);
  if (!order) return;

  let syncedOrder = order;
  let syncMeta = { synced: false };

  if (order.melhor_envio_shipment_id && !isPickupShippingMethod(order.shipping_method)) {
    try {
      const syncResult = await syncOrderTrackingFromMelhorEnvio(order);
      syncedOrder = syncResult.order || order;
      syncMeta = {
        synced: syncResult.synced,
        melhor_envio_status: syncResult.melhorEnvioStatus || null,
        reason: syncResult.reason || null,
      };
    } catch (error) {
      console.error('[Shipping] syncOrderTrackingFromMelhorEnvio', error.message);
      syncMeta = { synced: false, reason: error.message };
    }
  }

  const fulfillmentStatus = syncedOrder.fulfillment_status || order.fulfillment_status;

  return res.status(200).json({
    order_id: syncedOrder.id,
    order_number: syncedOrder.order_number,
    external_reference: syncedOrder.external_reference,
    shipping_method: syncedOrder.shipping_method,
    shipping_provider: syncedOrder.shipping_provider,
    shipping_status: fulfillmentStatus,
    fulfillment_status: fulfillmentStatus,
    shipping_tracking_code: syncedOrder.shipping_tracking_code,
    shipping_label_url: syncedOrder.shipping_label_url,
    melhor_envio_shipment_id: syncedOrder.melhor_envio_shipment_id,
    sync: syncMeta,
  });
});

module.exports = {
  shippingQuote,
  purchaseOrderShipping,
  generateOrderShippingLabel,
  fulfillOrderShippingLabel,
  downloadOrderShippingLabelPdf,
  getShippingTracking
};
