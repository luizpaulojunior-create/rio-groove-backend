const asyncHandler = require('../utils/asyncHandler');
const stockService = require('../services/stock.service');

const getStock = asyncHandler(async (req, res) => {
  const stock = await stockService.getStock();
  return res.json(stock);
});

const getStockItem = asyncHandler(async (req, res) => {
  const item = await stockService.getStockItem(req.params.id);
  return res.json(item);
});

const createStockItem = asyncHandler(async (req, res) => {
  try {
    const item = await stockService.createStockItem(req.body);
    return res.status(201).json(item);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao criar lote de estoque' });
  }
});

const updateStockItem = asyncHandler(async (req, res) => {
  try {
    const item = await stockService.updateStockItem(req.params.id, req.body);
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao atualizar lote de estoque' });
  }
});

const deleteStockItem = asyncHandler(async (req, res) => {
  await stockService.deleteStockItem(req.params.id);
  return res.status(204).send();
});

const adjustStock = asyncHandler(async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const item = await stockService.adjustStock(req.params.id, quantity, reason);
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao ajustar estoque' });
  }
});

module.exports = {
  getStock,
  getStockItem,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  adjustStock
};
