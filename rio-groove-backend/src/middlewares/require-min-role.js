const { hasMinRole, normalizeRole } = require('../utils/admin-roles');

function requireMinRole(minRole) {
  return function requireMinRoleMiddleware(req, res, next) {
    const userRole = normalizeRole(req.adminRole);
    if (!hasMinRole(userRole, minRole)) {
      return res.status(403).json({
        message: 'Permissão insuficiente para esta operação.',
      });
    }
    return next();
  };
}

module.exports = requireMinRole;
