function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = String(value).replace(/\./g, '').replace(',', '.');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? roundMoney(numeric) : 0;
}

module.exports = {
  roundMoney,
  parseMoney
};
