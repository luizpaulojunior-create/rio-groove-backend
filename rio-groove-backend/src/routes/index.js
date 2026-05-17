const express = require('express');
const healthRoutes = require('./health.routes');
const configRoutes = require('./config.routes');
const checkoutRoutes = require('./checkout.routes');
const ordersRoutes = require('./orders.routes');
const webhookRoutes = require('./webhooks.routes');
const shippingRoutes = require('./shipping.routes');
const authRoutes = require('./auth.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use(healthRoutes);
router.use(configRoutes);
router.use(checkoutRoutes);
router.use(shippingRoutes);
router.use(ordersRoutes);
router.use(webhookRoutes);

module.exports = router;
