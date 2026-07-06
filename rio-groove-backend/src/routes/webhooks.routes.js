const express = require('express');
const { mercadoPagoWebhook, melhorEnvioWebhook } = require('../controllers/webhook.controller');
const { webhookLimiter } = require('../middlewares/rate-limit');

const router = express.Router();

router.post('/api/webhooks/mercadopago', webhookLimiter, mercadoPagoWebhook);
router.post('/api/webhooks/melhor-envio', webhookLimiter, melhorEnvioWebhook);

module.exports = router;
