const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const {
  getDashboard,
  getSales,
  getTopProductsAnalytics,
  getGa4Conversion,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/api/analytics/dashboard', requireAdminAuth, getDashboard);
router.get('/api/analytics/sales', requireAdminAuth, getSales);
router.get('/api/analytics/top-products', requireAdminAuth, getTopProductsAnalytics);
router.get('/api/analytics/ga4/conversion', requireAdminAuth, getGa4Conversion);

module.exports = router;
