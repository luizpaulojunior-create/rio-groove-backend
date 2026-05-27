const supabase = require('../lib/supabase');
const { roundMoney } = require('../utils/money');

function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase();
}

function calculateDiscount(coupon, cartSubtotal) {
  let discountAmount = 0;
  let freeShipping = false;

  switch (coupon.discount_type) {
    case 'percentage': {
      discountAmount = cartSubtotal * (Number(coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
        discountAmount = Number(coupon.max_discount_amount);
      }
      break;
    }
    case 'fixed': {
      discountAmount = Number(coupon.discount_value);
      if (discountAmount > cartSubtotal) discountAmount = cartSubtotal;
      break;
    }
    case 'free_shipping':
      freeShipping = true;
      discountAmount = 0;
      break;
    default:
      break;
  }

  return {
    discountAmount: roundMoney(discountAmount),
    freeShipping,
  };
}

async function fetchCouponByCode(code) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function assertCouponValid(coupon, cartSubtotal) {
  if (!coupon) {
    throw new Error('Cupom inválido ou expirado.');
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error('Este cupom expirou.');
  }

  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    throw new Error('Este cupom ainda não é válido.');
  }

  if (coupon.usage_limit && Number(coupon.usage_count) >= Number(coupon.usage_limit)) {
    throw new Error('Este cupom atingiu o limite de uso.');
  }

  if (coupon.min_purchase_amount && cartSubtotal < Number(coupon.min_purchase_amount)) {
    throw new Error(
      `Valor mínimo para este cupom é R$ ${Number(coupon.min_purchase_amount).toFixed(2)}.`
    );
  }
}

async function validateAndApplyCoupon(code, cartSubtotal, shippingPrice = 0) {
  const coupon = await fetchCouponByCode(code);
  assertCouponValid(coupon, cartSubtotal);

  const { discountAmount, freeShipping } = calculateDiscount(coupon, cartSubtotal);
  const adjustedShipping = freeShipping ? 0 : roundMoney(shippingPrice);

  return {
    coupon,
    couponCode: coupon.code,
    couponId: coupon.id,
    discountAmount,
    freeShipping,
    shippingPrice: adjustedShipping,
  };
}

async function incrementCouponUsage(couponId, couponCode) {
  if (!couponId && !couponCode) return null;

  let query = supabase.from('coupons').select('id, usage_count').limit(1);
  if (couponId) {
    query = query.eq('id', couponId);
  } else {
    query = query.eq('code', normalizeCouponCode(couponCode));
  }

  const { data: coupon, error: fetchError } = await query.maybeSingle();
  if (fetchError) throw fetchError;
  if (!coupon) return null;

  const { data, error } = await supabase
    .from('coupons')
    .update({ usage_count: Number(coupon.usage_count || 0) + 1 })
    .eq('id', coupon.id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  validateAndApplyCoupon,
  incrementCouponUsage,
  normalizeCouponCode,
  calculateDiscount,
};
