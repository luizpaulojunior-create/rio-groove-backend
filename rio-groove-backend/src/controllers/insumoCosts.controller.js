const asyncHandler = require('../utils/asyncHandler');
const insumoCostsService = require('../services/insumoCosts.service');

const getInsumoCosts = asyncHandler(async (_req, res) => {
  const { config, updated_at } = insumoCostsService.getConfigMeta();
  return res.json({
    config,
    updated_at,
    dtf_insumos: insumoCostsService.DTF_INSUMOS,
    defaults: insumoCostsService.DEFAULT_CONFIG,
  });
});

const updateInsumoCosts = asyncHandler(async (req, res) => {
  const result = await insumoCostsService.saveInsumoCostConfig(req.body?.config || req.body);
  return res.json(result);
});

module.exports = {
  getInsumoCosts,
  updateInsumoCosts,
};
