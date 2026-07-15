const supabase = require('../lib/supabase');
const env = require('../config/env');

/** Render usa /health — deve responder 200 sempre que o processo estiver no ar. */
function livenessCheck(_req, res) {
  return res.status(200).json({
    ok: true,
    service: 'Rio Groove Store Backend',
    timestamp: new Date().toISOString(),
  });
}

async function readinessCheck(req, res) {
  const detailed = req.query.detailed === '1' && env.nodeEnv !== 'production';
  let ok = true;
  const checks = {};

  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    checks.supabase = error ? 'fail' : 'ok';
    if (error) ok = false;
  } catch {
    checks.supabase = 'fail';
    ok = false;
  }

  checks.mercadoPago = env.mercadoPagoAccessToken ? 'configured' : 'missing';
  if (!env.mercadoPagoAccessToken) ok = false;

  checks.mercadoPagoWebhook = env.mercadoPagoWebhookSecret ? 'configured' : 'missing';
  checks.melhorEnvioWebhook = env.melhorEnvioClientSecret ? 'configured' : 'missing';
  if (env.nodeEnv === 'production') {
    if (!env.mercadoPagoWebhookSecret || !env.melhorEnvioClientSecret) ok = false;
  }

  const body = {
    ok,
    service: 'Rio Groove Store Backend',
    timestamp: new Date().toISOString(),
  };

  if (detailed) {
    body.checks = { ...checks, environment: env.nodeEnv };
  }

  return res.status(ok ? 200 : 503).json(body);
}

async function healthCheck(req, res) {
  if (req.path === '/health') {
    return livenessCheck(req, res);
  }
  return readinessCheck(req, res);
}

module.exports = {
  healthCheck,
  livenessCheck,
  readinessCheck,
};
