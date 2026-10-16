const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedGarmentUrl, isTryOnConfigured } = require('../src/services/tryOn.service');

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
