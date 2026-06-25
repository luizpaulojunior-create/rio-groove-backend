const crypto = require('crypto');
const { parseCustomPaymentRef } = require('./customOrdersPayment.service');
const { getProductPaymentTotal, getPackagePaymentTotal } = require('../config/customPricing');
const { validatePurchasePayload } = require('../analytics/purchaseValidation');
const { resolvePurchaseConsent } = require('../analytics/consent');
const { resolveGaClientId } = require('../analytics/ga4ClientId');
const purchaseLog = require('../analytics/purchaseLog.repository');
const { registerProvider } = require('../analytics/providers');

const LOG_PREFIX = '[GA4-MP]';
const MP_COLLECT_URL = 'https://www.google-analytics.com/mp/collect';
const MP_DEBUG_URL = 'https://www.google-analytics.com/debug/mp/collect';
const RETRY_DELAYS_MS = [5_000, 30_000, 300_000];

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const scheduledRetries = new Map();

function getMeasurementId() {
  return String(process.env.GA4_MEASUREMENT_ID || '').trim();
}

function getApiSecret() {
  return String(process.env.GA4_API_SECRET || '').trim();
}

function isGa4MeasurementConfigured() {
  return Boolean(getMeasurementId() && getApiSecret());
}

function buildPurchaseEventId(transactionId) {
  return `purchase-${String(transactionId || '').trim()}`;
}

function resolveMeasurementClientId({ purchase, order, payment, kind, transactionId }) {
  const fromPurchase = normalizeGaClientIdFromValue(purchase?.ga_client_id);
  if (fromPurchase) return { clientId: fromPurchase, source: 'browser' };

  const fromContext = resolveGaClientId({ order, payment, kind });
  if (fromContext) return { clientId: fromContext, source: 'browser' };

  return {
    clientId: buildServerClientId(purchase?.client_id_seed || transactionId),
    source: 'derived',
  };
}

function normalizeGaClientIdFromValue(value) {
  const text = String(value || '').trim();
  return /^\d+\.\d+$/.test(text) ? text : null;
}

function buildServerClientId(seed) {
  const hash = crypto.createHash('sha256').update(String(seed || 'rio-groove')).digest('hex');
  const part1 = parseInt(hash.slice(0, 8), 16) || 1;
  const part2 = parseInt(hash.slice(8, 16), 16) || 1;
  return `${part1}.${part2}`;
}

function normalizeGa4Items(items = []) {
  return (items || []).map((item) => ({
    item_id: String(item.item_id || item.id || item.product_id || 'item'),
    item_name: String(item.item_name || item.name || item.product_name || 'Produto'),
    price: Number(item.price ?? item.unit_price ?? 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    ...(item.item_category ? { item_category: String(item.item_category) } : {}),
    ...(item.item_variant ? { item_variant: String(item.item_variant) } : {}),
  }));
}

function buildPurchaseParams(purchase) {
  const transactionId = String(purchase.transaction_id || '').trim();
  const params = {
    transaction_id: transactionId,
    value: Number(purchase.value || 0),
    currency: String(purchase.currency || 'BRL'),
    items: normalizeGa4Items(purchase.items),
    engagement_time_msec: 1,
  };

  const eventId = purchase.event_id || buildPurchaseEventId(transactionId);
  params.event_id = eventId;

  if (purchase.shipping != null) params.shipping = Number(purchase.shipping);
  if (purchase.tax != null) params.tax = Number(purchase.tax);
  if (purchase.coupon) params.coupon = String(purchase.coupon);

  return { params, eventId };
}

function isRetryableHttpStatus(status) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

function isRetryableError(error) {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNABORTED' || code === 'ENOTFOUND') {
    return true;
  }
  const message = String(error.message || '').toLowerCase();
  return message.includes('timeout') || message.includes('network') || message.includes('fetch failed');
}

function logStructured(entry) {
  console.log(LOG_PREFIX, {
    timestamp: new Date().toISOString(),
    ...entry,
  });
}

function logStructuredError(entry) {
  console.error(LOG_PREFIX, {
    timestamp: new Date().toISOString(),
    ...entry,
  });
}

