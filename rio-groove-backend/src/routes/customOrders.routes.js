const express = require('express');
const { customOrderUpload } = require('../config/upload');
const { customOrderLimiter, customOrderTrackLimiter } = require('../middlewares/rate-limit');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const requireCustomerAuth = require('../middlewares/require-customer-auth');
const optionalCustomerAuth = require('../middlewares/optional-customer-auth');
const {
  submitCustomOrder,
  listCustomOrders,
  listMyCustomOrders,
  getCustomOrder,
  getMyCustomOrder,
  getCustomOrderPublic,
  patchCustomOrder,
  incrementRevision,
  approveCustomOrder,
  payArtFee,
  payProduct,
  quoteCustomOrderShipping,
  reconcileMyCustomOrderPayment,
  reconcileCustomOrderPaymentAdmin,
} = require('../controllers/customOrders.controller');

const router = express.Router();
const upload = customOrderUpload;

router.post(
  '/api/custom-orders',
  customOrderLimiter,
  optionalCustomerAuth,
  upload.fields([
    { name: 'art_files', maxCount: 8 },
    { name: 'reference_files', maxCount: 5 },
  ]),
  submitCustomOrder,
);

router.get('/api/custom-orders/track/:token', customOrderTrackLimiter, getCustomOrderPublic);

router.get('/api/custom-orders/mine', requireCustomerAuth, listMyCustomOrders);
router.get('/api/custom-orders/mine/:id', requireCustomerAuth, getMyCustomOrder);
router.post('/api/custom-orders/mine/:id/pay-art', requireCustomerAuth, payArtFee);
router.post('/api/custom-orders/mine/:id/approve', requireCustomerAuth, approveCustomOrder);
router.post('/api/custom-orders/mine/:id/pay-product', requireCustomerAuth, payProduct);
router.post('/api/custom-orders/mine/:id/reconcile-payment', requireCustomerAuth, reconcileMyCustomOrderPayment);

router.get(
  '/api/custom-orders',
  requireAdminAuth,
  requireMinRole('editor'),
  listCustomOrders,
);

router.get(
  '/api/custom-orders/:id',
  requireAdminAuth,
  requireMinRole('editor'),
  getCustomOrder,
);

router.patch(
  '/api/custom-orders/:id',
  requireAdminAuth,
  requireMinRole('editor'),
  upload.single('mockup'),
  patchCustomOrder,
);

router.post(
  '/api/custom-orders/:id/revisions',
  requireAdminAuth,
  requireMinRole('editor'),
  incrementRevision,
);

router.post(
  '/api/custom-orders/:id/shipping-quote',
  requireAdminAuth,
  requireMinRole('editor'),
  quoteCustomOrderShipping,
);

router.post(
  '/api/custom-orders/:id/reconcile-payment',
  requireAdminAuth,
  requireMinRole('editor'),
  reconcileCustomOrderPaymentAdmin,
);

module.exports = router;
