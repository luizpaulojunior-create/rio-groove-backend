const express = require('express');
const requireAdminAuth = require('../middlewares/require-admin-auth');
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
router.post('/api/collections', requireAdminAuth, createCollection);
router.put('/api/collections/:id', requireAdminAuth, updateCollection);
router.delete('/api/collections/:id', requireAdminAuth, deleteCollection);

module.exports = router;
