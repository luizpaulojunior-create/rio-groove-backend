const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const { shippingQuoteLimiter } = require('../middlewares/rate-limit');
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
router.post('/api/shipping/quote/public', shippingQuoteLimiter, shippingQuote);
router.post('/api/shipping/quote', requireAdminAuth, requireMinRole('editor'), shippingQuote);
router.post('/api/shipping/purchase', requireAdminAuth, requireMinRole('editor'), purchaseOrderShipping);
router.post('/api/shipping/label', requireAdminAuth, requireMinRole('editor'), generateOrderShippingLabel);
router.post('/api/shipping/label/fulfill', requireAdminAuth, requireMinRole('editor'), fulfillOrderShippingLabel);
router.get('/api/shipping/label/:id/pdf', requireAdminAuth, requireMinRole('editor'), downloadOrderShippingLabelPdf);
router.get('/api/shipping/tracking/:id', requireAdminAuth, getShippingTracking);

module.exports = router;
