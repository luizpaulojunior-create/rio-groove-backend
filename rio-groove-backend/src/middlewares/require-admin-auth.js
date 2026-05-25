const supabase = require('../lib/supabase');

/**
 * Valida JWT Supabase (Bearer) e exige registro na tabela admins.
 * Usado em rotas administrativas — ver ARCHITECTURE.md Fase 2.
 */
async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ message: 'Token de autenticação ausente.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    const { data: adminRow, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      return res.status(403).json({ message: 'Sem permissão de administrador.' });
    }

    req.user = user;
    req.authToken = token;
    return next();
  } catch (err) {
    console.error('[Auth] Falha na validação JWT:', err.message);
    return res.status(401).json({ message: 'Falha na autenticação.' });
  }
}

module.exports = requireAdminAuth;
