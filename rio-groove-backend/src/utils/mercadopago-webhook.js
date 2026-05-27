const crypto = require('crypto');
const env = require('../config/env');

/**
 * Verifica x-signature do Mercado Pago quando MERCADO_PAGO_WEBHOOK_SECRET está configurado.
 * Se o secret não existir, retorna true (compatibilidade — configure o secret em produção).
 */
function verifyMercadoPagoWebhookSignature(req) {
  const secret = env.mercadoPagoWebhookSecret;
  if (!secret) {
    if (env.nodeEnv === 'production') {
      return { valid: false, reason: 'MERCADO_PAGO_WEBHOOK_SECRET não configurado.' };
    }
    return { valid: true, skipped: true };
  }

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  if (!xSignature) {
    return { valid: false, reason: 'Cabeçalho x-signature ausente.' };
  }

  const parts = String(xSignature).split(',');
  let ts = '';
  let hash = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key?.trim() === 'ts') ts = value?.trim() || '';
    if (key?.trim() === 'v1') hash = value?.trim() || '';
  }

  if (!ts || !hash) {
    return { valid: false, reason: 'Formato x-signature inválido.' };
  }

  const dataId =
    req.query?.['data.id'] ||
    req.body?.data?.id ||
    req.body?.id ||
    '';

  const manifestParts = [`id:${dataId}`];
  if (xRequestId) manifestParts.push(`request-id:${xRequestId}`);
  manifestParts.push(`ts:${ts}`);
  const manifest = `${manifestParts.join(';')};`;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const valid = hash.length === expected.length && crypto.timingSafeEqual(
    Buffer.from(hash, 'utf8'),
    Buffer.from(expected, 'utf8')
  );

  return { valid, skipped: false, reason: valid ? null : 'Assinatura inválida.' };
}

module.exports = {
  verifyMercadoPagoWebhookSignature,
};
