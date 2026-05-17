const express = require('express');
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');

const router = express.Router();

router.get('/api/products', getAllProducts);
router.post('/api/products', createProduct);
router.put('/api/products/:id', updateProduct);
router.delete('/api/products/:id', deleteProduct);

module.exports = router;
