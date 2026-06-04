const supabase = require('../lib/supabase');
const { roundMoney } = require('../utils/money');
const { onlyDigits } = require('../utils/order');
const { getShippingQuote } = require('./shipping.service');
const { validateAndApplyCoupon, normalizeCouponCode } = require('./coupons.service');

const FREE_SHIPPING_THRESHOLD = 799.9;
const PICKUP_ID = 'pickup-rio';
const RIO_PICKUP_CEP_PATTERN = /^2[0-8]\d{6}$/;

function isRioPickupCep(cep) {
  return RIO_PICKUP_CEP_PATTERN.test(onlyDigits(cep || ''));
}

function defaultPackageFromItems(items = []) {
  if (!items.length) {
    return { weight: 0.35, height: 5, width: 30, length: 25 };
  }

  let totalWeight = 0;
  let maxHeight = 0;
  let maxWidth = 0;
  let maxLength = 0;
  let totalQty = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 1;
    const raw = item.raw || {};
    totalWeight += (Number(raw.weight) || 0.35) * qty;
    maxHeight = Math.max(maxHeight, Number(raw.height) || 5);
    maxWidth = Math.max(maxWidth, Number(raw.width) || 30);
    maxLength = Math.max(maxLength, Number(raw.length) || 25);
    totalQty += qty;
  }

  if (totalQty > 3) {
    maxWidth = Math.max(maxWidth, 40);
    maxLength = Math.max(maxLength, 35);
  }

  return {
    weight: Math.max(totalWeight, 0.35),
    height: Math.max(maxHeight, 3),
    width: Math.max(maxWidth, 20),
    length: Math.max(maxLength, 20),
  };
}

function isPickupShipping(shipping = {}) {
  const id = String(shipping.id || '');
  const label = String(shipping.label || '').toLowerCase();
  return id === PICKUP_ID || label.includes('retirada');
}

function isMelhorEnvioServiceId(id) {
  const head = String(id || '').split('-')[0];
  return /^\d+$/.test(head);
}

async function resolveServerSideShipping(payload, subtotal) {
  const shipping = payload.shipping || {};
  const id = String(shipping.id || '').trim();
  const clientPrice = roundMoney(shipping.price);

  if (!id) {
    throw new Error('Selecione uma opção de frete.');
  }

  if (isPickupShipping(shipping)) {
    const cep = onlyDigits(payload.address?.cep || payload.rawPayload?.address?.cep || '');
    if (!isRioPickupCep(cep)) {
      throw new Error('Retirada presencial disponível apenas para CEPs do Rio de Janeiro (20–28).');
    }
    const acknowledged =
      payload.metadata?.pickup_acknowledged === true ||
      payload.rawPayload?.metadata?.pickup_acknowledged === true;
    if (!acknowledged) {
      throw new Error('Confirme os termos da retirada presencial para continuar.');
    }
    return {
      id,
      label: shipping.label || 'Retirada presencial',
      price: 0,
      deadline: shipping.deadline || '',
      provider: shipping.provider || 'Retirada Local',
    };
  }

  const cep = onlyDigits(payload.address?.cep || payload.rawPayload?.address?.cep || '');
  if (cep.length !== 8) {
    throw new Error('CEP inválido para cotação de frete.');
  }

  const pkg = payload.package || defaultPackageFromItems(payload.items);
  const options = await getShippingQuote({ cep, ...pkg });
  const match = options.find((option) => String(option.id) === id);

  if (!match) {
    throw new Error('Opção de frete inválida ou indisponível.');
  }

  let price = roundMoney(match.price);

  if (subtotal >= FREE_SHIPPING_THRESHOLD && clientPrice === 0) {
    price = 0;
  } else if (Math.abs(price - clientPrice) > 0.02) {
    console.warn('[CheckoutPricing] Frete ajustado no servidor:', clientPrice, '->', price);
  }

  return {
    id: match.id,
    label: shipping.label || match.label,
    price,
    deadline: shipping.deadline || match.delivery_time || '',
    provider: match.company || shipping.provider || 'Melhor Envio',
    service_code: match.service_code || '',
  };
}

