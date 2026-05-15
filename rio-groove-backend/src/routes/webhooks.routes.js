const express = require('express');
const { mercadoPagoWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

router.post('/api/webhooks/mercadopago', mercadoPagoWebhook);

module.exports = router;
