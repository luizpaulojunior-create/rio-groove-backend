/**
 * Zera quantity de todos os SKUs White (color_key = wht).
 * Não altera Off White (off).
 *
 * PowerShell:
 *   cd rio-groove-backend
 *   node scripts/zero-white-stock.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();
const { zeroWhiteStockItems } = require('../src/services/stock.service');

async function main() {
  const result = await zeroWhiteStockItems();
  console.log(result.message);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
