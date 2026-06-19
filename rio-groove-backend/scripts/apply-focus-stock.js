/**
 * Foco operacional de estoque:
 * - Ativo: oversized + regata + cropped em preto (blk) e off white (off)
 * - Resto: quantity = 0, is_active = false
 *
 * PowerShell:
 *   cd rio-groove-backend
 *   node scripts/apply-focus-stock.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();
const { applyFocusOperationalStock } = require('../src/services/stock.service');

async function main() {
  const result = await applyFocusOperationalStock();
  console.log(result.message);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
