const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
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
router.post('/api/stock/seed', requireAdminAuth, seedStockItems);
router.post('/api/stock', requireAdminAuth, createStockItem);
router.put('/api/stock/:id', requireAdminAuth, updateStockItem);
router.delete('/api/stock/:id', requireAdminAuth, deleteStockItem);
router.post('/api/stock/:id/adjust', requireAdminAuth, adjustStock);

module.exports = router;
