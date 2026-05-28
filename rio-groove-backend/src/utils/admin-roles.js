const ROLE_RANK = {
  viewer: 1,
  editor: 2,
  superadmin: 3,
};

function normalizeRole(role) {
  const key = String(role || 'editor').toLowerCase();
  return ROLE_RANK[key] ? key : 'editor';
}

function hasMinRole(userRole, minRole) {
  const current = ROLE_RANK[normalizeRole(userRole)] || 0;
  const required = ROLE_RANK[normalizeRole(minRole)] || 99;
  return current >= required;
}

module.exports = {
  ROLE_RANK,
  normalizeRole,
  hasMinRole,
};
