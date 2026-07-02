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
    console.log('[DEBUG BACKEND] req.params:', req.params);
    console.log('[DEBUG BACKEND] req.body antes do processamento:', req.body);
    const item = await stockService.updateStockItem(req.params.id, req.body);
    console.log('[DEBUG BACKEND] payload final processado:', item);
    return res.json(item);
  } catch (error) {
    console.error('[DEBUG BACKEND] Mensagem real do erro:', error.message);
    console.error('[DEBUG BACKEND] Stack real do erro:', error.stack);
    return res.status(400).json({ 
      error: error.message || 'Erro ao atualizar lote de estoque', 
      stack: error.stack,
      details: error 
    });
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

const seedStockItems = asyncHandler(async (req, res) => {
  try {
    const result = await stockService.seedStockItems();
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao gerar estoque inicial' });
  }
});

const syncYellowStockItems = asyncHandler(async (req, res) => {
  try {
    const quantity = req.body?.quantity ?? 10;
    const result = await stockService.syncYellowStockItems(quantity);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao sincronizar estoque amarelo' });
  }
});

const removeYellowStockItems = asyncHandler(async (req, res) => {
  try {
    const result = await stockService.removeYellowStockItems();
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao remover estoque amarelo' });
  }
});

const zeroWhiteStockItems = asyncHandler(async (req, res) => {
  try {
    const result = await stockService.zeroWhiteStockItems();
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao zerar estoque branco' });
  }
});

const applyFocusOperationalStock = asyncHandler(async (req, res) => {
  try {
    const quantity = req.body?.quantity ?? 10;
    const result = await stockService.applyFocusOperationalStock(quantity);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao aplicar catálogo operacional de estoque' });
  }
});

module.exports = {
  getStock,
  getStockItem,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  adjustStock,
  seedStockItems,
  syncYellowStockItems,
  removeYellowStockItems,
  zeroWhiteStockItems,
  applyFocusOperationalStock
};
