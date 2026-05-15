const express = require('express');
const { createManualOrder, getOrder } = require('../controllers/orders.controller');

const router = express.Router();

router.post('/api/orders', createManualOrder);
router.get('/api/orders/:reference', getOrder);

module.exports = router;
