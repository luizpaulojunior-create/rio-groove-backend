const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const {
  getDashboard,
  getSales,
  getTopProductsAnalytics,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/api/analytics/dashboard', requireAdminAuth, getDashboard);
router.get('/api/analytics/sales', requireAdminAuth, getSales);
router.get('/api/analytics/top-products', requireAdminAuth, getTopProductsAnalytics);

module.exports = router;
