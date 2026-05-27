const asyncHandler = require('../utils/asyncHandler');
const { validateCheckoutPayload } = require('../utils/validation');
const { createCheckout } = require('../services/checkout.service');
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

module.exports = {
  checkout
};
