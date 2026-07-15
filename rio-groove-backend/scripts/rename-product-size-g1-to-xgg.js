/**
 * Renomeia variantes G1/XG → XGG (manual, fora do boot).
 * PowerShell: node scripts/rename-product-size-g1-to-xgg.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const { renameProductVariantG1ToXgg } = require('../src/services/productSizeMigration.service');

async function main() {
  const result = await renameProductVariantG1ToXgg();
  console.log(result.message);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
