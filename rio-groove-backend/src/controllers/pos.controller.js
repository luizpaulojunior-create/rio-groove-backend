const asyncHandler = require('../utils/asyncHandler');
const { validatePosSalePayload } = require('../utils/validation');
const { createFairSale } = require('../services/pos.service');

const createPosSale = asyncHandler(async (req, res) => {
  const validation = validatePosSalePayload(req.body || {});

  if (!validation.valid) {
    return res.status(400).json({
      message: 'Payload de venda feira inválido.',
      errors: validation.errors,
    });
  }

  try {
    const result = await createFairSale({
      payload: validation.data,
      adminEmail: req.admin?.email || req.user?.email || null,
    });

    return res.status(201).json({
      message: 'Venda feira registrada e estoque baixado.',
      orderNumber: result.orderNumber,
      externalReference: result.externalReference,
      paymentMethod: result.paymentMethod,
      paymentLabel: result.paymentLabel,
      lines: result.lines,
      order: result.order,
    });
  } catch (error) {
    const message = error.message || 'Erro ao registrar venda feira.';
    const status = /estoque|indispon/i.test(message) ? 409 : 400;
    return res.status(status).json({ message });
  }
});

module.exports = {
  createPosSale,
};
