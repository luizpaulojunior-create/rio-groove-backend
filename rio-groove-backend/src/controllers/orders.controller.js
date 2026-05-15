const asyncHandler = require('../utils/asyncHandler');
const { validateCheckoutPayload } = require('../utils/validation');
const { createOrder, createOrderItems, getOrderWithItems } = require('../services/orders.service');
const { buildOrderNumber, buildExternalReference } = require('../utils/order');

const createManualOrder = asyncHandler(async (req, res) => {
  const validation = validateCheckoutPayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Payload de pedido inválido.',
      errors: validation.errors
    });
  }

  const payload = validation.data;
  const orderNumber = buildOrderNumber();
  const externalReference = buildExternalReference(orderNumber);

  const order = await createOrder({
    order: {
      order_number: orderNumber,
      external_reference: externalReference,
      status: 'created',
      payment_status: 'pending',
      payment_provider: 'manual',
      currency: 'BRL',
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone,
      customer_cpf: payload.customer.cpf || null,
      accepts_marketing: payload.customer.acceptsMarketing,
      shipping_method: payload.shipping.label,
      shipping_amount: payload.shipping.price,
      shipping_deadline: payload.shipping.deadline || null,
      shipping_cep: payload.address.cep,
      shipping_street: payload.address.street,
      shipping_number: payload.address.number,
      shipping_complement: payload.address.complement || null,
      shipping_neighborhood: payload.address.neighborhood,
      shipping_city: payload.address.city,
      shipping_state: payload.address.state,
      notes: payload.address.notes || null,
      items_count: payload.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal_amount: payload.subtotal,
      total_amount: payload.total,
      raw_checkout_payload: payload.rawPayload
    }
  });

  await createOrderItems(
    payload.items.map((item) => ({
      order_id: order.id,
      product_name: item.productName,
      product_slug: item.slug || null,
      image_url: item.imageUrl || null,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      metadata_json: item.raw
    }))
  );

  return res.status(201).json({
    message: 'Pedido criado com sucesso.',
    orderNumber,
    externalReference,
    orderId: order.id
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const reference = req.params.reference;
  const order = await getOrderWithItems(reference);

  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  return res.json({ order });
});

module.exports = {
  createManualOrder,
  getOrder
};
