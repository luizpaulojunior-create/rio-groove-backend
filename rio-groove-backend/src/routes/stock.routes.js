const express = require('express');
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

router.get('/api/stock', getStock);
router.get('/api/stock/:id', getStockItem);
router.post('/api/stock/seed', seedStockItems);
router.post('/api/stock', createStockItem);
router.put('/api/stock/:id', updateStockItem);
router.delete('/api/stock/:id', deleteStockItem);
router.post('/api/stock/:id/adjust', adjustStock);

module.exports = router;
