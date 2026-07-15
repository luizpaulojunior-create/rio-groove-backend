const { normalizeTagsField } = require('./normalizeTags');

/** Acréscimo do tamanho XGG (legado G1) em camisas Oversized masculinas (BRL). */
const MASCULINO_OVERSIZED_XGG_SURCHARGE_BRL = 15;
const MASCULINO_OVERSIZED_G1_SURCHARGE_BRL = MASCULINO_OVERSIZED_XGG_SURCHARGE_BRL;
const MASCULINO_OVERSIZED_MODEL = 'Oversized Tradicional';
const LARGE_SIZE_ALIASES = new Set(['XGG', 'G1', 'XG']);

function getTagValue(tags, prefix) {
  for (const tag of normalizeTagsField(tags)) {
    if (tag.startsWith(prefix)) {
      return tag.slice(prefix.length).trim();
    }
  }
  return null;
}

function isMasculinoOversizedTradicionalProduct(product) {
  const gender = getTagValue(product?.tags, 'genero:');
  const model = getTagValue(product?.tags, 'model:');
  const insumo = getTagValue(product?.tags, 'insumo:') || 'Camisa';
  return (
    gender === 'Masculino' &&
    (insumo === 'Camisa' || insumo === 'Camiseta') &&
    model === MASCULINO_OVERSIZED_MODEL
  );
}

function isLargeApparelSize(size) {
  return LARGE_SIZE_ALIASES.has(String(size || '').trim().toUpperCase());
}

function getG1SizeSurcharge(product, size) {
  if (!isLargeApparelSize(size)) return 0;
  if (!isMasculinoOversizedTradicionalProduct(product)) return 0;
  return MASCULINO_OVERSIZED_XGG_SURCHARGE_BRL;
}

module.exports = {
  MASCULINO_OVERSIZED_XGG_SURCHARGE_BRL,
  MASCULINO_OVERSIZED_G1_SURCHARGE_BRL,
  isMasculinoOversizedTradicionalProduct,
  getG1SizeSurcharge,
};
