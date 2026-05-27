const test = require('node:test');
const assert = require('node:assert/strict');
const { isOriginAllowed, isKnownPagesDevOrigin } = require('../src/utils/cors-origin');

test('isKnownPagesDevOrigin allows known Cloudflare projects', () => {
  assert.equal(isKnownPagesDevOrigin('https://rio-groove-store-v2.pages.dev'), true);
  assert.equal(isKnownPagesDevOrigin('https://a614e64a.rio-groove-store-v2.pages.dev'), true);
  assert.equal(isKnownPagesDevOrigin('https://evil-project.pages.dev'), false);
});

test('isOriginAllowed accepts production domains and blocks unknown origins', () => {
  const allowed = [
    'https://store.riogroovemovimentos.com.br',
    'https://a614e64a.rio-groove-store-v2.pages.dev',
  ];

  for (const origin of allowed) {
    assert.equal(isOriginAllowed(origin), true, origin);
  }

  assert.equal(isOriginAllowed('https://malicious.example.com'), false);
  assert.equal(isOriginAllowed(undefined), true);
});
