const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const {
  shippingQuote,
  purchaseOrderShipping,
  generateOrderShippingLabel,
  getShippingTracking
} = require('../controllers/shipping.controller');

const router = express.Router();

router.post('/api/shipping/quote', requireAdminAuth, shippingQuote);
router.post('/api/shipping/purchase', requireAdminAuth, purchaseOrderShipping);
router.post('/api/shipping/label', requireAdminAuth, generateOrderShippingLabel);
router.get('/api/shipping/tracking/:id', requireAdminAuth, getShippingTracking);

module.exports = router;
