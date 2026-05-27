const express = require('express');
const { healthCheck } = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', (req, res, next) => {
  healthCheck(req, res).catch(next);
});
router.get('/api/health', (req, res, next) => {
  healthCheck(req, res).catch(next);
});

module.exports = router;
