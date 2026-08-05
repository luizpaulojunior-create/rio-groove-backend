const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const { createPosSale } = require('../controllers/pos.controller');

const router = express.Router();

router.post('/api/pos/sales', requireAdminAuth, requireMinRole('editor'), createPosSale);

module.exports = router;
