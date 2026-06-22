const asyncHandler = require('../utils/asyncHandler');
const {
  getDashboardAnalytics,
  getSalesChartData,
  getTopProducts,
} = require('../services/analytics.service');
const { getConversionReport } = require('../services/ga4.service');

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

const getGa4Conversion = asyncHandler(async (req, res) => {
  const period = String(req.query.period || '7d');
  const report = await getConversionReport(period);
  return res.json(report);
});

module.exports = {
  getDashboard,
  getSales,
  getTopProductsAnalytics,
  getGa4Conversion,
};
