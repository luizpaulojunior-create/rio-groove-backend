const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const { orderStatusLimiter } = require('../middlewares/rate-limit');
const { getAllOrders, createManualOrder, getOrder, getOrderPublicStatus, reconcileOrderPayment, reconcileOrderPaymentAdmin, updateOrderStatus } = require('../controllers/orders.controller');

const router = express.Router();

router.get('/api/orders', requireAdminAuth, getAllOrders);
router.post('/api/orders', requireAdminAuth, requireMinRole('editor'), createManualOrder);
router.get('/api/orders/:reference/public-status', orderStatusLimiter, getOrderPublicStatus);
router.post('/api/orders/:reference/public-status', orderStatusLimiter, getOrderPublicStatus);
router.post('/api/orders/:reference/reconcile-payment', orderStatusLimiter, reconcileOrderPayment);
router.post(
  '/api/orders/:reference/reconcile-payment-admin',
  requireAdminAuth,
  requireMinRole('editor'),
  reconcileOrderPaymentAdmin,
);
router.get('/api/orders/:reference', requireAdminAuth, getOrder);
router.put('/api/orders/:id/status', requireAdminAuth, requireMinRole('editor'), updateOrderStatus);

module.exports = router;
