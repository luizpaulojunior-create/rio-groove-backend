const express = require('express');
const { getPublicConfig } = require('../controllers/config.controller');

const router = express.Router();

router.get('/api/config/public', getPublicConfig);

module.exports = router;
