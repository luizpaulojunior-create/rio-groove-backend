const { randomUUID } = require('crypto');
const env = require('../config/env');
const { preferenceClient } = require('../lib/mercadopago');
const {
  createOrder,
  createOrderItems,
  deleteOrder,
  updateOrderById
} = require('./orders.service');
const {
  buildOrderNumber,
  onlyDigits
} = require('../utils/order');

async function createCheckout({ payload }) {
  const orderId = randomUUID();
  const orderNumber = buildOrderNumber();
  const externalReference = orderId;
  const shippingType = String(payload.shipping?.label || '').toLowerCase().includes('retirada')
    ? 'pickup'
    : 'shipping';

  const order = await createOrder({
    order: {
      id: orderId,
      order_number: orderNumber,
      external_reference: externalReference,
      status: 'awaiting_payment',
      payment_status: 'pending',
      payment_provider: 'mercado_pago',
      currency: env.defaultCurrency,
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone,
      customer_cpf: payload.customer.cpf || null,
      accepts_marketing: payload.customer.acceptsMarketing,
      shipping_method: payload.shipping.label,
      shipping_provider: payload.shipping.provider || null,
      melhor_envio_shipment_id: payload.shipping.id || null,
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

  try {
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

    const preferenceItems = payload.items.map((item) => ({
      title: `${item.productName} · ${item.color} · Tam ${item.size}`,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      currency_id: env.defaultCurrency,
      picture_url: item.imageUrl || undefined
    }));

    if (payload.shipping.price > 0) {
      preferenceItems.push({
        title: `Frete · ${payload.shipping.label}`,
        quantity: 1,
        unit_price: payload.shipping.price,
        currency_id: env.defaultCurrency
      });
    }

    const preference = await preferenceClient.create({
      body: {
        items: preferenceItems,
        external_reference: externalReference,
        statement_descriptor: env.statementDescriptor,
        notification_url: `${env.backendUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${env.frontendUrl}/?payment=success&external_reference=${externalReference}`,
          pending: `${env.frontendUrl}/?payment=pending&external_reference=${externalReference}`,
          failure: `${env.frontendUrl}/?payment=failure&external_reference=${externalReference}`
        },
        auto_return: 'approved',
        payer: {
          name: payload.customer.name,
          email: payload.customer.email,
          phone: {
            number: onlyDigits(payload.customer.phone)
          },
          identification: payload.customer.cpf
            ? {
                type: 'CPF',
                number: payload.customer.cpf
              }
            : undefined,
          address: {
            zip_code: payload.address.cep,
            street_name: payload.address.street,
            street_number: payload.address.number,
            neighborhood: payload.address.neighborhood,
            city: payload.address.city,
            federal_unit: payload.address.state
          }
        },
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          external_reference: externalReference,
          shipping_type: shippingType,
          shipping_label: payload.shipping?.label || ''
        }
      }
    });

    await updateOrderById(order.id, {
      mercado_pago_preference_id: preference.id,
      payment_init_point: preference.init_point || null,
      payment_sandbox_init_point: preference.sandbox_init_point || null
    });

    return {
      orderId: order.id,
      orderNumber,
      externalReference,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      publicKey: env.mercadoPagoPublicKey,
      totals: {
        subtotal: payload.subtotal,
        shipping: payload.shipping.price,
        total: payload.total
      }
    };
  } catch (error) {
    await deleteOrder(order.id);
    throw error;
  }
}

module.exports = {
  createCheckout
};
