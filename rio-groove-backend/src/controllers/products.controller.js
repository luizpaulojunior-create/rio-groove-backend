const asyncHandler = require('../utils/asyncHandler');
const productsService = require('../services/products.service');

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await productsService.getProducts();
  return res.json(products);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.body);
  return res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productsService.updateProduct(id, req.body);
  return res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productsService.deleteProduct(id);
  return res.status(204).send();
});

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
