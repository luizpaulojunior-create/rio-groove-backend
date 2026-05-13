const env = require('../config/env');

console.log('BACKEND NOVO RODANDO');

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

// =====================================
// NORMALIZA PREÇOS EM REAIS
// SEM CONVERSÃO AUTOMÁTICA DE CENTAVOS
// =====================================

function normalizePrice(value) {

  if (value === null || value === undefined) {
    return 0;
  }

  // Já é número válido
  if (typeof value === 'number') {
    return Number(value.toFixed(2));
  }

  // String
  let cleanValue = String(value)
    .replace(/[R$\s]/g, '')
    .trim();

  // Ex: 1.299,90
  if (
    cleanValue.includes('.') &&
    cleanValue.includes(',')
  ) {

    cleanValue = cleanValue
      .replace(/\./g, '')
      .replace(',', '.');
  }

  // Ex: 299,90
  else if (cleanValue.includes(',')) {

    cleanValue = cleanValue
      .replace(',', '.');
  }

  const parsed =
    Number(cleanValue);

  if (isNaN(parsed)) {
    return 0;
  }

  return Number(
    parsed.toFixed(2)
  );
}

async function createCheckout({
  payload
}) {

  console.log(
    'CREATE CHECKOUT FOI CHAMADO'
  );

  console.log(
    'PAYLOAD RECEBIDO:',
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  const orderNumber =
    buildOrderNumber();

  const externalReference =
    buildExternalReference(
      orderNumber
    );

  const order =
    await createOrder({
      order: {

        order_number:
          orderNumber,

        external_reference:
          externalReference,

        status:
          'awaiting_payment',

        payment_status:
          'pending',

        payment_provider:
          'mercado_pago',

        currency:
          env.defaultCurrency ||
          'BRL',

        customer_name:
          payload.customer.name,

        customer_email:
          payload.customer.email,

        customer_phone:
          payload.customer.phone,

        customer_cpf:
          payload.customer.cpf ||
          null,

        accepts_marketing:
          payload.customer
            .acceptsMarketing,

        shipping_method:
          payload.shipping
            ?.label ||
          'Não informado',

        shipping_amount:
          normalizePrice(
            payload.shipping
              ?.price || 0
          ),

        shipping_deadline:
          payload.shipping
            ?.deadline || null,

        shipping_cep:
          payload.address.cep,

        shipping_street:
          payload.address.street,

        shipping_number:
          payload.address.number,

        shipping_complement:
          payload.address
            .complement || null,

        shipping_neighborhood:
          payload.address
            .neighborhood,

        shipping_city:
          payload.address.city,

        shipping_state:
          payload.address.state,

        notes:
          payload.notes || null,

        items_count:
          payload.items.reduce(
            (sum, item) =>
              sum +
              Number(
                item.quantity || 0
              ),
            0
          ),

        subtotal_amount:
          normalizePrice(
            payload.subtotal
          ),

        total_amount:
          normalizePrice(
            payload.total
          ),

        raw_checkout_payload:
          payload.rawPayload ||
          null
      }
    });

  try {

    // =========================
    // ITENS BANCO
    // =========================

    const itemsForDB =
      payload.items.map(
        (item) => {

          const unitPrice =
            normalizePrice(
              item.unit_price ??
              item.unitPrice ??
              item.price
            );

          const quantity =
            Number(
              item.quantity || 1
            );

          console.log(
            'ITEM DB:',
            {
              product:
                item.productName ||
                item.name,

              original:
                item.unit_price ??
                item.unitPrice ??
                item.price,

              normalized:
                unitPrice,

              quantity
            }
          );

          return {

            order_id:
              order.id,

            product_name:
              item.productName ||
              item.name ||
              'Produto',

            product_slug:
              item.slug || null,

            image_url:
              item.imageUrl ||
              item.image ||
              null,

            color:
              item.color || null,

            size:
              item.size || null,

            quantity,

            unit_price:
              unitPrice,

            line_total:
              Number(
                (
                  unitPrice *
                  quantity
                ).toFixed(2)
              ),

            metadata_json:
              item.raw || null
          };
        }
      );

    console.log(
      'ITENS BANCO:',
      JSON.stringify(
        itemsForDB,
        null,
        2
      )
    );

    await createOrderItems(
      itemsForDB
    );

    // =========================
    // ITENS MERCADO PAGO
    // =========================

    const preferenceItems =
      payload.items.map(
        (item) => {

          const unitPrice =
            normalizePrice(
              item.unit_price ??
              item.unitPrice ??
              item.price
            );

          const quantity =
            Number(
              item.quantity || 1
            );

          console.log(
            'ITEM MP:',
            {
              product:
                item.productName ||
                item.name,

              original:
                item.unit_price ??
                item.unitPrice ??
                item.price,

              normalized:
                unitPrice,

              quantity
            }
          );

          return {

            title:
              item.productName ||
              item.name ||
              'Produto',

            description:
              `${item.color || ''} | Tam ${
                item.size || ''
              }`.trim(),

            quantity,

            unit_price:
              unitPrice,

            currency_id:
              'BRL',

            picture_url:
              item.imageUrl ||
              item.image ||
              undefined
          };
        }
      );

    // =========================
    // FRETE
    // =========================

    const shippingPrice =
      normalizePrice(
        payload.shipping
          ?.price || 0
      );

    if (shippingPrice > 0) {

      preferenceItems.push({

        title:
          `Frete: ${
            payload.shipping
              ?.label || ''
          }`.trim(),

        quantity: 1,

        unit_price:
          shippingPrice,

        currency_id:
          'BRL'
      });
    }

    console.log(
      'PREFERENCE ITEMS:',
      JSON.stringify(
        preferenceItems,
        null,
        2
      )
    );

    console.log(
      'BODY MP:',
      JSON.stringify(
        {
          items:
            preferenceItems
        },
        null,
        2
      )
    );

    // =========================
    // MERCADO PAGO
    // =========================

    const mpResponse =
      await preferenceClient.create({
        body: {

          items:
            preferenceItems,

          external_reference:
            externalReference,

          statement_descriptor:
            env
              .statementDescriptor ||
            'RIO GROOVE',

          notification_url:
            `${env.backendUrl}/api/webhooks/mercadopago`,

          back_urls: {

            success:
              `${env.frontendUrl}/?payment=success&external_reference=${externalReference}`,

            pending:
              `${env.frontendUrl}/?payment=pending&external_reference=${externalReference}`,

            failure:
              `${env.frontendUrl}/?payment=failure&external_reference=${externalReference}`
          },

          auto_return:
            'approved',

          payer: {

            name:
              payload.customer
                .name,

            email:
              payload.customer
                .email,

            phone: {
              number:
                onlyDigits(
                  payload.customer
                    .phone
                )
            },

            identification:
              payload.customer.cpf
                ? {
                    type:
                      'CPF',

                    number:
                      onlyDigits(
                        payload
                          .customer
                          .cpf
                      )
                  }
                : undefined,

            address: {

              zip_code:
                onlyDigits(
                  payload
                    .address
                    .cep
                ),

              street_name:
                payload.address
                  .street,

              street_number:
                payload.address
                  .number,

              neighborhood:
                payload.address
                  .neighborhood,

              city:
                payload.address
                  .city,

              federal_unit:
                payload.address
                  .state
            }
          },

          metadata: {

            order_number:
              orderNumber,

            external_reference:
              externalReference
          }
        }
      });

    const preference =
      mpResponse?.body ||
      mpResponse;

    const checkoutUrl =
      preference?.init_point ||
      preference
        ?.sandbox_init_point ||
      null;

    if (!checkoutUrl) {

      throw new Error(
        'Mercado Pago não retornou checkout URL.'
      );
    }

    await updateOrderById(
      order.id,
      {

        mercado_pago_preference_id:
          preference.id,

        payment_init_point:
          preference
            .init_point || null,

        payment_sandbox_init_point:
          preference
            .sandbox_init_point ||
          null
      }
    );

    return {

      orderId:
        order.id,

      orderNumber,

      externalReference,

      preferenceId:
        preference.id,

      checkoutUrl,

      init_point:
        preference
          .init_point || null,

      sandbox_init_point:
        preference
          .sandbox_init_point ||
        null,

      publicKey:
        env
          .mercadoPagoPublicKey,

      totals: {

        subtotal:
          normalizePrice(
            payload.subtotal
          ),

        shipping:
          shippingPrice,

        total:
          normalizePrice(
            payload.total
          )
      }
    };

  } catch (error) {

    console.error(
      'ERRO CHECKOUT:',
      error
    );

    await deleteOrder(
      order.id
    );

    throw error;
  }
}

module.exports = {
  createCheckout
};
