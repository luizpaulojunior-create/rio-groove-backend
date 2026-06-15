const supabase = require('../lib/supabase');

/** Anexa req.user se Bearer JWT válido; não bloqueia se ausente. */
async function optionalCustomerAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) return next();

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return next();

    req.user = user;
    req.authToken = token;
    return next();
  } catch {
    return next();
  }
}

module.exports = optionalCustomerAuth;
