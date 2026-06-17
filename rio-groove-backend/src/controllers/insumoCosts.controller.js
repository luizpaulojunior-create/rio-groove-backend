const asyncHandler = require('../utils/asyncHandler');
const insumoCostsService = require('../services/insumoCosts.service');
const { buildUnitEconomics, getMonthlyDre } = require('../services/profitability.service');

const getInsumoCosts = asyncHandler(async (_req, res) => {
  const { config, updated_at } = insumoCostsService.getConfigMeta();
  return res.json({
    config,
    updated_at,
    dtf_insumos: insumoCostsService.DTF_INSUMOS,
    general_cost_groups: insumoCostsService.GENERAL_COST_GROUPS,
    defaults: insumoCostsService.DEFAULT_CONFIG,
    unit_economics: buildUnitEconomics(config),
  });
});

const getInsumoDre = asyncHandler(async (req, res) => {
  const dre = await getMonthlyDre(req.query.month);
  return res.json(dre);
});

const updateInsumoCosts = asyncHandler(async (req, res) => {
  const result = await insumoCostsService.saveInsumoCostConfig(req.body?.config || req.body);
  return res.json(result);
});

module.exports = {
  getInsumoCosts,
  getInsumoDre,
  updateInsumoCosts,
};
