#!/usr/bin/env node
/**
 * Relatório de funil GA4 no terminal.
 * Uso: node scripts/ga4-funnel-report.mjs [7d|30d|90d]
 */
import dotenv from 'dotenv';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const require = createRequire(import.meta.url);
const { getConversionReport } = require('../src/services/ga4.service.js');

const period = process.argv[2] || '7d';

const report = await getConversionReport(period);

if (!report.configured) {
  console.error('\nGA4 não configurado.');
  console.error(report.message);
  process.exit(1);
}

console.log('\n=== Rio Groove — Funil GA4 ===');
console.log(`Período: ${report.startDate} → ${report.endDate} (${report.period})`);
console.log(`Propriedade: ${report.propertyId} | Measurement: ${report.measurementId}\n`);

console.log('--- Visão geral ---');
console.log(`Sessões: ${report.overview.sessions}`);
console.log(`Usuários: ${report.overview.activeUsers}`);
console.log(`Compras: ${report.overview.purchases}`);
console.log(`Receita: R$ ${report.overview.purchaseRevenue.toFixed(2)}`);

console.log('\n--- Funil ---');
for (const step of report.funnel) {
  const conv =
    step.rateFromPrevious != null
      ? `${step.rateFromPrevious}% da etapa anterior`
      : `${step.rateFromTop}% do topo`;
  console.log(`${step.label}: ${step.users} usuários (${conv})`);
}

console.log('\n--- Insights ---');
console.log(`Conversão produto → compra: ${report.insights.overallConversion}%`);
console.log(`Abandono após carrinho: ${report.insights.cartAbandonment}%`);
console.log(`Desistência no checkout: ${report.insights.checkoutDropoff}%`);

console.log('\n--- Dispositivos ---');
for (const device of report.devices) {
  console.log(`${device.label}: ${device.sessions} sessões, ${device.purchases} compras (${device.conversionRate}%)`);
}

console.log('\n--- Top produtos ---');
for (const product of report.topProducts.slice(0, 8)) {
  console.log(
    `${product.name}: ${product.views} views | ${product.addedToCart} carrinho | ${product.purchased} compras`
  );
}

console.log('');
