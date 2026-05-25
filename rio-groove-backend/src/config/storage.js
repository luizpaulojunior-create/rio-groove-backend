/**
 * Bucket oficial para novos uploads.
 * Legado: imagens antigas podem estar no bucket `products/` — preservar URLs existentes.
 */
const STORAGE_BUCKET = 'product-images';

const STORAGE_PATHS = {
  HERO: 'storefront/hero',
  BANNERS: 'storefront/banners',
  EDITORIAL: 'storefront/editorial',
  CAMPAIGNS: 'campaigns',
  COLLECTIONS: 'collections',
  PRODUCTS: 'products'
};

module.exports = {
  STORAGE_BUCKET,
  STORAGE_PATHS
};
