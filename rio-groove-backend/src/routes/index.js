const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const { startMelhorEnvioOAuth } = require('../controllers/auth.controller');
const healthRoutes = require('./health.routes');
const configRoutes = require('./config.routes');
const checkoutRoutes = require('./checkout.routes');
const ordersRoutes = require('./orders.routes');
const webhookRoutes = require('./webhooks.routes');
const shippingRoutes = require('./shipping.routes');
const authRoutes = require('./auth.routes');
const collectionsRoutes = require('./collections.routes');
const productsRoutes = require('./products.routes');
const uploadRoutes = require('./upload.routes');
const stockRoutes = require('./stock.routes');
const analyticsRoutes = require('./analytics.routes');
const customOrdersRoutes = require('./customOrders.routes');
const couponsRoutes = require('./coupons.routes');
const insumoCostsRoutes = require('./insumoCosts.routes');
const customerAuthRoutes = require('./customerAuth.routes');

const router = express.Router();

router.post(
  '/api/auth/melhor-envio/start',
  requireAdminAuth,
  requireMinRole('superadmin'),
  startMelhorEnvioOAuth,
);

router.use('/auth', authRoutes);
router.use('/api/customer-auth', customerAuthRoutes);
router.use(healthRoutes);
router.use(configRoutes);
router.use(checkoutRoutes);
router.use(shippingRoutes);
router.use(ordersRoutes);
router.use(webhookRoutes);
router.use(collectionsRoutes);
router.use(productsRoutes);
router.use(uploadRoutes);
router.use(stockRoutes);
router.use(analyticsRoutes);
router.use(customOrdersRoutes);
router.use(couponsRoutes);
router.use(insumoCostsRoutes);

module.exports = router;
