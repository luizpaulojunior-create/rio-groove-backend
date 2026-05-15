function normalizeString(value = '') {
  return String(value || '').trim();
}

function onlyDigits(value = '') {
  return String(value || '').replace(/\D+/g, '');
}

function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function buildOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `RG-${new Date().getFullYear()}-${stamp}`;
}

function buildExternalReference(orderNumber) {
  return `${orderNumber}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function mapMercadoPagoPaymentStatus(status = '') {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'approved') {
    return { paymentStatus: 'paid', orderStatus: 'paid' };
  }

  if (['pending', 'in_process', 'in_mediation'].includes(normalized)) {
    return { paymentStatus: 'pending', orderStatus: 'awaiting_payment' };
  }

  if (['authorized'].includes(normalized)) {
    return { paymentStatus: 'authorized', orderStatus: 'awaiting_capture' };
  }

  if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(normalized)) {
    return { paymentStatus: 'failed', orderStatus: 'payment_failed' };
  }

  return { paymentStatus: normalized || 'pending', orderStatus: 'awaiting_payment' };
}

module.exports = {
  normalizeString,
  onlyDigits,
  isValidEmail,
  buildOrderNumber,
  buildExternalReference,
  mapMercadoPagoPaymentStatus
};
