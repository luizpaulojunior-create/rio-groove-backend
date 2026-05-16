const env = require('../config/env');

function getPublicConfig(req, res) {
  return res.json({
    mercadoPagoPublicKey: env.mercadoPagoPublicKey,
    currency: env.defaultCurrency,
    frontendUrl: env.frontendUrl
  });
}

module.exports = {
  getPublicConfig
};
