const asyncHandler = require('../utils/asyncHandler');
const { validateAndApplyCoupon, normalizeCouponCode } = require('../services/coupons.service');

const validateCoupon = asyncHandler(async (req, res) => {
  const code = normalizeCouponCode(req.body?.code);
  const cartSubtotal = Number(req.body?.cartSubtotal ?? req.body?.subtotal ?? 0);
  const shippingPrice = Number(req.body?.shippingPrice ?? 0);

  if (!code) {
    return res.status(400).json({ valid: false, error: 'Informe o código do cupom.' });
  }

  try {
    const result = await validateAndApplyCoupon(code, cartSubtotal, shippingPrice);
    const { coupon } = result;

    return res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        min_purchase_amount: coupon.min_purchase_amount
          ? Number(coupon.min_purchase_amount)
          : undefined,
        max_discount_amount: coupon.max_discount_amount
          ? Number(coupon.max_discount_amount)
          : undefined,
        is_active: true,
      },
      discountAmount: result.discountAmount,
      freeShipping: result.freeShipping,
      shippingPrice: result.shippingPrice,
    });
  } catch (error) {
    return res.status(400).json({
      valid: false,
      error: error.message || 'Cupom inválido.',
    });
  }
});

module.exports = {
  validateCoupon,
};
