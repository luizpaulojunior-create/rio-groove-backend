const customerAuthService = require('../services/customerAuth.service');

async function registerCustomer(req, res, next) {
  try {
    const { email, password, metadata } = req.body || {};
    const result = await customerAuthService.registerCustomer({
      email,
      password,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });

    try {
      if (result.resynced) {
        const login = await customerAuthService.createCustomerSession(email);
        return res.status(result.status === 'created' ? 201 : 200).json({
          ok: true,
          status: result.status,
          message:
            result.status === 'created'
              ? 'Conta criada com sucesso.'
              : 'Conta recuperada. Login realizado.',
          email: result.email,
          user: login.user,
          session: login.session,
        });
      }

      const login = await customerAuthService.signInCustomer({
        email,
        password,
        allowMagicLinkFallback: result.status === 'created',
      });
      return res.status(result.status === 'created' ? 201 : 200).json({
        ok: true,
        status: result.status,
        message:
          result.status === 'created'
            ? 'Conta criada com sucesso.'
            : 'Conta encontrada. Login realizado.',
        email: result.email,
        user: login.user,
        session: login.session,
      });
    } catch (loginError) {
      if (result.status === 'existing') {
        return res.status(409).json({
          ok: false,
          code: 'EMAIL_ALREADY_EXISTS',
          message:
            'Este e-mail já está cadastrado. Faça login com a senha que você usou antes ou redefina a senha.',
          email: result.email,
        });
      }

      return res.status(result.status === 'created' ? 201 : 200).json({
        ok: true,
        status: result.status,
        needsLogin: true,
        message: 'Conta criada, mas não foi possível iniciar a sessão automaticamente.',
        email: result.email,
      });
    }
  } catch (err) {
    next(err);
  }
}

async function activateCustomer(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = await customerAuthService.activateCustomerLogin({ email, password });

    res.json({
      ok: true,
      message: 'Conta ativada. Você já pode usar a loja.',
      alreadyConfirmed: result.alreadyConfirmed,
      user: result.user,
      session: result.session,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerCustomer,
  activateCustomer,
};
