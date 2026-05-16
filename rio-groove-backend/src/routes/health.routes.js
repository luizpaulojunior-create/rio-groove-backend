const express = require('express');
const { healthCheck } = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', healthCheck);
router.get('/api/health', healthCheck);

module.exports = router;
