const express = require('express');
const { shippingQuote } = require('../controllers/shipping.controller');

const router = express.Router();

router.post('/api/shipping/quote', shippingQuote);

module.exports = router;
