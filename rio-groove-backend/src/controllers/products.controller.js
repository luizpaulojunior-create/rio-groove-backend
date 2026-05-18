const asyncHandler = require('../utils/asyncHandler');
const productsService = require('../services/products.service');
const uploadService = require('../services/upload.service');

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await productsService.getProducts(req.query);
  return res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await productsService.getProductBySlug(slug);
  if (!product) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
  return res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  try {
    let productData = { ...req.body };
    
    // Parse FormData types
    if (productData.price !== undefined && productData.price !== '') productData.price = parseFloat(productData.price);
    if (productData.stock !== undefined && productData.stock !== '') productData.stock = parseInt(productData.stock, 10);
    if (productData.active !== undefined) productData.active = productData.active === 'true';

    if (!productData.slug && productData.name) {
      productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (req.file) {
      const publicUrl = await uploadService.uploadImage(req.file, 'product-images');
      productData.image_url = publicUrl;
    }

    const product = await productsService.createProduct(productData);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao criar produto' });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    let productData = { ...req.body };
    
    // Parse FormData types
    if (productData.price !== undefined && productData.price !== '') productData.price = parseFloat(productData.price);
    if (productData.stock !== undefined && productData.stock !== '') productData.stock = parseInt(productData.stock, 10);
    if (productData.active !== undefined) productData.active = productData.active === 'true';

    if (productData.name && !productData.slug) {
      productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (req.file) {
      const publicUrl = await uploadService.uploadImage(req.file, 'product-images');
      productData.image_url = publicUrl;
    }

    const product = await productsService.updateProduct(id, productData);
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao atualizar produto' });
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productsService.deleteProduct(id);
  return res.status(204).send();
});

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
