const crypto = require('crypto');
const env = require('../config/env');

function getSigningSecret() {
  if (env.oauthStateSecret) return env.oauthStateSecret;
  if (env.nodeEnv === 'production') {
    throw new Error('OAUTH_STATE_SECRET é obrigatório em produção.');
  }
  return env.supabaseServiceRoleKey || '';
}

function signOAuthState(payload) {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET não configurado.');
  }

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyOAuthState(state, maxAgeMs = 10 * 60 * 1000) {
  const secret = getSigningSecret();
  if (!secret || !state) {
    return { valid: false, reason: 'State ausente ou secret não configurado.' };
  }

  const [body, signature] = String(state).split('.');
  if (!body || !signature) {
    return { valid: false, reason: 'Formato de state inválido.' };
  }

  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'Assinatura de state inválida.' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'Payload de state inválido.' };
  }

  if (!payload.adminId || !payload.exp) {
    return { valid: false, reason: 'State incompleto.' };
  }

  if (Date.now() > Number(payload.exp)) {
    return { valid: false, reason: 'State expirado.' };
  }

  return { valid: true, payload };
}

function createMelhorEnvioOAuthState(adminId) {
  return signOAuthState({
    adminId,
    exp: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString('hex'),
  });
}

module.exports = {
  signOAuthState,
  verifyOAuthState,
  createMelhorEnvioOAuthState,
};
