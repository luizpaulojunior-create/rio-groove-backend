const env = require('../config/env');

function getPublicConfig(req, res) {
  try {
    console.log('[GET /api/config/public] Req received');
    console.log('[GET /api/config/public] Env values:', {
      mercadoPagoPublicKey: env?.mercadoPagoPublicKey ? 'SET' : 'MISSING',
      defaultCurrency: env?.defaultCurrency,
      frontendUrl: env?.frontendUrl
    });

    const payload = {
      mercadoPagoPublicKey: env?.mercadoPagoPublicKey || '',
      currency: env?.defaultCurrency || 'BRL',
      frontendUrl: env?.frontendUrl || ''
    };

    console.log('[GET /api/config/public] Sending payload:', payload);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[GET /api/config/public] Error:', error.message);
    console.error(error.stack);
    
    return res.status(200).json({
      mercadoPagoPublicKey: '',
      currency: 'BRL',
      frontendUrl: '',
      error: 'Failed to load config, returning safe fallback'
    });
  }
}

module.exports = {
  getPublicConfig
};
