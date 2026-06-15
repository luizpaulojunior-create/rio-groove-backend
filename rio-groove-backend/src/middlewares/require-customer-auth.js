const supabase = require('../lib/supabase');

async function requireCustomerAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ message: 'Faça login para continuar.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
    }

    req.user = user;
    req.authToken = token;
    return next();
  } catch (err) {
    console.error('[CustomerAuth]', err.message);
    return res.status(401).json({ message: 'Falha na autenticação.' });
  }
}

module.exports = requireCustomerAuth;
