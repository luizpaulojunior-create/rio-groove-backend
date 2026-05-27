const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const {
  shippingQuote,
  purchaseOrderShipping,
  generateOrderShippingLabel,
  fulfillOrderShippingLabel,
  downloadOrderShippingLabelPdf,
  getShippingTracking
} = require('../controllers/shipping.controller');

const router = express.Router();

// Loja (checkout público) — sem auth; admin continua com Bearer
router.post('/api/shipping/quote/public', shippingQuote);
router.post('/api/shipping/quote', requireAdminAuth, shippingQuote);
router.post('/api/shipping/purchase', requireAdminAuth, purchaseOrderShipping);
router.post('/api/shipping/label', requireAdminAuth, generateOrderShippingLabel);
router.post('/api/shipping/label/fulfill', requireAdminAuth, fulfillOrderShippingLabel);
router.get('/api/shipping/label/:id/pdf', requireAdminAuth, downloadOrderShippingLabelPdf);
router.get('/api/shipping/tracking/:id', requireAdminAuth, getShippingTracking);

module.exports = router;
