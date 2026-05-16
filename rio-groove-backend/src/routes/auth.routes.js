const express = require('express');
const { loginMelhorEnvio, callbackMelhorEnvio } = require('../controllers/auth.controller');

const router = express.Router();

router.get('/melhor-envio/login', loginMelhorEnvio);
router.get('/melhor-envio/callback', callbackMelhorEnvio);

module.exports = router;
