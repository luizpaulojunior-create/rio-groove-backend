const express = require('express');
const multer = require('multer');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/api/products', getAllProducts);
router.get('/api/products/:slug', getProduct);
router.post('/api/products', upload.single('image'), createProduct);
router.put('/api/products/:id', upload.single('image'), updateProduct);
router.delete('/api/products/:id', deleteProduct);

module.exports = router;
