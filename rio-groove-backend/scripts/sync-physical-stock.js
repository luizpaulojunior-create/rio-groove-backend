/**
 * Sincroniza estoque físico real do caderno com stock_items.
 * PowerShell: node scripts/sync-physical-stock.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const { syncPhysicalStock } = require('../src/services/stock.service');

async function main() {
  const result = await syncPhysicalStock();
  console.log(result.message);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