async function fetchProductsBySlugs(slugs) {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, price, active, product_variants(sku, price_override, status)')
    .in('slug', unique)
    .eq('active', true);

  if (error) throw error;

  const map = new Map();
  for (const product of data || []) {
    map.set(product.slug, product);
  }
  return map;
}

function resolveItemUnitPrice(product, item) {
  const basePrice = Number(product.price) || 0;
  if (basePrice <= 0) return 0;

  const sku = String(item.sku || item.raw?.sku || '').trim();
  if (sku && Array.isArray(product.product_variants)) {
    const variant = product.product_variants.find(
      (v) => v.sku === sku && (v.status || 'active') === 'active'
    );
    const override = Number(variant?.price_override);
    if (variant && override > 0) return override;
  }

  return basePrice;
}

function distributeDiscountAcrossItems(items, discountAmount) {
  if (!discountAmount || discountAmount <= 0) return items;

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal <= 0) return items;

  const discount = Math.min(discountAmount, subtotal);
  let allocated = 0;

  return items.map((item, index) => {
    let lineDiscount;
    if (index === items.length - 1) {
      lineDiscount = roundMoney(discount - allocated);
    } else {
      lineDiscount = roundMoney((item.lineTotal / subtotal) * discount);
      allocated += lineDiscount;
    }

    const newLineTotal = roundMoney(Math.max(item.lineTotal - lineDiscount, 0));
    const newUnitPrice = roundMoney(newLineTotal / item.quantity);

    return {
      ...item,
      unitPrice: newUnitPrice,
      lineTotal: newLineTotal,
    };
  });
}

/**
 * Substitui preços do cliente pelos preços do banco e valida frete Melhor Envio.
 */
async function applyServerSidePricing(payload) {
  const slugs = payload.items.map((item) => item.slug).filter(Boolean);
  const productsBySlug = await fetchProductsBySlugs(slugs);

  const items = payload.items.map((item) => {
    if (!item.slug) {
      throw new Error('Item do carrinho sem identificador de produto.');
    }

    const product = productsBySlug.get(item.slug);

    if (!product) {
      const slug = item.slug || item.raw?.slug || 'desconhecido';
      throw new Error(`Produto inválido ou indisponível: ${slug}`);
    }

    const unitPrice = resolveItemUnitPrice(product, item);
    if (unitPrice <= 0) {
      throw new Error(`Preço inválido para o produto: ${product.slug}`);
    }

    return {
      ...item,
      productName: product.name || item.productName,
      unitPrice,
      lineTotal: roundMoney(unitPrice * item.quantity),
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const shipping = await resolveServerSideShipping(payload, subtotal);
  let shippingPrice = roundMoney(shipping.price);

  const couponCode =
    normalizeCouponCode(payload.metadata?.coupon_code || payload.rawPayload?.metadata?.coupon_code);

  let discountAmount = 0;
  let couponApplied = null;

  if (couponCode) {
    const couponResult = await validateAndApplyCoupon(couponCode, subtotal, shippingPrice);
    discountAmount = couponResult.discountAmount;
    shippingPrice = couponResult.shippingPrice;
    couponApplied = {
      id: couponResult.couponId,
      code: couponResult.couponCode,
      discountAmount,
      freeShipping: couponResult.freeShipping,
    };

    if (couponResult.freeShipping) {
      shipping.price = 0;
    }
  }

  const pricedItems = distributeDiscountAcrossItems(items, discountAmount);
  const pricedSubtotal = roundMoney(pricedItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const total = roundMoney(pricedSubtotal + shippingPrice);

  return {
    ...payload,
    items: pricedItems,
    shipping: {
      ...shipping,
      price: shippingPrice,
    },
    subtotal: pricedSubtotal,
    discountAmount,
    couponApplied,
    total,
  };
}

module.exports = {
  applyServerSidePricing,
  isMelhorEnvioServiceId,
  distributeDiscountAcrossItems,
};
