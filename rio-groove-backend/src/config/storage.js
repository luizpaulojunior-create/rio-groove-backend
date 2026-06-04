/**
 * Bucket oficial para novos uploads.
 * Legado: imagens antigas podem estar no bucket `products/` — preservar URLs existentes.
 */
const STORAGE_BUCKET = 'product-images';

const STORAGE_PATHS = {
  HERO: 'storefront/hero',
  HEADER: 'storefront/header',
  NAVIGATION: 'storefront/navigation',
  BRANDING: 'storefront/branding',
  BANNERS: 'storefront/banners',
  EDITORIAL: 'storefront/editorial',
  ARTISTS: 'storefront/artists',
  CAMPAIGNS: 'campaigns',
  COLLECTIONS: 'collections',
  PRODUCTS: 'products',
  CUSTOM_ORDERS: 'custom-orders',
};

module.exports = {
  STORAGE_BUCKET,
  STORAGE_PATHS
};
