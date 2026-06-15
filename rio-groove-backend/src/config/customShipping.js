/** Dimensões de pacote para cotação Melhor Envio — personalizados. */

const { resolvePricingInsumo } = require('./customPricing');

const BASE = {
  apparel: { weight: 0.35, width: 30, height: 5, length: 25 },
  bone: { weight: 0.15, width: 20, height: 10, length: 20 },
  caneca: { weight: 0.45, width: 15, height: 12, length: 15 },
  acessorio: { weight: 0.25, width: 25, height: 8, length: 20 },
};

function basePackageForInsumo(insumo) {
  if (insumo === 'Boné') return BASE.bone;
  if (insumo === 'Caneca') return BASE.caneca;
  if (insumo === 'Acessório') return BASE.acessorio;
  return BASE.apparel;
}

function getCustomOrderPackage(order) {
  const insumo = resolvePricingInsumo({
    insumo: order?.insumo,
    segmento: order?.segmento,
  });
  const qty = Math.max(1, Number(order?.quantity) || 1);
  const base = basePackageForInsumo(insumo);

  let width = base.width;
  let length = base.length;
  if (qty > 3 && ['Camisa', 'Cropped', 'Regata'].includes(insumo)) {
    width = Math.max(width, 40);
    length = Math.max(length, 35);
  }

  return {
    weight: Math.max(base.weight * qty, base.weight),
    width,
    height: Math.max(base.height, 3),
    length,
  };
}

module.exports = {
  getCustomOrderPackage,
};
