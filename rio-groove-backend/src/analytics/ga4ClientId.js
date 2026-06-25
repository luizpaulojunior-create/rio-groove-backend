const CLIENT_ID_PATTERN = /^\d+\.\d+$/;

function normalizeGaClientId(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return CLIENT_ID_PATTERN.test(text) ? text : null;
}

function readGaClientIdFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  return normalizeGaClientId(
    metadata.ga_client_id
    ?? metadata.gaClientId
    ?? metadata.client_id,
  );
}

function resolveStoreOrderGaClientId(order, payment) {
  const fromPayment = readGaClientIdFromMetadata(payment?.metadata);
  if (fromPayment) return fromPayment;

  const raw = order?.raw_checkout_payload;
  return readGaClientIdFromMetadata(raw?.metadata) ?? readGaClientIdFromMetadata(raw);
}

function resolveCustomOrderGaClientId(order, payment) {
  const fromPayment = readGaClientIdFromMetadata(payment?.metadata);
  if (fromPayment) return fromPayment;

  return readGaClientIdFromMetadata(order?.analytics_metadata);
}

function resolveGaClientId({ order, payment, kind }) {
  if (kind === 'custom') {
    return resolveCustomOrderGaClientId(order, payment);
  }
  return resolveStoreOrderGaClientId(order, payment);
}

module.exports = {
  normalizeGaClientId,
  resolveGaClientId,
  resolveStoreOrderGaClientId,
  resolveCustomOrderGaClientId,
};
