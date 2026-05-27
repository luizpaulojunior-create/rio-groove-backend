const { normalizeString, isValidEmail } = require('./order');

function verifyOrderPublicStatusAccess(order, emailHint) {
  const email = normalizeString(emailHint).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return { ok: false, status: 400, message: 'Informe o e-mail usado no pedido.' };
  }

  const orderEmail = normalizeString(order.customer_email).toLowerCase();
  if (!orderEmail) {
    return { ok: false, status: 403, message: 'Pedido sem e-mail associado.' };
  }

  if (orderEmail !== email) {
    return { ok: false, status: 403, message: 'E-mail não confere com este pedido.' };
  }

  return { ok: true };
}

function buildPublicOrderStatusResponse(order) {
  return {
    orderId: order.id,
    orderNumber: order.order_number,
    externalReference: order.external_reference,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentProvider: order.payment_provider,
    total: order.total_amount,
    subtotal: order.subtotal_amount,
    shippingAmount: order.shipping_amount,
    shippingMethod: order.shipping_method,
    paidAt: order.paid_at,
    createdAt: order.created_at,
    items: (order.items || []).map((item) => ({
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
      color: item.color,
      size: item.size,
    })),
  };
}

module.exports = {
  verifyOrderPublicStatusAccess,
  buildPublicOrderStatusResponse,
};
