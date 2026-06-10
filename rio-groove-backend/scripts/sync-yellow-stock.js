/**
 * Cria SKUs amarelos (Camisa, Regata, Boné) e define quantity=10.
 *
 * PowerShell:
 *   cd rio-groove-backend
 *   $env:NODE_ENV='development'
 *   node scripts/sync-yellow-stock.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();
const { syncYellowStockItems } = require('../src/services/stock.service');

function parseQuantity(argv) {
  const arg = argv.find((item) => item.startsWith('--quantity='));
  if (!arg) return 10;
  const value = Number(arg.split('=')[1]);
  return Number.isInteger(value) && value >= 0 ? value : 10;
}

async function main() {
  const quantity = parseQuantity(process.argv.slice(2));
  const result = await syncYellowStockItems(quantity);
  console.log(result.message);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
