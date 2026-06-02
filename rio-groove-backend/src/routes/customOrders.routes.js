const express = require('express');
const { customOrderUpload } = require('../config/upload');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const {
  submitCustomOrder,
  listCustomOrders,
  getCustomOrder,
  getCustomOrderPublic,
  patchCustomOrder,
} = require('../controllers/customOrders.controller');

const router = express.Router();
const upload = customOrderUpload;

router.post(
  '/api/custom-orders',
  upload.fields([
    { name: 'art_files', maxCount: 8 },
    { name: 'reference_files', maxCount: 5 },
  ]),
  submitCustomOrder,
);

router.get('/api/custom-orders/track/:token', getCustomOrderPublic);

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

module.exports = router;
