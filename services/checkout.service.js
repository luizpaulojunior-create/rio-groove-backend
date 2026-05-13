function normalizePrice(value) {
  if (value === null || value === undefined) return 0;
  
  // Se já for um número (ex: 289.7), apenas garante que tenha no máximo 2 casas decimais
  if (typeof value === 'number') {
    return Math.round(value * 100) / 100;
  }

  if (typeof value === 'string') {
    // Remove R$, espaços e pontos de milhar (ex: 1.289,70 -> 1289,70)
    let cleanValue = value.replace(/[R$\s.]/g, '').trim();
    
    // Troca a vírgula decimal por ponto (ex: 1289,70 -> 1289.70)
    cleanValue = cleanValue.replace(',','.');
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  return 0;
}

  if (typeof value === 'string') {
    // 1. Remove espaços e caracteres de moeda (R$)
    let cleanValue = value.replace(/[R$\s]/g, '').trim();

    // 2. Lógica para tratar separadores:
    // Se tiver ponto e vírgula (ex: 1.250,50), remove o ponto e troca a vírgula por ponto.
    if (cleanValue.includes('.') && cleanValue.includes(',')) {
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } 
    // Se tiver apenas vírgula (ex: 129,90), troca por ponto.
    else if (cleanValue.includes(',')) {
      cleanValue = cleanValue.replace(',', '.');
    }

    const parsed = Number(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  return Number(value) || 0;
}

---

## Serviço de Checkout Atualizado

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
  buildExternalReference,
  onlyDigits
} = require('../utils/order');

async function createCheckout({ payload }) {
  // LOG DE DEBUG: Essencial para ver se o erro vem do Frontend
  console.log('PAYLOAD RECEBIDO DO FRONT:', JSON.stringify(payload, null, 2));

  const orderNumber = buildOrderNumber();
  const externalReference = buildExternalReference(orderNumber);

  // Criamos o pedido no banco de dados primeiro
  const order = await createOrder({
    order: {
      order_number: orderNumber,
      external_reference: externalReference,
      status: 'awaiting_payment',
      payment_status: 'pending',
      payment_provider: 'mercado_pago',
      currency: env.defaultCurrency || 'BRL',
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone,
      customer_cpf: payload.customer.cpf || null,
      accepts_marketing: payload.customer.acceptsMarketing,
      shipping_method: payload.shipping?.label || 'Não informado',
      shipping_amount: normalizePrice(payload.shipping?.price || 0),
      shipping_deadline: payload.shipping?.deadline || null,
      shipping_cep: payload.address.cep,
      shipping_street: payload.address.street,
      shipping_number: payload.address.number,
      shipping_complement: payload.address.complement || null,
      shipping_neighborhood: payload.address.neighborhood,
      shipping_city: payload.address.city,
      shipping_state: payload.address.state,
      notes: payload.address.notes || null,
      items_count: payload.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      subtotal_amount: normalizePrice(payload.subtotal),
      total_amount: normalizePrice(payload.total),
      raw_checkout_payload: payload.rawPayload
    }
  });

  try {
    // 1. Preparar itens para o Banco de Dados
    const itemsForDB = payload.items.map((item) => ({
      order_id: order.id,
      product_name: item.productName,
      product_slug: item.slug || null,
      image_url: item.imageUrl || null,
      color: item.color,
      size: item.size,
      quantity: Number(item.quantity),
      // Apenas se você confirmou que o valor chega multiplicado por 100 do front
unit_price: normalizePrice(item.unit_price || item.price) / 10,
      line_total: normalizePrice(item.lineTotal || (item.price * item.quantity)),
      metadata_json: item.raw
    }));

    await createOrderItems(itemsForDB);

    // 2. Preparar itens para o Mercado Pago (Checkout Pro)
    const preferenceItems = payload.items.map((item) => {
      const price = normalizePrice(item.unit_price || item.price);
      
      // LOG DE VERIFICAÇÃO DE PREÇO UNITÁRIO
      console.log(`Item: ${item.productName} | Preço Original: ${item.unit_price || item.price} | Normalizado: ${price}`);

      return {
        title: item.productName,
        description: `${item.color || ''} | Tam ${item.size || ''}`.trim(),
        quantity: Number(item.quantity),
        unit_price: price,
        currency_id: 'BRL',
        picture_url: item.imageUrl || undefined
      };
    });

    // 3. Adicionar Frete como um item no Mercado Pago (Opcional, mas recomendado)
    const shippingPrice = normalizePrice(payload.shipping?.price);
    if (shippingPrice > 0) {
      preferenceItems.push({
        title: `Frete: ${payload.shipping.label || ''}`.trim(),
        quantity: 1,
        unit_price: shippingPrice,
        currency_id: 'BRL'
      });
    }

    const mpResponse = await preferenceClient.create({
      body: {
        items: preferenceItems,
        external_reference: externalReference,
        statement_descriptor: env.statementDescriptor || 'LOJA ONLINE',
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
          phone: { number: onlyDigits(payload.customer.phone) },
          identification: payload.customer.cpf ? { type: 'CPF', number: onlyDigits(payload.customer.cpf) } : undefined,
          address: {
            zip_code: onlyDigits(payload.address.cep),
            street_name: payload.address.street,
            street_number: payload.address.number,
            neighborhood: payload.address.neighborhood,
            city: payload.address.city,
            federal_unit: payload.address.state
          }
        },
        metadata: {
          order_number: orderNumber,
          external_reference: externalReference
        }
      }
    });

    const preference = mpResponse?.body || mpResponse;
    const checkoutUrl = preference?.init_point || preference?.sandbox_init_point || null;

    if (!checkoutUrl) {
      throw new Error('O Mercado Pago não retornou um link de pagamento válido.');
    }

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
      checkoutUrl,
      publicKey: env.mercadoPagoPublicKey,
      totals: {
        subtotal: normalizePrice(payload.subtotal),
        shipping: shippingPrice,
        total: normalizePrice(payload.total)
      }
    };

  } catch (error) {
    console.error('ERRO NO CHECKOUT:', error);
    await deleteOrder(order.id);
    throw error;
  }
}

module.exports = { createCheckout };
