const { randomUUID } = require('crypto');
const env = require('../config/env');
const { preferenceClient } = require('../lib/mercadopago');
const {
  createOrder,
  createOrderItems,
  deleteOrder,
  updateOrderById,
  getOrderWithItems,
} = require('./orders.service');
const {
  buildOrderNumber,
  onlyDigits
} = require('../utils/order');
const { validateStockForItems, reserveStockForOrder, restoreStockForOrder } = require('./stockCheckout.service');
const { resolveAffiliate, upsertNewsletterSubscriber } = require('./growth.service');
const {
  resolveReturnOrigin,
  buildMercadoPagoBackUrls,
  getMercadoPagoNotificationUrl,
} = require('../utils/checkout-urls');

async function createCheckout({ payload }) {
  const orderId = randomUUID();
  const orderNumber = buildOrderNumber();
  const externalReference =
    payload.external_reference || payload.externalReference || orderId;
  const shippingType = String(payload.shipping?.label || '').toLowerCase().includes('retirada')
    ? 'pickup'
    : 'shipping';

  await validateStockForItems(payload.items);

  console.log('[CHECKOUT BACKEND] Shipping recebido', payload.shipping);
  
  console.log('[Checkout] Criando pedido', orderId);

  const affiliateRef =
    payload.metadata?.affiliate_ref ||
    payload.metadata?.affiliateRef ||
    payload.affiliateRef ||
    null;
  const affiliate = affiliateRef ? await resolveAffiliate(affiliateRef) : null;

  const paymentProvider = payload.provider === 'stripe' ? 'stripe' : 'mercado_pago';

  const orderPayload = {
      id: orderId,
      order_number: orderNumber,
      external_reference: externalReference,
      status: 'awaiting_payment',
      payment_status: 'pending',
      payment_provider: paymentProvider,
      currency: env.defaultCurrency,
      customer_id: payload.customer?.id || payload.customerId || null,
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone,
      customer_cpf: payload.customer.cpf || null,
      accepts_marketing: payload.customer.acceptsMarketing,
      affiliate_id: affiliate?.id || null,
      affiliate_slug: affiliate?.slug || null,
      shipping_method: payload.shipping.label,
      shipping_provider: payload.shipping.provider || null,
      melhor_envio_shipment_id: null,
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
      discount_amount: payload.discountAmount || 0,
      coupon_code: payload.couponApplied?.code || null,
      coupon_id: payload.couponApplied?.id || null,
      total_amount: payload.total,
      raw_checkout_payload: payload.rawPayload,
      fulfillment_status: 'aguardando_pagamento',
      order_logs: [{
        id: '1',
        action: 'Pedido criado',
        message: 'Pedido criado via checkout',
        user: 'Sistema',
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }],
  };

  let order;
  try {
    order = await createOrder({ order: orderPayload });
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('affiliate') || msg.includes('column')) {
      const { affiliate_id, affiliate_slug, ...rest } = orderPayload;
      order = await createOrder({ order: rest });
    } else {
      throw err;
    }
  }

  if (payload.customer.acceptsMarketing) {
    await upsertNewsletterSubscriber({
      email: payload.customer.email,
      name: payload.customer.name,
      source: 'checkout',
    });
  }

  console.log('[Checkout] Pedido salvo no banco:', order?.id);

  const orderItemsPayload = payload.items.map((item) => ({
    order_id: order.id,
    product_name: item.name || item.productName,
    product_slug: item.slug || null,
    variant_id: null,
    sku: item.sku || null,
    image_url: item.image || item.imageUrl || null,
    color: item.color || null,
    size: item.size || null,
    quantity: item.quantity,
    unit_price: item.unit_price || item.unitPrice,
    line_total: item.lineTotal || item.line_total || ((item.quantity || 1) * (item.unit_price || item.unitPrice || 0)),
    metadata_json: item.raw || item
  }));

  try {
    await createOrderItems(orderItemsPayload);
    await reserveStockForOrder(order, payload.items);
  } catch (stockError) {
    await deleteOrder(order.id);
    throw stockError;
  }

  try {

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

    if (paymentProvider === 'stripe') {
      const stripe = require('stripe')(env.stripeSecretKey);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: preferenceItems.map(item => ({
          price_data: {
            currency: env.defaultCurrency.toLowerCase(),
            product_data: {
              name: item.title,
            },
            unit_amount: Math.round(item.unit_price * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${env.frontendUrl}/order-success?order_id=${orderId}`,
        cancel_url: `${env.frontendUrl}/cart`,
        client_reference_id: orderId,
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          external_reference: externalReference,
          shipping_type: shippingType,
          shipping_label: payload.shipping?.label || '',
          shipping_service_id: payload.shipping?.id || ''
        }
      });

      await updateOrderById(order.id, {
        stripe_payment_intent_id: session.id
      });

      return {
        orderId: order.id,
        orderNumber,
        externalReference,
        checkoutUrl: session.url,
        sessionId: session.id,
        publicKey: env.stripePublicKey,
        totals: {
          subtotal: payload.subtotal,
          shipping: payload.shipping.price,
          discount: payload.discountAmount || 0,
          total: payload.total
        }
      };
    }

    const returnBase = resolveReturnOrigin(
      payload.return_origin || payload.returnOrigin
    );
    const notificationUrl = getMercadoPagoNotificationUrl();
    const backUrls = buildMercadoPagoBackUrls(returnBase, externalReference);
    const autoReturn = payload.auto_return || payload.autoReturn || 'approved';
    const metadata = {
      order_id: orderId,
      order_number: orderNumber,
      shipping_type: shippingType,
      shipping_label: payload.shipping?.label || '',
      shipping_service_id: payload.shipping?.id || '',
      ...payload.metadata
    };

    const preferenceBody = {
      items: preferenceItems,
      external_reference: externalReference,
      statement_descriptor: env.statementDescriptor,
      notification_url: notificationUrl,
      back_urls: backUrls,
      auto_return: autoReturn,
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
      metadata
    };

    console.log('[Checkout] Criando preferência MP', {
      externalReference,
      itemCount: preferenceItems.length,
      total: payload.total,
    });

    const preference = await preferenceClient.create({
      body: preferenceBody
    });
    
    // MP SDK v2.3.0 sometimes returns the preference nested in 'body' depending on usage, 
    // but preferenceClient.create returns the object itself or nested? Let's safeguard:
    const prefData = preference.body || preference;
    const isTestToken = String(env.mercadoPagoAccessToken || '').startsWith('TEST-');
    const checkoutUrl = isTestToken
      ? prefData.sandbox_init_point || prefData.init_point
      : prefData.init_point || prefData.sandbox_init_point;

    console.log('[Checkout] init_point recebido:', prefData.init_point);
    console.log('[Checkout] sandbox_init_point recebido:', prefData.sandbox_init_point);

    await updateOrderById(order.id, {
      mercado_pago_preference_id: prefData.id,
      payment_init_point: prefData.init_point || null,
      payment_sandbox_init_point: prefData.sandbox_init_point || null
    });

    console.log('[Checkout] Retornando URL para frontend');

    return {
      orderId: order.id,
      orderNumber,
      externalReference,
      preferenceId: prefData.id,
      initPoint: prefData.init_point,
      sandboxInitPoint: prefData.sandbox_init_point,
      checkoutUrl,
      publicKey: env.mercadoPagoPublicKey,
      totals: {
        subtotal: payload.subtotal,
        shipping: payload.shipping.price,
        discount: payload.discountAmount || 0,
        total: payload.total
      }
    };
  } catch (error) {
    console.error('[Checkout] Erro capturado:', error);
    if (order?.id) {
      try {
        const orderWithItems = await getOrderWithItems(order.id);
        await restoreStockForOrder(orderWithItems, orderWithItems?.items || payload.items);
      } catch (restoreError) {
        console.error('[Checkout] Falha ao devolver estoque reservado:', restoreError.message);
      }
      await deleteOrder(order.id);
    }
    throw error;
  }
}

module.exports = {
  createCheckout
};
