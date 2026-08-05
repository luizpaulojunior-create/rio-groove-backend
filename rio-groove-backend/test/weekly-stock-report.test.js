require('./setup-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPhysicalStockRows } = require('../src/config/physicalStock');
const {
  getWeeklyReportToken,
  isWeeklyReportDue,
  summarizeStock,
  buildWeeklyStockReportHtml,
} = require('../src/services/weeklyStockReport.service');

test('physical stock manifest matches August count', () => {
  const rows = buildPhysicalStockRows();
  const total = rows.reduce((sum, row) => sum + row.quantity, 0);

  assert.equal(rows.length, 26);
  assert.equal(total, 89);
});

test('weekly report is due Monday after 09:00 in Sao Paulo', () => {
  assert.equal(isWeeklyReportDue(new Date('2026-08-03T11:59:00Z')), false);
  assert.equal(isWeeklyReportDue(new Date('2026-08-03T12:00:00Z')), true);
  assert.equal(isWeeklyReportDue(new Date('2026-08-04T12:00:00Z')), false);
  assert.equal(getWeeklyReportToken(new Date('2026-08-03T12:00:00Z')), '2026-08-03');
});

test('stock summary classifies zero, low and healthy SKUs', () => {
  const summary = summarizeStock([
    { sku: 'ZERO', quantity: 0, min_stock: 0, is_active: true },
    { sku: 'LOW', quantity: 1, min_stock: 1, is_active: true },
    { sku: 'OK', quantity: 4, min_stock: 1, is_active: true },
    { sku: 'INACTIVE', quantity: 99, min_stock: 1, is_active: false },
  ]);

  assert.equal(summary.totalSkus, 3);
  assert.equal(summary.totalUnits, 5);
  assert.equal(summary.outOfStock.length, 1);
  assert.equal(summary.lowStock.length, 1);
  assert.equal(summary.healthySkus, 1);
});

test('weekly report HTML contains stock totals', () => {
  const summary = summarizeStock(buildPhysicalStockRows());
  const html = buildWeeklyStockReportHtml(summary, new Date('2026-08-03T12:00:00Z'));

  assert.match(html, /89/);
  assert.match(html, /26/);
  assert.match(html, /Condição semanal do estoque/);
});
