const express = require('express');
const { couponValidateLimiter } = require('../middlewares/rate-limit');
const { validateCoupon } = require('../controllers/coupons.controller');

const router = express.Router();

router.post('/api/coupons/validate', couponValidateLimiter, validateCoupon);

module.exports = router;
