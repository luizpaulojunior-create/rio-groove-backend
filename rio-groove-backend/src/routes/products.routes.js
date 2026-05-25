const express = require('express');
const multer = require('multer');
const requireAdminAuth = require('../middlewares/require-admin-auth');
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
router.post('/api/products', requireAdminAuth, upload.array('images'), createProduct);
router.put('/api/products/:id', requireAdminAuth, upload.array('images'), updateProduct);
router.delete('/api/products/:id', requireAdminAuth, deleteProduct);

module.exports = router;
