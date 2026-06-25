/**
 * Registro de provedores server-side de analytics (GA4 hoje; Meta/TikTok no futuro).
 */

/** @type {import('./types').ServerAnalyticsProvider[]} */
const providers = [];

function registerProvider(provider) {
  if (!provider?.id || typeof provider.sendPurchase !== 'function') {
    throw new Error('ServerAnalyticsProvider inválido');
  }
  const existing = providers.find((p) => p.id === provider.id);
  if (existing) return existing;
  providers.push(provider);
  return provider;
}

function getProviders() {
  return [...providers];
}

function getProvider(id) {
  return providers.find((p) => p.id === id) || null;
}

module.exports = {
  registerProvider,
  getProviders,
  getProvider,
};
