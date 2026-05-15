const asyncHandler = require('../utils/asyncHandler');
const { validateCheckoutPayload } = require('../utils/validation');
const { createCheckout } = require('../services/checkout.service');

const checkout = asyncHandler(async (req, res) => {
  const validation = validateCheckoutPayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Payload de checkout inválido.',
      errors: validation.errors
    });
  }

  const result = await createCheckout({ payload: validation.data });

  return res.status(201).json({
    message: 'Checkout criado com sucesso.',
    ...result
  });
});

module.exports = {
  checkout
};
