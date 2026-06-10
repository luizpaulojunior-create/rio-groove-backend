const express = require('express');
const { mercadoPagoWebhook } = require('../controllers/webhook.controller');
const { webhookLimiter } = require('../middlewares/rate-limit');

const router = express.Router();

router.post('/api/webhooks/mercadopago', webhookLimiter, mercadoPagoWebhook);

module.exports = router;
