const env = require('../config/env');
const { preferenceClient } = require('../lib/mercadopago');
const {
  resolveReturnOrigin,
  buildMercadoPagoBackUrls,
  getMercadoPagoNotificationUrl,
} = require('../utils/checkout-urls');
const { getProductPaymentTotal, getPackagePaymentTotal } = require('../config/customPricing');
const { onlyDigits } = require('../utils/order');

function parseCustomPaymentRef(externalReference) {
  const ref = String(externalReference || '').trim();
  const artMatch = ref.match(/^custom-art-([0-9a-f-]{36})$/i);
  if (artMatch) return { orderId: artMatch[1], phase: 'art' };
  const productMatch = ref.match(/^custom-product-([0-9a-f-]{36})$/i);
  if (productMatch) return { orderId: productMatch[1], phase: 'product' };
  const packageMatch = ref.match(/^custom-package-([0-9a-f-]{36})$/i);
  if (packageMatch) return { orderId: packageMatch[1], phase: 'package' };
  return null;
}

async function createCustomOrderPaymentPreference({ order, phase, returnOrigin }) {
  const isArt = phase === 'art';
  const isPackage = phase === 'package';
  const amount = isArt
    ? Number(order.art_fee_amount)
    : isPackage
      ? getPackagePaymentTotal(order)
      : getProductPaymentTotal(order);

  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error('Valor de pagamento inválido para este pedido.');
    err.statusCode = 400;
    throw err;
  }

  const externalReference = isArt
    ? `custom-art-${order.id}`
    : isPackage
      ? `custom-package-${order.id}`
      : `custom-product-${order.id}`;
  const title = isArt
    ? `Arte exclusiva · ${order.protocol}`
    : isPackage
      ? `Pacote personalizado · ${order.protocol}`
      : `Peça personalizada · ${order.protocol}`;

  const returnBase = resolveReturnOrigin(returnOrigin);
  const backUrls = buildMercadoPagoBackUrls(returnBase, externalReference);
  const isTestToken = String(env.mercadoPagoAccessToken || '').startsWith('TEST-');

  const preferenceBody = {
    items: [{
      title,
      quantity: 1,
      unit_price: amount,
      currency_id: env.defaultCurrency || 'BRL',
    }],
    external_reference: externalReference,
    statement_descriptor: env.statementDescriptor || 'RIO GROOVE',
    notification_url: getMercadoPagoNotificationUrl(),
    back_urls: backUrls,
    auto_return: 'approved',
    payer: {
      name: order.contact_name,
      email: order.contact_email,
      phone: { number: onlyDigits(order.contact_phone) },
    },
    metadata: {
      custom_order_id: order.id,
      custom_order_protocol: order.protocol,
      payment_phase: phase,
    },
  };

  const preference = await preferenceClient.create({ body: preferenceBody });
  const prefData = preference.body || preference;
  const checkoutUrl = isTestToken
    ? prefData.sandbox_init_point || prefData.init_point
    : prefData.init_point || prefData.sandbox_init_point;

  if (!checkoutUrl) {
    throw new Error('Mercado Pago não retornou URL de checkout.');
  }

  return {
    checkoutUrl,
    externalReference,
    preferenceId: prefData.id,
    amount,
  };
}

module.exports = {
  parseCustomPaymentRef,
  createCustomOrderPaymentPreference,
};