async function postToMeasurementProtocol(body, { debug = false, timeoutMs = 12_000 } = {}) {
  const measurementId = getMeasurementId();
  const apiSecret = getApiSecret();
  const baseUrl = debug ? MP_DEBUG_URL : MP_COLLECT_URL;
  const url = `${baseUrl}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - started;
    let responseBody = null;
    if (debug) {
      responseBody = await response.json().catch(() => ({}));
    }

    return {
      ok: response.ok,
      status: response.status,
      latencyMs,
      responseBody,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      error,
    };
  } finally {
    clearTimeout(timer);
  }
}

function resolveStoreOrderCoupon(order) {
  return (
    order.coupon_code
    || order.raw_checkout_payload?.metadata?.coupon_code
    || order.raw_checkout_payload?.coupon_code
    || null
  );
}

function buildPurchaseFromStoreOrder(order) {
  if (!order?.id) return null;

  const items = (order.items || order.order_items || []).map((item) => ({
    item_id: String(item.product_slug || item.sku || item.product_name || item.id || 'product'),
    item_name: String(item.product_name || item.name || 'Produto'),
    price: Number(item.unit_price || 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    item_category: item.metadata_json?.category || undefined,
    item_variant: [item.color, item.size].filter(Boolean).join(' / ') || undefined,
  }));

  return {
    transaction_id: String(order.id),
    value: Number(order.total_amount ?? order.total ?? 0),
    currency: String(order.currency || 'BRL'),
    shipping: Number(order.shipping_amount || 0),
    tax: 0,
    coupon: resolveStoreOrderCoupon(order) || undefined,
    items: items.length ? items : [{
      item_id: 'order',
      item_name: `Pedido ${order.order_number || order.id}`,
      price: Number(order.total_amount ?? order.total ?? 0),
      quantity: 1,
    }],
    client_id_seed: order.customer_email || order.id,
  };
}

function buildCustomOrderTransactionId(orderId, phase) {
  if (phase === 'art') return `custom-art-${orderId}`;
  if (phase === 'package') return `custom-package-${orderId}`;
  return `custom-product-${orderId}`;
}

function buildPurchaseFromCustomOrder(order, phase) {
  if (!order?.id || !phase) return null;

  const qty = Math.max(1, Number(order.quantity) || 1);
  const protocol = order.protocol || order.id;
  const insumo = order.insumo || 'Personalizado';
  const transactionId = buildCustomOrderTransactionId(order.id, phase);

  if (phase === 'art') {
    const value = Number(order.art_fee_amount) || 0;
    return {
      transaction_id: transactionId,
      value,
      currency: 'BRL',
      shipping: 0,
      tax: 0,
      items: [{
        item_id: transactionId,
        item_name: `Arte exclusiva · ${protocol}`,
        price: value,
        quantity: 1,
        item_category: 'personalizado',
        item_variant: insumo,
      }],
      client_id_seed: order.contact_email || order.id,
    };
  }

  if (phase === 'package') {
    const value = getPackagePaymentTotal(order);
    const productSubtotal = Number(order.product_unit_amount || 0) * qty;
    const shipping = Number(order.shipping_amount) || 0;
    const artFee = Number(order.art_fee_amount) || 0;
    return {
      transaction_id: transactionId,
      value,
      currency: 'BRL',
      shipping,
      tax: 0,
      items: [
        {
          item_id: `custom-art-${order.id}`,
          item_name: `Arte exclusiva · ${protocol}`,
          price: artFee,
          quantity: 1,
          item_category: 'personalizado',
          item_variant: insumo,
        },
        {
          item_id: `custom-product-${order.id}`,
          item_name: `Peça personalizada · ${protocol}`,
          price: productSubtotal / qty,
          quantity: qty,
          item_category: 'personalizado',
          item_variant: insumo,
        },
      ],
      client_id_seed: order.contact_email || order.id,
    };
  }

  const value = getProductPaymentTotal(order);
  const unit = Number(order.product_unit_amount) || 0;
  const shipping = Number(order.shipping_amount) || 0;
  return {
    transaction_id: transactionId,
    value,
    currency: 'BRL',
    shipping,
    tax: 0,
    items: [{
      item_id: transactionId,
      item_name: `Peça personalizada · ${protocol}`,
      price: unit,
      quantity: qty,
      item_category: 'personalizado',
      item_variant: insumo,
    }],
    client_id_seed: order.contact_email || order.id,
  };
}

function buildPurchaseFromPayment(payment, orderWithItems) {
  const ref = String(
    payment?.external_reference
    || payment?.metadata?.external_reference
    || '',
  ).trim();

  const customRef = parseCustomPaymentRef(ref);
  if (customRef) {
    return buildPurchaseFromCustomOrder(orderWithItems, customRef.phase);
  }

  return buildPurchaseFromStoreOrder(orderWithItems);
}

/** Referência tardia para evitar circularidade no agendamento de retry. */
let executePurchaseSend = null;

function scheduleRetry(job, delayMs) {
  if (scheduledRetries.has(job.dedupKey)) return;
  const timer = setTimeout(() => {
    scheduledRetries.delete(job.dedupKey);
    if (executePurchaseSend) {
      void executePurchaseSend(job);
    }
  }, delayMs);
  scheduledRetries.set(job.dedupKey, timer);
}

class Ga4MeasurementService {
  isConfigured() {
    return isGa4MeasurementConfigured();
  }

  async _executeSend(job) {
    const {
      purchase,
      context = {},
      attempt = 1,
      analyticsConsent = null,
      order = null,
      payment = null,
      kind = 'store',
    } = job;

    const validation = validatePurchasePayload(purchase);
    const transactionId = validation.transactionId;
    const eventId = purchase.event_id || buildPurchaseEventId(transactionId);

    if (!validation.valid) {
      await purchaseLog.markIgnored({
        dedupKey: transactionId,
        transactionId,
        status: 'invalid',
        reason: validation.errors.join('; '),
        analyticsConsent,
      });
      logStructured({
        status: 'invalid',
        transaction_id: transactionId,
        event_id: eventId,
        attempt,
        reasons: validation.errors,
        ...context,
      });
      return { status: 'invalid', reason: validation.errors.join('; ') };
    }

    if (!isGa4MeasurementConfigured()) {
      logStructured({
        status: 'ignored',
        reason: 'not_configured',
        transaction_id: transactionId,
        event_id: eventId,
        attempt,
        ...context,
      });
      return { status: 'ignored', reason: 'not_configured' };
    }

    const consent = analyticsConsent === true
      ? true
      : resolvePurchaseConsent({ order, payment, kind });
    if (consent !== true) {
      await purchaseLog.markIgnored({
        dedupKey: transactionId,
        transactionId,
        status: 'consent_denied',
        reason: 'analytics_consent_not_granted',
        analyticsConsent: consent,
      });
      logStructured({
        status: 'consent_denied',
        transaction_id: transactionId,
        event_id: eventId,
        attempt,
        consent,
        ...context,
      });
      return { status: 'ignored', reason: 'consent_denied' };
    }

    const slot = await purchaseLog.beginSendAttempt({
      dedupKey: transactionId,
      transactionId,
      eventId,
      analyticsConsent: true,
      payload: purchase,
    });

    if (slot.action === 'duplicate') {
      logStructured({
        status: 'duplicate',
        transaction_id: transactionId,
        event_id: eventId,
        attempt,
        ...context,
      });
      return { status: 'duplicate', reason: 'already_sent' };
    }

    if (slot.action === 'failed_final' || slot.action === 'blocked') {
      logStructured({
        status: slot.action,
        transaction_id: transactionId,
        event_id: eventId,
        attempt: slot.existing?.attempts,
        ...context,
      });
      return { status: 'ignored', reason: slot.action };
    }

    const currentAttempt = slot.attempts || attempt;
    const { params } = buildPurchaseParams(purchase);
    const purchaseKind = context.kind || kind;
    const { clientId, source: clientIdSource } = resolveMeasurementClientId({
      purchase,
      order,
      payment,
      kind: purchaseKind,
      transactionId,
    });
    const body = {
      client_id: clientId,
      events: [{ name: 'purchase', params: { ...params, event_id: eventId } }],
    };

    const useDebug = process.env.GA4_MP_DEBUG === 'true';
    const result = await postToMeasurementProtocol(body, { debug: useDebug });

    if (result.ok) {
      await purchaseLog.markSent({
        dedupKey: transactionId,
        transactionId,
        eventId,
        httpStatus: result.status,
        responseBody: result.responseBody,
        latencyMs: result.latencyMs,
      });
      logStructured({
        status: 'sent',
        transaction_id: transactionId,
        event_id: eventId,
        attempt: currentAttempt,
        latency_ms: result.latencyMs,
        http_status: result.status,
        client_id_source: clientIdSource,
        value: params.value,
        currency: params.currency,
        item_count: params.items?.length || 0,
        ...context,
      });
      return { status: 'sent', transactionId, eventId, attempt: currentAttempt };
    }

    const retryable = result.status === 0
      ? isRetryableError(result.error)
      : isRetryableHttpStatus(result.status);

    if (retryable && currentAttempt < purchaseLog.MAX_ATTEMPTS) {
      const delayMs = RETRY_DELAYS_MS[Math.min(currentAttempt - 1, RETRY_DELAYS_MS.length - 1)];
      await purchaseLog.markRetryScheduled({
        dedupKey: transactionId,
        transactionId,
        eventId,
        attempts: currentAttempt,
        httpStatus: result.status || null,
        responseBody: result.responseBody,
        errorMessage: result.error?.message || `http_${result.status}`,
        latencyMs: result.latencyMs,
      });
      logStructured({
        status: 'retry_scheduled',
        transaction_id: transactionId,
        event_id: eventId,
        attempt: currentAttempt,
        next_delay_ms: delayMs,
        latency_ms: result.latencyMs,
        http_status: result.status || 0,
        error: result.error?.message,
        ...context,
      });
      scheduleRetry({
        purchase,
        context,
        attempt: currentAttempt + 1,
        analyticsConsent: true,
        order,
        payment,
        kind,
        dedupKey: transactionId,
      }, delayMs);
      return {
        status: 'retry_scheduled',
        transactionId,
        eventId,
        attempt: currentAttempt,
        nextDelayMs: delayMs,
      };
    }

    await purchaseLog.markFailed({
      dedupKey: transactionId,
      transactionId,
      eventId,
      attempts: currentAttempt,
      httpStatus: result.status || null,
      responseBody: result.responseBody,
      errorMessage: result.error?.message || `http_${result.status}`,
      latencyMs: result.latencyMs,
    });
    logStructuredError({
      status: 'failed',
      transaction_id: transactionId,
      event_id: eventId,
      attempt: currentAttempt,
      latency_ms: result.latencyMs,
      http_status: result.status || 0,
      response_body: result.responseBody,
      error: result.error?.message,
      ...context,
    });
    return { status: 'error', reason: result.error?.message || `http_${result.status}` };
  }

  async sendPurchase(purchase, context = {}) {
    return this._executeSend({
      purchase,
      context,
      attempt: 1,
      analyticsConsent: context.analyticsConsent,
      order: context.order,
      payment: context.payment,
      kind: context.kind || 'store',
      dedupKey: String(purchase?.transaction_id || '').trim(),
    });
  }

  async sendPurchaseForStoreOrder(order, context = {}) {
    const purchase = buildPurchaseFromStoreOrder(order);
    if (!purchase) {
      logStructured({ status: 'ignored', reason: 'invalid_order', ...context });
      return { status: 'ignored', reason: 'invalid_order' };
    }
    return this.sendPurchase(purchase, {
      kind: 'store',
      orderId: order.id,
      order,
      ...context,
    });
  }

  async sendPurchaseForCustomOrder(order, phase, context = {}) {
    const purchase = buildPurchaseFromCustomOrder(order, phase);
    if (!purchase) {
      logStructured({ status: 'ignored', reason: 'invalid_custom_order', phase, ...context });
      return { status: 'ignored', reason: 'invalid_custom_order' };
    }
    return this.sendPurchase(purchase, {
      kind: 'custom',
      orderId: order.id,
      phase,
      order,
      ...context,
    });
  }

  async sendPurchaseForApprovedPayment(payment, orderWithItems, context = {}) {
    const ref = String(
      payment?.external_reference
      || payment?.metadata?.external_reference
      || '',
    ).trim();
    const customRef = parseCustomPaymentRef(ref);

    if (customRef) {
      return this.sendPurchaseForCustomOrder(orderWithItems, customRef.phase, {
        source: 'webhook',
        paymentId: payment?.id,
        payment,
        ...context,
      });
    }

    return this.sendPurchaseForStoreOrder(orderWithItems, {
      source: 'webhook',
      paymentId: payment?.id,
      payment,
      ...context,
    });
  }
}

const ga4Measurement = new Ga4MeasurementService();
executePurchaseSend = (job) => ga4Measurement._executeSend(job);

registerProvider({
  id: 'ga4',
  isConfigured: () => ga4Measurement.isConfigured(),
  sendPurchase: (purchase, context) => ga4Measurement.sendPurchase(purchase, context),
});

module.exports = {
  ga4Measurement,
  Ga4MeasurementService,
  buildPurchaseFromStoreOrder,
  buildPurchaseFromCustomOrder,
  buildPurchaseFromPayment,
  buildPurchaseEventId,
  buildCustomOrderTransactionId,
  isGa4MeasurementConfigured,
};
