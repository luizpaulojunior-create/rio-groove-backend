/**
 * Envia imediatamente o relatório semanal sem consumir o token da próxima segunda.
 * PowerShell: node scripts/send-weekly-stock-report.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const { sendWeeklyStockReport } = require('../src/services/weeklyStockReport.service');

sendWeeklyStockReport({ force: true, record: false })
  .then((result) => {
    console.log(JSON.stringify({
      sent: result.sent,
      token: result.token,
      total_units: result.summary?.totalUnits,
      total_skus: result.summary?.totalSkus,
      out_of_stock: result.summary?.outOfStock?.length,
      low_stock: result.summary?.lowStock?.length,
      provider: result.email?.provider,
    }, null, 2));
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
