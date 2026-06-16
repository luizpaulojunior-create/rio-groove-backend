const customerAuthService = require('../services/customerAuth.service');

async function registerCustomer(req, res, next) {
  try {
    const { email, password, metadata } = req.body || {};
    const result = await customerAuthService.registerCustomer({
      email,
      password,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });

    res.status(result.status === 'created' ? 201 : 200).json({
      ok: true,
      status: result.status,
      message:
        result.status === 'created'
          ? 'Conta criada com sucesso.'
          : 'Conta já existia e foi ativada para login.',
      email: result.email,
    });
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
