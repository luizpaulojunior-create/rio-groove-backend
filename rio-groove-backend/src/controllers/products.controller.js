const asyncHandler = require('../utils/asyncHandler');
const productsService = require('../services/products.service');

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
    const product = await productsService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Erro ao criar produto' });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productsService.updateProduct(id, req.body);
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
