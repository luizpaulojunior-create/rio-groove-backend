const test = require('node:test');
const assert = require('node:assert/strict');
const {
  verifyOrderPublicStatusAccess,
  buildPublicOrderStatusResponse,
} = require('../src/utils/order-public-status');

test('verifyOrderPublicStatusAccess requires valid email', () => {
  const order = { customer_email: 'cliente@example.com' };
  const missing = verifyOrderPublicStatusAccess(order, '');
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 400);
});

test('verifyOrderPublicStatusAccess rejects mismatched email', () => {
  const order = { customer_email: 'cliente@example.com' };
  const mismatch = verifyOrderPublicStatusAccess(order, 'outro@example.com');
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.status, 403);
});

test('verifyOrderPublicStatusAccess accepts matching email', () => {
  const order = { customer_email: 'cliente@example.com' };
  const ok = verifyOrderPublicStatusAccess(order, 'cliente@example.com');
  assert.equal(ok.ok, true);
});

test('buildPublicOrderStatusResponse maps order fields', () => {
  const payload = buildPublicOrderStatusResponse({
    id: 'uuid-1',
    order_number: 'RG-100',
    external_reference: 'ext-1',
    status: 'awaiting_payment',
    payment_status: 'pending',
    payment_provider: 'mercado_pago',
    total_amount: 150,
    subtotal_amount: 130,
    shipping_amount: 20,
    shipping_method: 'PAC',
    paid_at: null,
    created_at: '2026-05-25T00:00:00.000Z',
    items: [{
      product_name: 'Camisa',
      quantity: 1,
      unit_price: 130,
      line_total: 130,
      color: 'Preto',
      size: 'M',
    }],
  });

  assert.equal(payload.orderNumber, 'RG-100');
  assert.equal(payload.items[0].productName, 'Camisa');
});
