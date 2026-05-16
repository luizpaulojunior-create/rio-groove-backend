const { getAuthorizationUrl, handleCallback } = require('../services/melhorEnvioAuth.service');

async function loginMelhorEnvio(req, res) {
  try {
    const url = await getAuthorizationUrl();
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function callbackMelhorEnvio(req, res) {
  try {
    console.log('[MelhorEnvio OAuth] Query recebida:', req.query);
    const { code } = req.query;
    console.log('[MelhorEnvio OAuth] Authorization code:', code);

    if (!code) {
      return res.status(400).send('Código não fornecido');
    }
    await handleCallback(code);
    res.send('Autenticação com Melhor Envio concluída com sucesso! Pode fechar esta janela.');
  } catch (error) {
    res.status(500).send(`Erro na autenticação: ${error.message}`);
  }
}

module.exports = {
  loginMelhorEnvio,
  callbackMelhorEnvio
};
