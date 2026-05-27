const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const { getAllOrders, createManualOrder, getOrder, getOrderPublicStatus, updateOrderStatus } = require('../controllers/orders.controller');

const router = express.Router();

router.get('/api/orders', requireAdminAuth, getAllOrders);
router.post('/api/orders', requireAdminAuth, createManualOrder);
router.get('/api/orders/:reference/public-status', getOrderPublicStatus);
router.get('/api/orders/:reference', requireAdminAuth, getOrder);
router.put('/api/orders/:id/status', requireAdminAuth, updateOrderStatus);

module.exports = router;
