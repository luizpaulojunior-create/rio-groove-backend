const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    skip: (req) => process.env.NODE_ENV === 'test',
  });
}

const checkoutLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Muitas tentativas de checkout. Aguarde alguns minutos.',
});

const shippingQuoteLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Muitas cotações de frete. Aguarde alguns minutos.',
});

const orderStatusLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Muitas consultas de pedido. Aguarde alguns minutos.',
});

const webhookLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Limite de webhooks excedido.',
});

const customOrderLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Muitos pedidos personalizados enviados. Aguarde alguns minutos.',
});

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Muitas requisições. Aguarde alguns minutos.',
});

const couponValidateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Muitas tentativas de cupom. Aguarde alguns minutos.',
});

const customOrderTrackLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Muitas consultas de pedido. Aguarde alguns minutos.',
});

const oauthLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Muitas tentativas de autenticação. Aguarde alguns minutos.',
});

const customerAuthLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Muitas tentativas de cadastro/login. Aguarde alguns minutos.',
});

module.exports = {
  checkoutLimiter,
  shippingQuoteLimiter,
  orderStatusLimiter,
  webhookLimiter,
  customOrderLimiter,
  customOrderTrackLimiter,
  couponValidateLimiter,
  oauthLimiter,
  customerAuthLimiter,
  apiLimiter,
};
