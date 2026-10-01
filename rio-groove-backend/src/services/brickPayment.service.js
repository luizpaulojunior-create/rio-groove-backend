const { randomUUID } = require('crypto');
const env = require('../config/env');
const { paymentClient } = require('../lib/mercadopago');
const { onlyDigits } = require('../utils/order');
const { isOrderPaid } = require('../utils/orderFulfillment');
const { getMercadoPagoNotificationUrl } = require('../utils/checkout-urls');
const { getOrderWithItems, updateOrderById } = require('./orders.service');
const { restoreStockForOrder } = require('./stockCheckout.service');
const { applyMercadoPagoPaymentUpdate, fetchPaymentDetails } = require('./payments.service');

const OPEN_PAYMENT_STATUSES = new Set(['pending', 'in_process', 'in_mediation', 'approved', 'authorized']);

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function readMercadoPagoError(error) {
  const causes = Array.isArray(error?.cause)
    ? error.cause.map((item) => item?.description || item?.message).filter(Boolean)
    : [];
  return causes.join(' ') || error?.message || 'Mercado Pago recusou o pagamento.';
}

function isCheckoutPayable(order) {
  if (!order || isOrderPaid(order)) return false;
  const status = String(order.status || '').toLowerCase();
  const fulfillment = String(order.fulfillment_status || '').toLowerCase();
  if (['cancelled', 'payment_failed', 'refunded'].includes(status)) return false;
  if (fulfillment === 'cancelado') return false;
  return true;
}

function buildPayer(order, formData) {
  const payer = { email: order.customer_email };
  const identification = formData?.payer?.identification;
  const type = identification?.type ? String(identification.type) : '';
  const number = identification?.number ? onlyDigits(identification.number) : '';

  if (type && number) {
    payer.identification = { type, number };
  } else if (order.customer_cpf) {
    payer.identification = { type: 'CPF', number: onlyDigits(order.customer_cpf) };
  }

  return payer;
}

function buildPaymentBody(order, formData) {
  const amount = Number(Number(order.total_amount).toFixed(2));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw httpError('Total do pedido inválido.', 400);
  }

  const clientAmount = Number(formData?.transaction_amount);
  if (Number.isFinite(clientAmount) && Math.abs(clientAmount - amount) > 0.009) {
    throw httpError('O valor do pagamento não confere com o pedido. Atualize a página e tente de novo.', 409);
  }

  const paymentMethodId = String(formData?.payment_method_id || '').trim();
  if (!paymentMethodId || paymentMethodId.length > 40) {
    throw httpError('Forma de pagamento inválida.', 400);
  }

  const token = formData?.token ? String(formData.token) : '';
  const installments = Math.min(24, Math.max(1, Number(formData?.installments) || 1));
  const issuerId = formData?.issuer_id ? String(formData.issuer_id) : '';

  const body = {
    transaction_amount: amount,
    description: `Pedido ${order.order_number}`,
    payment_method_id: paymentMethodId,
    installments,
    external_reference: order.external_reference,
    statement_descriptor: env.statementDescriptor,
    notification_url: getMercadoPagoNotificationUrl(),
    payer: buildPayer(order, formData),
    metadata: {
      order_id: String(order.id),
      order_number: String(order.order_number),
      checkout_mode: 'brick',
    },
  };

  if (token) body.token = token;
  if (issuerId && /^\d+$/.test(issuerId)) body.issuer_id = Number(issuerId);
  return body;
}

function readPixTransaction(payment) {
  return payment?.point_of_interaction?.transaction_data || {};
}

function hasPixPayload(payment) {
  const transaction = readPixTransaction(payment);
  return Boolean(transaction.qr_code || transaction.qr_code_base64);
}

async function ensurePixPayload(payment) {
  if (hasPixPayload(payment) || !payment?.id) return payment;
  const status = String(payment.status || '').toLowerCase();
  if (!['pending', 'in_process'].includes(status)) return payment;

  try {
    const fresh = await fetchPaymentDetails(payment.id);
    return fresh || payment;
  } catch (error) {
    console.error('[Checkout Brick] Falha ao buscar QR Pix', error.message);
    return payment;
  }
}

function publicPaymentResult(order, payment) {
  const transaction = readPixTransaction(payment);
  return {
    paymentId: payment?.id ? String(payment.id) : null,
    status: payment?.status || null,
    statusDetail: payment?.status_detail || null,
    orderId: order.id,
    orderNumber: order.order_number,
    externalReference: order.external_reference,
    qrCode: transaction.qr_code || null,
    qrCodeBase64: transaction.qr_code_base64 || null,
    ticketUrl: transaction.ticket_url || null,
  };
}

async function loadPayableOrder(orderId) {
  const ref = String(orderId || '').trim();
  if (!ref) throw httpError('Pedido não informado.', 400);

  const order = await getOrderWithItems(ref);
  if (!order) throw httpError('Pedido não encontrado.', 404);
  if (isOrderPaid(order)) throw httpError('Este pedido já foi pago.', 409);
  if (!isCheckoutPayable(order)) {
    throw httpError('Este pedido não está mais disponível para pagamento. Confirme a compra de novo.', 409);
  }
  return order;
}

async function payCheckoutWithBrick({ orderId, formData, idempotencyKey }) {
  const order = await loadPayableOrder(orderId);
  const body = buildPaymentBody(order, formData || {});
  const key = String(idempotencyKey || '').trim() || randomUUID();

  console.log('[Checkout Brick] Criando pagamento', {
    orderId: order.id,
    orderNumber: order.order_number,
    paymentMethodId: body.payment_method_id,
    amount: body.transaction_amount,
  });

  let payment;
  try {
    const created = await paymentClient.create({
      body,
      requestOptions: { idempotencyKey: key },
    });
    payment = created?.body || created;
  } catch (error) {
    console.error('[Checkout Brick] Mercado Pago recusou a criação', readMercadoPagoError(error));
    throw httpError(readMercadoPagoError(error), 400);
  }

  try {
    await applyMercadoPagoPaymentUpdate(payment, null);
  } catch (error) {
    console.error('[Checkout Brick] Pagamento criado, falha ao aplicar no pedido', error.message);
  }

  const withPix = await ensurePixPayload(payment);
  return publicPaymentResult(order, withPix);
}

async function abandonUnpaidCheckout({ orderId }) {
  const order = await loadPayableOrder(orderId);
  const mpStatus = String(order.mercado_pago_status || '').toLowerCase();
  if (OPEN_PAYMENT_STATUSES.has(mpStatus)) {
    throw httpError('Este pedido já tem um pagamento em andamento.', 409);
  }

  const withItems = order.items ? order : await getOrderWithItems(order.id);
  await restoreStockForOrder(withItems, withItems.items || withItems.order_items || []);
  await updateOrderById(order.id, {
    status: 'cancelled',
    payment_status: 'failed',
    fulfillment_status: 'cancelado',
  });

  return { abandoned: true, orderId: order.id };
}

module.exports = {
  payCheckoutWithBrick,
  abandonUnpaidCheckout,
  buildPaymentBody,
};
