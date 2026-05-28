const express = require('express');
const { imageUpload } = require('../config/upload');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');

const router = express.Router();
const upload = imageUpload;

router.get('/api/products', getAllProducts);
router.get('/api/products/:slug', getProduct);
router.post('/api/products', requireAdminAuth, requireMinRole('editor'), upload.array('images'), createProduct);
router.put('/api/products/:id', requireAdminAuth, requireMinRole('editor'), upload.array('images'), updateProduct);
router.delete('/api/products/:id', requireAdminAuth, requireMinRole('editor'), deleteProduct);

module.exports = router;
