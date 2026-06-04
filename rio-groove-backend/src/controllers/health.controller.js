const supabase = require('../lib/supabase');
const env = require('../config/env');

async function healthCheck(req, res) {
  const detailed = req.query.detailed === '1' && env.nodeEnv !== 'production';
  let ok = true;

  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) ok = false;
  } catch {
    ok = false;
  }

  if (!env.mercadoPagoAccessToken) {
    ok = false;
  }

  const body = {
    ok,
    service: 'Rio Groove Store Backend',
    timestamp: new Date().toISOString(),
  };

  if (detailed) {
    body.checks = {
      supabase: ok ? 'ok' : 'fail',
      mercadoPago: env.mercadoPagoAccessToken ? 'configured' : 'missing',
      environment: env.nodeEnv,
    };
  }

  return res.status(ok ? 200 : 503).json(body);
}

module.exports = {
  healthCheck,
};
