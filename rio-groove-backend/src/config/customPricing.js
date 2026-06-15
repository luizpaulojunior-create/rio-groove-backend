/** Preços fixos — personalizados (arte exclusiva + peça DTF). */

const READY_ART_DISCOUNT = 20;

const EXCLUSIVE_ART_FEE = {
  Camisa: 79.9,
  Cropped: 79.9,
  Regata: 79.9,
  Caneca: 49.9,
  Boné: 39.9,
};

const PRINTED_PRODUCT_PRICE = {
  Camisa: 99.9,
  Cropped: 39.9,
  Regata: 39.9,
  Boné: 29.9,
  Caneca: 29.9,
};

const APPAREL_INSUMOS = new Set(['Camisa', 'Cropped', 'Regata']);

function resolvePricingInsumo(body) {
  if (body.insumo === 'Camisa' && String(body.segmento || '').toLowerCase() === 'cropped') {
    return 'Cropped';
  }
  return body.insumo;
}

function getExclusiveArtFee(insumo) {
  return EXCLUSIVE_ART_FEE[insumo] ?? null;
}

function getPrintedProductUnitPrice(insumo) {
  return PRINTED_PRODUCT_PRICE[insumo] ?? null;
}

function getExclusiveArtPackageTotal(insumo) {
  const artFee = getExclusiveArtFee(insumo);
  const productUnit = getPrintedProductUnitPrice(insumo);
  if (artFee == null || productUnit == null) return null;
  return Math.round((artFee + productUnit) * 100) / 100;
}

function getReadyArtProductUnitPrice(insumo) {
  const exclusiveTotal = getExclusiveArtPackageTotal(insumo);
  if (exclusiveTotal == null) return null;
  return Math.round((exclusiveTotal - READY_ART_DISCOUNT) * 100) / 100;
}

function computeOrderPricing(body) {
  const insumo = resolvePricingInsumo(body);
  const productUnit = getPrintedProductUnitPrice(insumo);
  const quantity = Math.max(1, Number(body.quantity) || 1);

  if (productUnit == null) {
    return { insumo, productUnit: null, artFee: null, quantity };
  }

  if (body.order_type === 'ready_art') {
    const readyProductUnit = getReadyArtProductUnitPrice(insumo);
    if (readyProductUnit == null) {
      return { insumo, productUnit: null, artFee: null, quantity };
    }
    return {
      insumo,
      productUnit: readyProductUnit,
      artFee: 0,
      artPaymentStatus: 'not_required',
      quantity,
    };
  }

  const artFee = getExclusiveArtFee(insumo);
  if (artFee == null) {
    return { insumo, productUnit, artFee: null, quantity };
  }

  return {
    insumo,
    productUnit,
    artFee,
    artPaymentStatus: 'pending',
    quantity,
  };
}

function getProductPaymentTotal(order) {
  const qty = Math.max(1, Number(order.quantity) || 1);
  const unit = Number(order.product_unit_amount) || 0;
  const shipping = Number(order.shipping_amount) || 0;
  return Math.round((unit * qty + shipping) * 100) / 100;
}

module.exports = {
  READY_ART_DISCOUNT,
  EXCLUSIVE_ART_FEE,
  PRINTED_PRODUCT_PRICE,
  APPAREL_INSUMOS,
  resolvePricingInsumo,
  getExclusiveArtFee,
  getPrintedProductUnitPrice,
  getExclusiveArtPackageTotal,
  getReadyArtProductUnitPrice,
  computeOrderPricing,
  getProductPaymentTotal,
};
