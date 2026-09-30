const express = require('express');
const { checkout, pay, abandon } = require('../controllers/checkout.controller');
const { checkoutLimiter, checkoutPayLimiter } = require('../middlewares/rate-limit');

const router = express.Router();

router.post('/api/checkout', checkoutLimiter, checkout);
router.post('/api/checkout/pay', checkoutPayLimiter, pay);
router.post('/api/checkout/abandon', checkoutPayLimiter, abandon);

module.exports = router;
