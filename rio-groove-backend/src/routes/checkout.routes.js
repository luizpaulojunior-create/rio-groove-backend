const express = require('express');
const { checkout } = require('../controllers/checkout.controller');
const { checkoutLimiter } = require('../middlewares/rate-limit');

const router = express.Router();

router.post('/api/checkout', checkoutLimiter, checkout);

module.exports = router;
