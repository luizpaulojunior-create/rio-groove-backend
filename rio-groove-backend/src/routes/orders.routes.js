const express = require('express');
const { getAllOrders, createManualOrder, getOrder } = require('../controllers/orders.controller');

const router = express.Router();

router.get('/api/orders', getAllOrders);
router.post('/api/orders', createManualOrder);
router.get('/api/orders/:reference', getOrder);
router.put('/api/orders/:id/status', require('../controllers/orders.controller').updateOrderStatus);

module.exports = router;
