const env = require('../config/env');
const { buildAllowedOrigins, isOriginAllowed } = require('./cors-origin');

function normalizeOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    if (url.protocol !== 'https:') return null;
    return url.origin.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function resolveReturnOrigin(clientOrigin) {
  const fallback = normalizeOrigin(env.frontendUrl) || '';
  const origin = normalizeOrigin(clientOrigin);
  if (!origin) return fallback;

  const allowedOrigins = buildAllowedOrigins(process.env);
  if (isOriginAllowed(origin, allowedOrigins)) {
    return origin;
  }

  return fallback;
}

function buildMercadoPagoBackUrls(returnBase, externalReference) {
  const base = String(returnBase || env.frontendUrl).replace(/\/$/, '');
  const ref = encodeURIComponent(externalReference);
  return {
    success: `${base}/success?payment=approved&external_reference=${ref}`,
    pending: `${base}/success?payment=pending&external_reference=${ref}`,
    failure: `${base}/success?payment=failure&external_reference=${ref}`,
  };
}

function getMercadoPagoNotificationUrl() {
  return `${env.backendUrl}/api/webhooks/mercadopago`;
}

module.exports = {
  resolveReturnOrigin,
  buildMercadoPagoBackUrls,
  getMercadoPagoNotificationUrl,
};
