/**
 * Catálogo operacional de estoque (10 un./SKU por padrão).
 * PowerShell: node scripts/apply-focus-stock.js
 *             node scripts/apply-focus-stock.js 10
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();
const { applyFocusOperationalStock } = require('../src/services/stock.service');

async function main() {
  const quantity = Number(process.argv[2] || 10);
  const result = await applyFocusOperationalStock(quantity);
  console.log(result.message);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
