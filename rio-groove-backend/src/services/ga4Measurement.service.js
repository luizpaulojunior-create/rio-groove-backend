const crypto = require('crypto');
const { supabase } = require('../lib/supabase');
const { parseCustomPaymentRef } = require('./customOrdersPayment.service');
const { getProductPaymentTotal, getPackagePaymentTotal } = require('../config/customPricing');

const LOG_PREFIX = '[GA4-MP]';
const MP_COLLECT_URL = 'https://www.google-analytics.com/mp/collect';
const MP_DEBUG_URL = 'https://www.google-analytics.com/debug/mp/collect';

/** @type {Set<string>} */
const memoryDedup = new Set();

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

async function claimDedupKey(dedupKey) {
  const key = String(dedupKey || '').trim();
  if (!key) {
    return { claimed: false, reason: 'missing_dedup_key' };
  }

  if (memoryDedup.has(key)) {
    return { claimed: false, reason: 'memory_duplicate' };
  }

  try {
    const { error } = await supabase
      .from('ga4_purchase_log')
      .insert({
        dedup_key: key,
        transaction_id: key,
        source: 'measurement_protocol',
      });

    if (error) {
      if (error.code === '23505') {
        return { claimed: false, reason: 'db_duplicate' };
      }
      if (error.code === '42P01') {
        memoryDedup.add(key);
        return { claimed: true, reason: 'memory_fallback_no_table' };
      }
      console.warn(`${LOG_PREFIX} Falha ao registrar deduplicação — usando cache em memória`, error.message);
      memoryDedup.add(key);
      return { claimed: true, reason: 'memory_fallback_db_error' };
    }

    memoryDedup.add(key);
    return { claimed: true, reason: 'db_claimed' };
  } catch (error) {
    console.warn(`${LOG_PREFIX} Erro inesperado na deduplicação — usando cache em memória`, error.message);
    memoryDedup.add(key);
    return { claimed: true, reason: 'memory_fallback_exception' };
  }
}

async function postToMeasurementProtocol(body, { debug = false } = {}) {
  const measurementId = getMeasurementId();
  const apiSecret = getApiSecret();
  const baseUrl = debug ? MP_DEBUG_URL : MP_COLLECT_URL;
  const url = `${baseUrl}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (debug) {
    const debugPayload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, debugPayload };
  }

  return { ok: response.ok, status: response.status };
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

class Ga4MeasurementService {
  isConfigured() {
    return isGa4MeasurementConfigured();
  }

  /**
   * Envia evento purchase via Measurement Protocol.
   * @returns {'sent'|'duplicate'|'ignored'|'error'}
   */
  async sendPurchase(purchase, context = {}) {
    const transactionId = String(purchase?.transaction_id || '').trim();

    if (!transactionId) {
      console.log(`${LOG_PREFIX} purchase ignorado — transaction_id ausente`, context);
      return { status: 'ignored', reason: 'missing_transaction_id' };
    }

    if (!isGa4MeasurementConfigured()) {
      console.log(`${LOG_PREFIX} purchase ignorado — GA4_MEASUREMENT_ID ou GA4_API_SECRET não configurados`, {
        transactionId,
        ...context,
      });
      return { status: 'ignored', reason: 'not_configured' };
    }

    const dedup = await claimDedupKey(transactionId);
    if (!dedup.claimed) {
      console.log(`${LOG_PREFIX} purchase duplicado — não reenviado`, {
        transactionId,
        dedupReason: dedup.reason,
        ...context,
      });
      return { status: 'duplicate', reason: dedup.reason };
    }

    const { params, eventId } = buildPurchaseParams(purchase);
    const clientId = buildServerClientId(purchase.client_id_seed || transactionId);

    const body = {
      client_id: clientId,
      events: [{
        name: 'purchase',
        params,
      }],
    };

    try {
      const useDebug = process.env.GA4_MP_DEBUG === 'true';
      const result = await postToMeasurementProtocol(body, { debug: useDebug });

      if (!result.ok) {
        memoryDedup.delete(transactionId);
        try {
          await supabase.from('ga4_purchase_log').delete().eq('dedup_key', transactionId);
        } catch {
          /* best effort rollback */
        }
        console.error(`${LOG_PREFIX} erro ao enviar purchase`, {
          transactionId,
          status: result.status,
          debugPayload: result.debugPayload,
          ...context,
        });
        return { status: 'error', reason: `http_${result.status}` };
      }

      if (useDebug && result.debugPayload) {
        console.log(`${LOG_PREFIX} debug response`, result.debugPayload);
      }

      console.log(`${LOG_PREFIX} purchase enviado`, {
        transactionId,
        eventId,
        value: params.value,
        currency: params.currency,
        itemCount: params.items?.length || 0,
        dedupReason: dedup.reason,
        ...context,
      });
      return { status: 'sent', transactionId, eventId };
    } catch (error) {
      memoryDedup.delete(transactionId);
      try {
        await supabase.from('ga4_purchase_log').delete().eq('dedup_key', transactionId);
      } catch {
        /* best effort rollback */
      }
      console.error(`${LOG_PREFIX} erro ao enviar purchase`, {
        transactionId,
        message: error.message,
        ...context,
      });
      return { status: 'error', reason: error.message };
    }
  }

  async sendPurchaseForStoreOrder(order, context = {}) {
    const purchase = buildPurchaseFromStoreOrder(order);
    if (!purchase) {
      console.log(`${LOG_PREFIX} purchase ignorado — pedido inválido`, context);
      return { status: 'ignored', reason: 'invalid_order' };
    }
    return this.sendPurchase(purchase, { kind: 'store', orderId: order.id, ...context });
  }

  async sendPurchaseForCustomOrder(order, phase, context = {}) {
    const purchase = buildPurchaseFromCustomOrder(order, phase);
    if (!purchase) {
      console.log(`${LOG_PREFIX} purchase ignorado — pedido personalizado inválido`, { phase, ...context });
      return { status: 'ignored', reason: 'invalid_custom_order' };
    }
    return this.sendPurchase(purchase, { kind: 'custom', orderId: order.id, phase, ...context });
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
        ...context,
      });
    }

    return this.sendPurchaseForStoreOrder(orderWithItems, {
      source: 'webhook',
      paymentId: payment?.id,
      ...context,
    });
  }
}

const ga4Measurement = new Ga4MeasurementService();

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
