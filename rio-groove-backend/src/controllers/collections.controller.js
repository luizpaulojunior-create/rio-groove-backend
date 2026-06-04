const asyncHandler = require('../utils/asyncHandler');
const { resolveRequestAdmin } = require('../utils/resolve-request-admin');
const collectionsService = require('../services/collections.service');

const getAllCollections = asyncHandler(async (req, res) => {
  const admin = await resolveRequestAdmin(req);
  const collections = await collectionsService.getCollections(req.query, {
    includeInactive: Boolean(admin),
  });
  return res.json(collections);
});

const getCollection = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const collection = await collectionsService.getCollectionBySlug(slug);
  if (!collection) {
    return res.status(404).json({ message: 'Coleção não encontrada' });
  }

  const admin = await resolveRequestAdmin(req);
  if (collection.active === false && !admin) {
    return res.status(404).json({ message: 'Coleção não encontrada' });
  }

  return res.json(collection);
});

const createCollection = asyncHandler(async (req, res) => {
  const collection = await collectionsService.createCollection(req.body);
  return res.status(201).json(collection);
});

const updateCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const collection = await collectionsService.updateCollection(id, req.body);
  return res.json(collection);
});

const deleteCollection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await collectionsService.deleteCollection(id);
  return res.status(204).send();
});

module.exports = {
  getAllCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection
};
