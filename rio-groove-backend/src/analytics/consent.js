/**
 * Resolve consentimento de analytics para envio server-side (LGPD).
 * Só envia ao GA4 quando consentimento foi explicitamente concedido.
 */

function normalizeConsentValue(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  const text = String(value || '').trim().toLowerCase();
  if (text === 'granted' || text === 'true' || text === '1' || text === 'yes') return true;
  if (text === 'denied' || text === 'false' || text === '0' || text === 'no') return false;
  return null;
}

function readFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  return normalizeConsentValue(
    metadata.analytics_consent
    ?? metadata.analyticsConsent
    ?? metadata.analytics_storage,
  );
}

function resolveStoreOrderConsent(order, payment) {
  const fromPayment = readFromMetadata(payment?.metadata);
  if (fromPayment !== null) return fromPayment;

  const raw = order?.raw_checkout_payload;
  const fromRaw = readFromMetadata(raw?.metadata) ?? readFromMetadata(raw);
  if (fromRaw !== null) return fromRaw;

  return normalizeConsentValue(order?.analytics_consent_granted);
}

function resolveCustomOrderConsent(order, payment) {
  const fromPayment = readFromMetadata(payment?.metadata);
  if (fromPayment !== null) return fromPayment;

  return normalizeConsentValue(order?.analytics_consent_granted);
}

function resolvePurchaseConsent({ order, payment, kind }) {
  if (kind === 'custom') {
    return resolveCustomOrderConsent(order, payment);
  }
  return resolveStoreOrderConsent(order, payment);
}

module.exports = {
  normalizeConsentValue,
  resolvePurchaseConsent,
  resolveStoreOrderConsent,
  resolveCustomOrderConsent,
};
