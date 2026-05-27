const asyncHandler = require('../utils/asyncHandler');
const {
  getDashboardAnalytics,
  getSalesChartData,
  getTopProducts,
} = require('../services/analytics.service');

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardAnalytics();
  return res.json(stats);
});

const getSales = asyncHandler(async (req, res) => {
  const period = String(req.query.period || '30d');
  const chart = await getSalesChartData(period);
  return res.json(chart);
});

const getTopProductsAnalytics = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const products = await getTopProducts(limit);
  return res.json(products);
});

module.exports = {
  getDashboard,
  getSales,
  getTopProductsAnalytics,
};
