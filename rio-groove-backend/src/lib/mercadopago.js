const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const env = require('../config/env');

const client = new MercadoPagoConfig({ accessToken: env.mercadoPagoAccessToken });

module.exports = {
  client,
  preferenceClient: new Preference(client),
  paymentClient: new Payment(client)
};
