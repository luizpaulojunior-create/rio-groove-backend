const asyncHandler = require('../utils/asyncHandler');
const { validateShippingQuotePayload } = require('../utils/validation');
const { getShippingQuote } = require('../services/shipping.service');

const shippingQuote = asyncHandler(async (req, res) => {
  console.log('[ShippingController] Cotação de frete requisitada', req.body);

  const validation = validateShippingQuotePayload(req.body || {});

  if (!validation.valid) {
    console.warn('[ShippingController] Payload inválido', validation.errors);
    return res.status(400).json({
      message: 'Payload de cotação de frete inválido.',
      errors: validation.errors
    });
  }

  const shippingOptions = await getShippingQuote(validation.data);

  return res.status(200).json(shippingOptions);
});

module.exports = {
  shippingQuote
};
