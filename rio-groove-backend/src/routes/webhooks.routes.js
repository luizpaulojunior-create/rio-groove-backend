const express = require('express');
const { mercadoPagoWebhook, stripeWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

router.post('/api/webhooks/mercadopago', mercadoPagoWebhook);
// Nota: a rota /api/webhooks/stripe deve usar express.raw, o que já foi configurado no app.js
router.post('/api/webhooks/stripe', stripeWebhook);

module.exports = router;
