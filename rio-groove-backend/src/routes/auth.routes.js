const express = require('express');
const { loginMelhorEnvio, callbackMelhorEnvio } = require('../controllers/auth.controller');

const router = express.Router();

// OAuth via redirect de browser — não envia Bearer; callback permanece público (Melhor Envio)
router.get('/melhor-envio/login', loginMelhorEnvio);
router.get('/melhor-envio/callback', callbackMelhorEnvio);

module.exports = router;
