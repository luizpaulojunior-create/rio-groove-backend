require('./setup-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

function loadWebhookVerifier(envPatch = {}) {
  Object.assign(process.env, envPatch);
  delete require.cache[require.resolve('../src/config/env.js')];
  delete require.cache[require.resolve('../src/utils/mercadopago-webhook.js')];
  return require('../src/utils/mercadopago-webhook').verifyMercadoPagoWebhookSignature;
}

test('verifyMercadoPagoWebhookSignature skips verification without secret in non-production', () => {
  const verify = loadWebhookVerifier({
    NODE_ENV: 'test',
    MERCADO_PAGO_WEBHOOK_SECRET: '',
  });

  const result = verify({
    headers: {},
    query: {},
    body: {},
  });

  assert.equal(result.valid, true);
  assert.equal(result.skipped, true);
});

test('verifyMercadoPagoWebhookSignature validates signed request', () => {
  const verify = loadWebhookVerifier({
    NODE_ENV: 'production',
    MERCADO_PAGO_WEBHOOK_SECRET: 'test-secret',
  });

  const ts = '1710000000';
  const dataId = '12345';
  const requestId = 'req-abc';
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = crypto.createHmac('sha256', 'test-secret').update(manifest).digest('hex');

  const result = verify({
    headers: {
      'x-signature': `ts=${ts},v1=${hash}`,
      'x-request-id': requestId,
    },
    query: { 'data.id': dataId },
    body: {},
  });

  assert.equal(result.valid, true);
});

test('verifyMercadoPagoWebhookSignature rejects invalid signature', () => {
  const verify = loadWebhookVerifier({
    NODE_ENV: 'production',
    MERCADO_PAGO_WEBHOOK_SECRET: 'test-secret',
  });

  const result = verify({
    headers: {
      'x-signature': 'ts=1710000000,v1=deadbeef',
      'x-request-id': 'req-abc',
    },
    query: { 'data.id': '12345' },
    body: {},
  });

  assert.equal(result.valid, false);
});
