const env = require('../config/env');
const {
  getOrderByExternalReference,
  getOrderByReference,
  updateOrderByExternalReference,
  getOrderWithItems,
  registerWebhookEvent
} = require('./orders.service');
const {
  createShipmentInCart,
  isPickupShippingMethod
} = require('./shipping.service');
const {
  sendOrderTrackingNotification,
  sendPickupNotification,
  sendAdminNotification
} = require('./notifications.service');
const { mapMercadoPagoPaymentStatus } = require('../utils/order');

const MP_API_BASE = 'https://api.mercadopago.com';

const processingWebhooks = new Set();

function extractNotificationInfo(req) {
  const rawTopic = req.body?.type || req.query.type || req.query.topic || req.body?.topic || '';
  const rawAction = req.body?.action || req.query.action || '';
  const resourceId = req.body?.data?.id || req.query['data.id'] || req.query.id || req.body?.id || '';

  const topic = String(rawTopic || '').toLowerCase();
  const action = String(rawAction || '').toLowerCase();

  let resourceType = 'unknown';
  if (/merchant_order|topic_merchant_order_wh/.test(topic) || /merchant_order/.test(action)) {
    resourceType = 'merchant_order';
  } else if (/payment/.test(topic) || /payment/.test(action)) {
    resourceType = 'payment';
  }

  return {
    rawTopic: topic,
    rawAction: action,
    resourceId: String(resourceId || '').trim(),
    resourceType
  };
}

