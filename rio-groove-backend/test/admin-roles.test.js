require('./setup-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRole, hasMinRole } = require('../src/utils/admin-roles');

test('normalizeRole defaults unknown/null to viewer', () => {
  assert.equal(normalizeRole(null), 'viewer');
  assert.equal(normalizeRole(undefined), 'viewer');
  assert.equal(normalizeRole(''), 'viewer');
  assert.equal(normalizeRole('typo'), 'viewer');
  assert.equal(normalizeRole('EDITOR'), 'editor');
  assert.equal(normalizeRole('superadmin'), 'superadmin');
});

test('hasMinRole respects ranks after normalizeRole', () => {
  assert.equal(hasMinRole(null, 'editor'), false);
  assert.equal(hasMinRole('viewer', 'viewer'), true);
  assert.equal(hasMinRole('editor', 'viewer'), true);
  assert.equal(hasMinRole('editor', 'superadmin'), false);
});
