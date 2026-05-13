function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function parseMoney(value) {
   if (value === null || value === undefined || value === '') return 0;
   const normalized = String(value).replace(/\./g, '').replace(',', '.');
   const str = String(value);
   let normalized;
   if (str.includes(',')) {
     // BR format: remove dots, replace comma with dot
     normalized = str.replace(/\./g, '').replace(',', '.');
   } else {
     // US format: keep dots as decimal separator
     normalized = str.replace(',', '.');
  }
   const numeric = Number(normalized);
   return Number.isFinite(numeric) ? roundMoney(numeric) : 0;
 }
module.exports = {
  roundMoney,
  parseMoney
};
