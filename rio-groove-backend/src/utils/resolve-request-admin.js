const supabase = require('../lib/supabase');
const { normalizeRole } = require('./admin-roles');

/**
 * Returns admin context when Bearer JWT is valid, else null (no error response).
 */
async function resolveRequestAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: adminRow, error: adminError } = await supabase
    .from('admins')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError || !adminRow) return null;

  return {
    user,
    role: normalizeRole(adminRow.role),
  };
}

module.exports = { resolveRequestAdmin };
