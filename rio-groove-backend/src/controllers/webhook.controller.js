const asyncHandler = require('../utils/asyncHandler');
const { processMercadoPagoWebhook } = require('../services/payments.service');

const mercadoPagoWebhook = asyncHandler(async (req, res) => {
  const result = await processMercadoPagoWebhook(req);
  return res.status(200).json({ received: true, ...result });
});

module.exports = {
  mercadoPagoWebhook
};
