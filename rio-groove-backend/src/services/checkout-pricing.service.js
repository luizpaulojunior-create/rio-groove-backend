const supabase = require('../lib/supabase');
const { roundMoney } = require('../utils/money');

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

/**
 * Substitui preços do cliente pelos preços do banco (anti-tampering).
 * Se slug não existir, mantém preço do cliente e registra aviso (compatibilidade).
 */
async function applyServerSidePricing(payload) {
  const slugs = payload.items.map((item) => item.slug).filter(Boolean);
  const productsBySlug = await fetchProductsBySlugs(slugs);

  const items = payload.items.map((item) => {
    const product = item.slug ? productsBySlug.get(item.slug) : null;

    if (!product) {
      if (item.slug) {
        console.warn('[CheckoutPricing] Produto não encontrado para slug:', item.slug);
      }
      return {
        ...item,
        unitPrice: item.unitPrice,
        lineTotal: roundMoney(item.unitPrice * item.quantity),
        productName: item.productName,
      };
    }

    const unitPrice = resolveItemUnitPrice(product, item);
    return {
      ...item,
      productName: product.name || item.productName,
      unitPrice,
      lineTotal: roundMoney(unitPrice * item.quantity),
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const shippingPrice = roundMoney(payload.shipping?.price || 0);
  const total = roundMoney(subtotal + shippingPrice);

  return {
    ...payload,
    items,
    subtotal,
    total,
  };
}

module.exports = {
  applyServerSidePricing,
};
