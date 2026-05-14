const express = require('express');
const {
  shippingQuote,
  purchaseOrderShipping,
  generateOrderShippingLabel,
  getShippingTracking
} = require('../controllers/shipping.controller');

const router = express.Router();

router.post('/api/shipping/quote', shippingQuote);
router.post('/api/shipping/purchase', purchaseOrderShipping);
router.post('/api/shipping/label', generateOrderShippingLabel);
router.get('/api/shipping/tracking/:id', getShippingTracking);

module.exports = router;
