const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const {
  getAllCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection
} = require('../controllers/collections.controller');

const router = express.Router();

router.get('/api/collections', getAllCollections);
router.get('/api/collections/:slug', getCollection);
router.post('/api/collections', requireAdminAuth, requireMinRole('editor'), createCollection);
router.put('/api/collections/:id', requireAdminAuth, requireMinRole('editor'), updateCollection);
router.delete('/api/collections/:id', requireAdminAuth, requireMinRole('editor'), deleteCollection);

module.exports = router;
