const asyncHandler = require('../utils/asyncHandler');
const productsService = require('../services/products.service');
const uploadService = require('../services/upload.service');
const { STORAGE_BUCKET, STORAGE_PATHS } = require('../config/storage');

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseNewImageMeta(raw) {
  const parsed = parseJsonField(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function resolveCoverImageUrl(images) {
  if (!images?.length) return null;
  const main = images.find((img) => img.isMain);
  const first = main || images[0];
  return first.image_url || first.url || first.preview || null;
}

function sortImagesForSave(images) {
  return [...images].sort(
    (a, b) => (a.sort_order ?? a.position ?? 0) - (b.sort_order ?? b.position ?? 0)
  );
}

async function appendUploadedImages(images, files, fileMeta, productName) {
  if (!files?.length) return images;

  for (let i = 0; i < files.length; i++) {
    const meta = fileMeta[i] || {};
    const publicUrl = await uploadService.uploadImage(files[i], STORAGE_BUCKET, STORAGE_PATHS.PRODUCTS);
    images.push({
      image_url: publicUrl,
      alt_text: productName || '',
      color_key: meta.color_key || undefined,
      sort_order: meta.sort_order ?? images.length,
      isMain: Boolean(meta.isMain),
    });
  }

  return images;
}

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await productsService.getProducts(req.query);
  return res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slug);
  
  let product;
  if (isUUID) {
    product = await productsService.getProductById(slug);
  } else {
    product = await productsService.getProductBySlug(slug);
  }

  if (!product) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
  return res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  console.log('--- CREATE PRODUCT ---');
  console.log('REQ.BODY:', req.body);
  console.log('REQ.FILES:', req.files);
  console.log('REQ.FILES LENGTH:', req.files?.length);

  try {
    let productData = { ...req.body };
    
    // Parse FormData types
    if (productData.price !== undefined && productData.price !== '') productData.price = parseFloat(productData.price);
    if (productData.stock !== undefined && productData.stock !== '') productData.stock = parseInt(productData.stock, 10);
    if (productData.active !== undefined) productData.active = productData.active === 'true';
    if (productData.collections && typeof productData.collections === 'string') {
      try { productData.collections = JSON.parse(productData.collections); } catch(e) { productData.collections = productData.collections.split(',').map(s=>s.trim()).filter(Boolean); }
    }

    if (!productData.slug && productData.name) {
      productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (productData.colors && typeof productData.colors === 'string') {
      try { productData.colors = JSON.parse(productData.colors); } catch(e) { productData.colors = []; }
    }

    if (productData.fabric_appearances && typeof productData.fabric_appearances === 'string') {
      try { productData.fabric_appearances = JSON.parse(productData.fabric_appearances); } catch(e) { productData.fabric_appearances = []; }
    }

    if (productData.variants && typeof productData.variants === 'string') {
      try { productData.variants = JSON.parse(productData.variants); } catch(e) { productData.variants = []; }
    }

    if (productData.tags && typeof productData.tags === 'string') {
      try { productData.tags = JSON.parse(productData.tags); } catch(e) { productData.tags = ['insumo:Camisa', 'model:Oversized Tradicional']; }
    }
    if (!Array.isArray(productData.tags) || productData.tags.length === 0) {
      productData.tags = ['insumo:Camisa', 'model:Oversized Tradicional'];
    }

    const fileMeta = parseNewImageMeta(productData.new_image_meta);
    delete productData.new_image_meta;

    // Fase 1: products.stock legado — não recalcular a partir de variantes.

    // Apenas campos que existem no DB
    const allowedFields = ['name', 'slug', 'description', 'shortDescription', 'price', 'stock', 'category', 'active', 'collection_id', 'existing_images', 'collections', 'colors', 'fabric_appearances', 'variants', 'tags', 'meta_title', 'meta_description', 'seo_keywords', 'og_image', 'image_url'];
    Object.keys(productData).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete productData[key];
      }
    });

    if (productData.collection_id === '') {
      productData.collection_id = null;
    }

    let images = [];
    
    if (productData.existing_images) {
      if (Array.isArray(productData.existing_images)) {
        images = productData.existing_images.map(img => typeof img === 'string' ? JSON.parse(img) : img);
      } else {
        images = [JSON.parse(productData.existing_images)];
      }
    }

    if (req.files && req.files.length > 0) {
      await appendUploadedImages(images, req.files, fileMeta, productData.name);
    }

    productData.images = sortImagesForSave(images);

    if (productData.images.length > 0) {
      productData.image_url = resolveCoverImageUrl(productData.images);
    }
    
    delete productData.existing_images;

    const product = await productsService.createProduct(productData);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao criar produto' });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('--- UPDATE PRODUCT ---');
  console.log('REQ.BODY:', req.body);
  console.log('REQ.FILES:', req.files);
  console.log('REQ.FILES LENGTH:', req.files?.length);

  try {
    let productData = { ...req.body };
    
    // Parse FormData types
    if (productData.price !== undefined && productData.price !== '') productData.price = parseFloat(productData.price);
    if (productData.stock !== undefined && productData.stock !== '') productData.stock = parseInt(productData.stock, 10);
    if (productData.active !== undefined) productData.active = productData.active === 'true';
    if (productData.collections && typeof productData.collections === 'string') {
      try { productData.collections = JSON.parse(productData.collections); } catch(e) { productData.collections = productData.collections.split(',').map(s=>s.trim()).filter(Boolean); }
    }

    if (productData.name && !productData.slug) {
      productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (productData.colors && typeof productData.colors === 'string') {
      try { productData.colors = JSON.parse(productData.colors); } catch(e) { productData.colors = []; }
    }

    if (productData.fabric_appearances && typeof productData.fabric_appearances === 'string') {
      try { productData.fabric_appearances = JSON.parse(productData.fabric_appearances); } catch(e) { productData.fabric_appearances = []; }
    }

    if (productData.variants && typeof productData.variants === 'string') {
      try { productData.variants = JSON.parse(productData.variants); } catch(e) { productData.variants = []; }
    }

    if (productData.tags && typeof productData.tags === 'string') {
      try { productData.tags = JSON.parse(productData.tags); } catch(e) { productData.tags = null; }
    }

    const fileMeta = parseNewImageMeta(productData.new_image_meta);
    delete productData.new_image_meta;
    delete productData.images_updated;

    // Fase 1: products.stock legado — não recalcular a partir de variantes.

    // Apenas campos que existem no DB
    const allowedFields = ['name', 'slug', 'description', 'shortDescription', 'price', 'stock', 'category', 'active', 'collection_id', 'existing_images', 'collections', 'colors', 'fabric_appearances', 'variants', 'tags', 'meta_title', 'meta_description', 'seo_keywords', 'og_image', 'image_url'];
    Object.keys(productData).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete productData[key];
      }
    });

    if (productData.collection_id === '') {
      productData.collection_id = null;
    }

    if (req.body.images_updated === 'true') {
      let images = [];
      
      if (productData.existing_images) {
        if (Array.isArray(productData.existing_images)) {
          images = productData.existing_images.map(img => typeof img === 'string' ? JSON.parse(img) : img);
        } else {
          images = [JSON.parse(productData.existing_images)];
        }
      }

      if (req.files && req.files.length > 0) {
        await appendUploadedImages(images, req.files, fileMeta, productData.name);
      }

      productData.images = sortImagesForSave(images);

      if (productData.images.length > 0) {
        productData.image_url = resolveCoverImageUrl(productData.images);
      }
    }
    
    delete productData.existing_images;

    const product = await productsService.updateProduct(id, productData);
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao atualizar produto' });
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
