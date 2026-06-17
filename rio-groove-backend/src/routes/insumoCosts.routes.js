const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const {
  getInsumoCosts,
  updateInsumoCosts,
} = require('../controllers/insumoCosts.controller');

const router = express.Router();

router.get('/api/insumo-costs', requireAdminAuth, getInsumoCosts);
router.put('/api/insumo-costs', requireAdminAuth, requireMinRole('editor'), updateInsumoCosts);

module.exports = router;
