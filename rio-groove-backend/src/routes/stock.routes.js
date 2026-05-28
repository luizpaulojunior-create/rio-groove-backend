const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const {
  getStock,
  getStockItem,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  adjustStock,
  seedStockItems
} = require('../controllers/stock.controller');

const router = express.Router();

router.get('/api/stock', requireAdminAuth, getStock);
router.get('/api/stock/:id', requireAdminAuth, getStockItem);
router.post('/api/stock/seed', requireAdminAuth, requireMinRole('superadmin'), seedStockItems);
router.post('/api/stock', requireAdminAuth, requireMinRole('editor'), createStockItem);
router.put('/api/stock/:id', requireAdminAuth, requireMinRole('editor'), updateStockItem);
router.delete('/api/stock/:id', requireAdminAuth, requireMinRole('editor'), deleteStockItem);
router.post('/api/stock/:id/adjust', requireAdminAuth, requireMinRole('editor'), adjustStock);

module.exports = router;
