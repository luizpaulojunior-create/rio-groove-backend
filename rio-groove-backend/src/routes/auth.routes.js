const express = require('express');
const { loginMelhorEnvio, callbackMelhorEnvio } = require('../controllers/auth.controller');
const { oauthLimiter } = require('../middlewares/rate-limit');

const router = express.Router();

// Legado: exige state assinado emitido por POST /api/auth/melhor-envio/start
router.get('/melhor-envio/login', oauthLimiter, loginMelhorEnvio);

// Callback público — Melhor Envio redireciona aqui; state valida origem
router.get('/melhor-envio/callback', oauthLimiter, callbackMelhorEnvio);

module.exports = router;
