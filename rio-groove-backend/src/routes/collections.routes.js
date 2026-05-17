const express = require('express');
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
router.post('/api/collections', createCollection);
router.put('/api/collections/:id', updateCollection);
router.delete('/api/collections/:id', deleteCollection);

module.exports = router;
