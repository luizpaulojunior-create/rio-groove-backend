const crypto = require('crypto');
const env = require('../config/env');

function verifyMelhorEnvioWebhookSignature(req) {
  const secret = env.melhorEnvioClientSecret;
  if (!secret) {
    if (env.nodeEnv === 'production') {
      return { valid: false, reason: 'MELHOR_ENVIO_CLIENT_SECRET não configurado.' };
    }
    return { valid: true, skipped: true };
  }

  const signature = req.headers['x-me-signature'];
  if (!signature) {
    return { valid: false, reason: 'Cabeçalho x-me-signature ausente.' };
  }

  const rawBody = Buffer.isBuffer(req.rawBody)
    ? req.rawBody
    : req.rawBody
      ? Buffer.from(String(req.rawBody))
      : Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

  const provided = String(signature).trim();
  const valid =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  return valid
    ? { valid: true }
    : { valid: false, reason: 'Assinatura x-me-signature inválida.' };
}

module.exports = {
  verifyMelhorEnvioWebhookSignature,
};