async function fetchMercadoPagoApi(path) {
  const url = `${MP_API_BASE}${path}`;
  console.log('[PaymentsService] Consultando API Mercado Pago', { url, accessTokenConfigured: Boolean(env.mercadoPagoAccessToken) });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.mercadoPagoAccessToken || ''}`,
      Accept: 'application/json'
    }
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
    console.log('[PaymentsService] Resposta da API Mercado Pago recebida', {
      status: response.status,
      ok: response.ok,
      payloadSummary: payload && typeof payload === 'object' ? { id: payload.id || payload.order_id || payload.external_reference, status: payload.status || payload.order?.status } : payload
    });
  } catch (error) {
    console.error('[PaymentsService] Falha ao parsear resposta do Mercado Pago', { text, error: error.message });
    throw new Error(`Resposta inválida do Mercado Pago: ${text}`);
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || text;
    console.error('[PaymentsService] API Mercado Pago retornou erro', { status: response.status, message, payload });
    throw new Error(`Mercado Pago API retornou ${response.status}: ${message}`);
  }

  return payload;
}

async function fetchPaymentDetails(paymentId) {
  console.log('[PaymentsService] fetchPaymentDetails', { paymentId });
  return fetchMercadoPagoApi(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

async function fetchMerchantOrderDetails(orderId) {
  return fetchMercadoPagoApi(`/merchant_orders/${encodeURIComponent(orderId)}`);
}

function extractApprovedPaymentFromMerchantOrder(merchantOrder) {
  if (!merchantOrder || !Array.isArray(merchantOrder.payments)) return null;

  const approved = merchantOrder.payments.find(function (payment) {
    return String(payment.status || '').toLowerCase() === 'approved';
  });

  return approved || merchantOrder.payments[0] || null;
}

function getNotificationReference(payment, merchantOrder) {
  const metadata = (payment?.metadata || merchantOrder?.metadata || {}) || {};

  return (
    String(
      metadata.order_id ||
        metadata.external_reference ||
        payment?.external_reference ||
        merchantOrder?.external_reference ||
        payment?.order?.external_reference ||
        payment?.order?.id ||
        ''
    ).trim() || null
  );
}

function isPickupShipping(payment, merchantOrder, existingOrder) {
  const metadata = payment?.metadata || merchantOrder?.metadata || {};
  const shippingType = String(metadata.shipping_type || '').toLowerCase();
  if (shippingType === 'pickup') return true;

  const labelSource = String(metadata.shipping_label || existingOrder?.shipping_method || existingOrder?.shipping_label || '');
  return /pickup|retirada|presencial/i.test(labelSource);
}

async function processMercadoPagoWebhook(req) {
  const notification = extractNotificationInfo(req);
  console.log('[PaymentsService] Webhook recebido', {
    headers: req.headers,
    body: req.body,
    query: req.query,
    topic: notification.rawTopic,
    action: notification.rawAction,
    resourceId: notification.resourceId,
    resourceType: notification.resourceType
  });

  await registerWebhookEvent({
    provider: 'mercado_pago',
    topic: notification.rawTopic || 'unknown',
    action: notification.rawAction || 'unknown',
    resourceId: notification.resourceId || 'unknown',
    payload: req.body || {}
  });

  if (!notification.resourceId || notification.resourceType === 'unknown') {
    console.warn('[PaymentsService] Retornando cedo: webhook desconhecido ou sem resourceId');
    return { ignored: true, reason: 'Webhook não identificado ou sem resourceId.' };
  }

  let payment = null;
  let merchantOrder = null;

  try {
    if (notification.resourceType === 'merchant_order') {
      console.log('[PaymentsService] Tipo de webhook identificado como merchant_order');
      merchantOrder = await fetchMerchantOrderDetails(notification.resourceId);
      console.log('[PaymentsService] Merchant Order recuperado', {
        id: merchantOrder.id || notification.resourceId,
        external_reference: merchantOrder.external_reference,
        status: merchantOrder.status
      });
      payment = extractApprovedPaymentFromMerchantOrder(merchantOrder);
      if (!payment) {
        console.warn('[PaymentsService] Nenhum pagamento aprovado encontrado no Merchant Order');
        payment = merchantOrder.payments?.[0] || null;
      }
    } else {
      console.log('[PaymentsService] Tipo de webhook identificado como payment');
      payment = await fetchPaymentDetails(notification.resourceId);
      console.log('[PaymentsService] Pagamento recuperado', {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference
      });
      merchantOrder = payment.order || null;
    }
  } catch (error) {
    console.error('[PaymentsService] Erro ao consultar Mercado Pago', error.stack || error.message);
    return { ignored: true, reason: 'Falha ao consultar Mercado Pago', details: error.message };
  }

  if (!payment) {
    console.warn('[PaymentsService] Retornando cedo: pagamento não recuperado');
    return { ignored: true, reason: 'Pagamento não recuperado.' };
  }

  const metadata = payment.metadata || merchantOrder?.metadata || {};
  console.log('[PaymentsService] Metadata encontrada', metadata);

  const externalReference = getNotificationReference(payment, merchantOrder);
  console.log('[PaymentsService] external_reference encontrado', externalReference);
  if (!externalReference) {
    console.warn('[PaymentsService] Retornando cedo: external_reference não encontrado');
    return { ignored: true, reason: 'external_reference não encontrado.' };
  }

  if (processingWebhooks.has(externalReference)) {
    console.log('[PaymentsService] Abortando webhook duplicado antes de qualquer side effect');
    return { ignored: true, reason: 'Race condition prevenida. Webhook simultâneo.' };
  }
  processingWebhooks.add(externalReference);
  setTimeout(() => processingWebhooks.delete(externalReference), 30000);

  const existingOrder = await getOrderByReference(externalReference);
  console.log('[PaymentsService] Pedido encontrado no banco', {
    external_reference: externalReference,
    orderId: existingOrder?.id,
    status: existingOrder?.status
  });
  if (!existingOrder) {
    processingWebhooks.delete(externalReference);
    console.warn('[PaymentsService] Retornando cedo: pedido não encontrado no banco');
    return { ignored: true, reason: 'Pedido não encontrado.' };
  }

  if (payment.status === 'approved' && existingOrder.status === 'paid') {
    console.log('[PaymentsService] Abortando webhook duplicado antes de qualquer side effect');
    console.log('[PaymentsService] Pedido já processado anteriormente');
    processingWebhooks.delete(externalReference);
    return {
      ignored: true,
      reason: 'Pedido já processado anteriormente.'
    };
  }

  const statusMap = mapMercadoPagoPaymentStatus(payment.status);
  const updatedOrder = await updateOrderByExternalReference(existingOrder.external_reference, {
    status: statusMap.orderStatus,
    payment_status: statusMap.paymentStatus,
    mercado_pago_payment_id: payment.id ? String(payment.id) : existingOrder.mercado_pago_payment_id,
    mercado_pago_merchant_order_id: payment.order?.id ? String(payment.order.id) : existingOrder.mercado_pago_merchant_order_id,
    mercado_pago_status: payment.status || null,
    mercado_pago_status_detail: payment.status_detail || null,
    paid_at: payment.status === 'approved' ? new Date().toISOString() : existingOrder.paid_at,
    payment_payload: payment
  });

  let shipping_type = String(metadata.shipping_type || '').toLowerCase().trim();
  if (!shipping_type && updatedOrder && updatedOrder.shipping_method) {
    shipping_type = isPickupShippingMethod(updatedOrder.shipping_method) ? 'pickup' : 'shipping';
  }
  const pickupOrder = isPickupShipping(payment, merchantOrder, updatedOrder);
  console.log('[PaymentsService] shipping_type identificado', {
    shipping_type,
    pickupOrder
  });
  const hasAlreadyNotified = Boolean(updatedOrder.shipping_notification_sent_at);

  if (payment.status === 'approved') {
    console.log('[PaymentsService] Pedido marcado como paid antes das notificações');

    // Carregar os itens completos para o email admin e outras funções (se ainda não carregados)
    const orderWithItems = await getOrderWithItems(existingOrder.external_reference);

    // Disparar o envio do Email Administrativo para a loja (somente uma vez por pedido aprovado)
    if (!existingOrder.paid_at) {
      console.log('[AdminEmail] envio iniciado');
      console.log('[AdminEmail] pedido:', updatedOrder.id);
      console.log('[AdminEmail] método:', updatedOrder.shipping_method);
      try {
        await sendAdminNotification(orderWithItems);
        console.log('[AdminEmail] email enviado');
      } catch (error) {
        console.error('[AdminEmail] erro:', error);
      }
    }

    const orderId = updatedOrder.id;
    if (shipping_type === 'shipping') {
      console.log('[PaymentsService] Fluxo Melhor Envio ativado');
      console.log('[PaymentsService] Criando envio Melhor Envio para pedido', orderId);
      if (updatedOrder.shipping_status !== 'processing') {
        try {
          console.log('[MelhorEnvio] Criando envio no carrinho');
          const shipmentId = await createShipmentInCart(orderWithItems, updatedOrder.melhor_envio_shipment_id || 1);
          console.log('[MelhorEnvio] Envio criado com sucesso', { shipmentId });

          await updateOrderByExternalReference(existingOrder.external_reference, {
            melhor_envio_shipment_id: String(shipmentId), // Salvar shipment_id retornado
            shipping_status: 'processing'
          });
        } catch (error) {
          console.error('[MelhorEnvio] Erro ao criar envio', error.stack || error.message);
        }
      } else {
        console.log('[PaymentsService] Envio já criado no carrinho do Melhor Envio para o pedido', updatedOrder.id);
      }
    } else if (pickupOrder || shipping_type === 'pickup') {
      console.log('[PaymentsService] Entrando na condição de pickup');
      if (!hasAlreadyNotified) {
        try {
          console.log('[PaymentsService] Chamando sendPickupNotification', { orderId: updatedOrder.id });
          const notifications = await sendPickupNotification(updatedOrder);
          console.log('[PaymentsService] Resultado da sendPickupNotification', notifications);
          await updateOrderByExternalReference(existingOrder.external_reference, {
            shipping_status: 'pickup_ready',
            shipping_notification_status: [notifications.email?.status, notifications.whatsapp?.status].includes('sent') ? 'sent' : 'failed',
            shipping_notification_sent_at: new Date().toISOString(),
            shipping_notification_log: JSON.stringify(notifications),
            shipping_email_status: notifications.email?.status || 'skipped',
            shipping_whatsapp_status: notifications.whatsapp?.status || 'skipped'
          });
          console.log('[PaymentsService] Notificações de pickup atualizadas no pedido', existingOrder.external_reference);
        } catch (error) {
          console.error('[PaymentsService] Falha ao enviar notificações de pickup', error.stack || error.message);
        }
      } else {
        console.log('[PaymentsService] Pickup já notificado anteriormente para pedido', updatedOrder.id);
      }
    } else {
      if (!hasAlreadyNotified) {
        try {
          console.log('[PaymentsService] Iniciando fluxo genérico de notificação para frete (sem Melhor Envio)', updatedOrder.id);
          const notificationResult = await sendOrderTrackingNotification(orderWithItems, {
            carrier: updatedOrder.shipping_provider || 'Transportadora',
            trackingCode: '',
            deadline: updatedOrder.shipping_deadline || 'A calcular',
            trackingUrl: ''
          });
          await updateOrderByExternalReference(existingOrder.external_reference, {
            shipping_status: 'processing',
            shipping_notification_status: [notificationResult.email?.status, notificationResult.whatsapp?.status].includes('sent') ? 'sent' : 'failed',
            shipping_notification_sent_at: new Date().toISOString(),
            shipping_notification_log: JSON.stringify(notificationResult),
            shipping_email_status: notificationResult.email?.status || 'skipped',
            shipping_whatsapp_status: notificationResult.whatsapp?.status || 'skipped'
          });
          console.log('[PaymentsService] Notificação genérica enviada para pedido', updatedOrder.id);
        } catch (error) {
          console.error('[PaymentsService] Falha ao enviar notificação genérica', error.stack || error.message);
        }
      }
    }
  }

  processingWebhooks.delete(externalReference);

  console.log('[PaymentsService] Finalizando processamento de webhook', {
    orderId: updatedOrder.id,
    paymentStatus: payment.status,
    pickupOrder,
    externalReference
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
