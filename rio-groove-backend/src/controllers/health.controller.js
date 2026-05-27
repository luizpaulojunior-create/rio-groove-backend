const supabase = require('../lib/supabase');
const env = require('../config/env');

async function healthCheck(req, res) {
  const checks = {
    supabase: 'unknown',
    mercadoPago: env.mercadoPagoAccessToken ? 'configured' : 'missing',
  };
  let ok = true;

  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      checks.supabase = 'fail';
      checks.supabaseError = error.message;
      ok = false;
    } else {
      checks.supabase = 'ok';
    }
  } catch (error) {
    checks.supabase = 'fail';
    checks.supabaseError = error.message;
    ok = false;
  }

  if (!env.mercadoPagoAccessToken) {
    ok = false;
  }

  return res.status(ok ? 200 : 503).json({
    ok,
    service: 'Rio Groove Store Backend',
    checks,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  healthCheck,
};
