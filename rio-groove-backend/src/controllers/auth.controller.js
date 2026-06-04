const asyncHandler = require('../utils/asyncHandler');
const { getAuthorizationUrl, handleCallback } = require('../services/melhorEnvioAuth.service');
const { verifyOAuthState, createMelhorEnvioOAuthState } = require('../utils/oauth-state');

const startMelhorEnvioOAuth = asyncHandler(async (req, res) => {
  const state = createMelhorEnvioOAuthState(req.user.id);
  const url = await getAuthorizationUrl(state);
  return res.status(200).json({ url, state });
});

async function loginMelhorEnvio(req, res) {
  try {
    const { state } = req.query;
    const verification = verifyOAuthState(state);
    if (!verification.valid) {
      return res.status(403).json({
        message: 'OAuth Melhor Envio deve ser iniciado pelo painel admin (superadmin).',
      });
    }

    const url = await getAuthorizationUrl(state);
    return res.redirect(url);
  } catch (error) {
    console.error('[OAuth] login Melhor Envio:', error.message);
    return res.status(500).json({ message: 'Falha ao iniciar autenticação.' });
  }
}

async function callbackMelhorEnvio(req, res) {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send('Código não fornecido');
    }

    const verification = verifyOAuthState(state);
    if (!verification.valid) {
      return res.status(403).send('Link de autenticação inválido ou expirado.');
    }

    await handleCallback(code);
    return res.send('Autenticação com Melhor Envio concluída com sucesso! Pode fechar esta janela.');
  } catch (error) {
    console.error('[OAuth] callback Melhor Envio:', error.message);
    return res.status(500).send('Erro na autenticação. Tente novamente pelo painel admin.');
  }
}

module.exports = {
  startMelhorEnvioOAuth,
  loginMelhorEnvio,
  callbackMelhorEnvio,
};
