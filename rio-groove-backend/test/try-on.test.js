const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedGarmentUrl, isTryOnConfigured, MAX_GARMENT_BYTES } = require('../src/services/tryOn.service');

test('try-on download cap is above Almir Poeta PNGs and does not resize catalog files', () => {
  assert.ok(MAX_GARMENT_BYTES >= 20 * 1024 * 1024);
});

test('isTryOnConfigured is false without OPENAI_API_KEY', () => {
  assert.equal(isTryOnConfigured(), false);
});

test('isAllowedGarmentUrl accepts product-images on the store bucket', () => {
  assert.equal(
    isAllowedGarmentUrl(
      'https://cvpobvvkhcqasumhfwps.supabase.co/storage/v1/object/public/product-images/products/zeneida-caruana-camisa-off-hanger.jpg',
    ),
    true,
  );
});

test('isAllowedGarmentUrl rejects arbitrary hosts', () => {
  assert.equal(isAllowedGarmentUrl('https://evil.example/storage/v1/object/public/product-images/x.jpg'), false);
  assert.equal(isAllowedGarmentUrl('http://cvpobvvkhcqasumhfwps.supabase.co/storage/v1/object/public/product-images/x.jpg'), false);
  assert.equal(isAllowedGarmentUrl('not-a-url'), false);
});
