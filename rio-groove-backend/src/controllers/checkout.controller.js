const asyncHandler = require('../utils/asyncHandler');
const { validateCheckoutPayload } = require('../utils/validation');
const { createCheckout } = require('../services/checkout.service');
const { payCheckoutWithBrick, abandonUnpaidCheckout } = require('../services/brickPayment.service');
const { applyServerSidePricing } = require('../services/checkout-pricing.service');

const checkout = asyncHandler(async (req, res) => {
  const validation = validateCheckoutPayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Payload de checkout inválido.',
      errors: validation.errors
    });
  }

  try {
    const pricedPayload = await applyServerSidePricing(validation.data);
    const result = await createCheckout({ payload: pricedPayload });

    return res.status(201).json({
      message: 'Checkout criado com sucesso.',
      ...result
    });
  } catch (error) {
    const message = error?.message || 'Falha ao criar checkout.';
    const isBusinessError =
      /estoque|cupom|frete|retirada|CEP/i.test(message);

    return res.status(isBusinessError ? 400 : 500).json({
      message,
    });
  }
});

const pay = asyncHandler(async (req, res) => {
  try {
    const result = await payCheckoutWithBrick({
      orderId: req.body?.orderId || req.body?.order_id,
      formData: req.body?.formData || {},
      idempotencyKey: req.body?.idempotencyKey,
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || 'Falha ao processar o pagamento.',
    });
  }
});

const abandon = asyncHandler(async (req, res) => {
  try {
    const result = await abandonUnpaidCheckout({
      orderId: req.body?.orderId || req.body?.order_id,
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || 'Falha ao cancelar o checkout.',
    });
  }
});

module.exports = {
  checkout,
  pay,
  abandon,
};
