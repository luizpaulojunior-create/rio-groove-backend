const express = require('express');
const { mercadoPagoWebhook, stripeWebhook } = require('../controllers/webhook.controller');
const { webhookLimiter } = require('../middlewares/rate-limit');

const router = express.Router();

router.post('/api/webhooks/mercadopago', webhookLimiter, mercadoPagoWebhook);
router.post('/api/webhooks/stripe', webhookLimiter, stripeWebhook);

module.exports = router;
