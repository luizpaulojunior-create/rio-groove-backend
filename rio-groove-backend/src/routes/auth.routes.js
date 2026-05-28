const express = require('express');
const { loginMelhorEnvio, callbackMelhorEnvio } = require('../controllers/auth.controller');

const router = express.Router();

// Legado: exige state assinado emitido por POST /api/auth/melhor-envio/start
router.get('/melhor-envio/login', loginMelhorEnvio);

// Callback público — Melhor Envio redireciona aqui; state valida origem
router.get('/melhor-envio/callback', callbackMelhorEnvio);

module.exports = router;
