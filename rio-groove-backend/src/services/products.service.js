const supabase = require('../lib/supabase');

function mapColorKeyFromVariant(colorVariant) {
  if (!colorVariant) return null;
  const norm = String(colorVariant).trim().toLowerCase();
  const compact = norm.replace(/\s+/g, '');
  if (norm === 'preto' || norm === 'black') return 'blk';
  if (norm === 'branco' || norm === 'white') return 'wht';
  if (norm === 'off white' || compact === 'offwhite' || compact === 'off') return 'off';
  if (norm === 'vermelho' || norm === 'red') return 'red';
  if (norm === 'verde' || norm === 'green') return 'grn';
  return null;
}

function mapColorKeyToVariant(colorKey) {
  if (!colorKey) return null;
  const k = String(colorKey).trim().toLowerCase();
  const map = {
    blk: 'Preto',
    wht: 'Branco',
    off: 'Off White',
    grn: 'Verde',
    red: 'Vermelho',
  };
  return map[k] || null;
}

function normalizeColorVariantLabel(value) {
  if (!value) return null;
  const norm = String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  const map = {
    preto: 'Preto',
    black: 'Preto',
    branco: 'Branco',
    white: 'Branco',
    'off white': 'Off White',
    offwhite: 'Off White',
    vermelho: 'Vermelho',
    verde: 'Verde',
  };
  return map[norm] || String(value).trim();
}

const SEO_FIELDS = ['meta_title', 'meta_description', 'seo_keywords', 'og_image'];

function attachSeoFields(target, source) {
  for (const field of SEO_FIELDS) {
    if (source[field] !== undefined) {
      target[field] = source[field] || null;
    }
  }
  return target;
}

function omitSeoFields(data) {
  const next = { ...data };
  for (const field of SEO_FIELDS) {
    delete next[field];
  }
  return next;
}

function isMissingSeoColumnError(error) {
  const msg = String(error?.message || '');
  return SEO_FIELDS.some((field) => msg.includes(field) && msg.includes('schema cache'));
}

function buildImageRow(img, productId, index) {
  const colorVariant =
    normalizeColorVariantLabel(img.color_variant || img.colorVariant) ||
    mapColorKeyToVariant(img.color_key) ||
    normalizeColorVariantLabel(img.color_label);

  return {
    image_url: img.image_url || img.url || img.preview,
    alt_text: img.alt_text || '',
    color_variant: colorVariant || null,
    product_id: productId,
    sort_order: img.sort_order ?? img.position ?? index,
  };
}

async function getProducts(query = {}) {
  let req = supabase.from('products').select('*, collections(name), product_images(*), product_variants(*)').order('created_at', { ascending: false });

  const activeFilter =
    query.active !== undefined
      ? query.active === 'true' || query.active === true
      : true;
  req = req.eq('active', activeFilter);
  
  const { data, error } = await req;
  if (error) throw error;
  return data;
}

async function getProductById(id) {
  const { data, error } = await supabase.from('products').select('*, collections(name), product_images(*), product_variants(*)').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function getProductBySlug(slug) {
  const { data, error } = await supabase.from('products').select('*, collections(name), product_images(*), product_variants(*)').eq('slug', slug).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function createProduct(productData) {
  const { images, variants } = productData;

  const cleanData = {
    name: productData.name,
    slug: productData.slug,
    description: productData.description,
    shortDescription: productData.shortDescription,
    price: productData.price,
    stock: productData.stock,
    category: productData.category,
    active: productData.active,
    collection_id: productData.collection_id,
    collections: productData.collections,
    colors: productData.colors || [],
    fabric_appearances: productData.fabric_appearances || [],
    tags: productData.tags || ['insumo:Camisa', 'model:Oversized Tradicional'],
    image_url: productData.image_url || null,
  };
  attachSeoFields(cleanData, productData);

  console.log(cleanData);
  console.log(Object.keys(cleanData));

  let { data, error } = await supabase.from('products').insert(cleanData).select('*').single();
  if (error && isMissingSeoColumnError(error)) {
    console.warn('[products.service] Colunas SEO ausentes — salvando sem SEO. Rode supabase/03_product_seo_columns.sql');
    ({ data, error } = await supabase.from('products').insert(omitSeoFields(cleanData)).select('*').single());
  }
  if (error) {
    const errorObj = new Error(error.message);
    errorObj.response = { data: { error: error.message } };
    throw errorObj;
  }
  
  if (images && images.length > 0) {
    const imagesToInsert = images.map((img, index) => buildImageRow(img, data.id, index));
    await supabase.from('product_images').insert(imagesToInsert);
  }

  if (variants && variants.length > 0) {
    const variantsToInsert = variants.map(v => ({
      product_id: data.id,
      color: v.color,
      size: v.size,
      sku: v.sku,
      stock: v.stock || 0,
      price_override: v.price_override || null,
      status: v.status || 'active'
    }));
    await supabase.from('product_variants').insert(variantsToInsert);
  }
  
  return data;
}

async function updateProduct(id, updates) {
  const { images, variants } = updates;

  const cleanData = {
    name: updates.name,
    slug: updates.slug,
    description: updates.description,
    shortDescription: updates.shortDescription,
    price: updates.price,
    stock: updates.stock,
    category: updates.category,
    active: updates.active,
    collection_id: updates.collection_id,
    collections: updates.collections,
    colors: updates.colors,
    fabric_appearances: updates.fabric_appearances,
    tags: updates.tags,
    image_url: updates.image_url,
  };
  attachSeoFields(cleanData, updates);

  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });

  let { data, error } = await supabase.from('products').update(cleanData).eq('id', id).select('*').single();
  if (error && isMissingSeoColumnError(error)) {
    console.warn('[products.service] Colunas SEO ausentes — atualizando sem SEO. Rode supabase/03_product_seo_columns.sql');
    ({ data, error } = await supabase.from('products').update(omitSeoFields(cleanData)).eq('id', id).select('*').single());
  }
  if (error) {
    const errorObj = new Error(error.message);
    errorObj.response = { data: { error: error.message } };
    throw errorObj;
  }

  if (images !== undefined) {
    await supabase.from('product_images').delete().eq('product_id', id);
    if (images.length > 0) {
      const imagesToInsert = images.map((img, index) => buildImageRow(img, id, index));
      await supabase.from('product_images').insert(imagesToInsert);
    }
  }

  if (variants !== undefined) {
    await supabase.from('product_variants').delete().eq('product_id', id);
    if (variants.length > 0) {
      const variantsToInsert = variants.map(v => ({
        product_id: id,
        color: v.color,
        size: v.size,
        sku: v.sku,
        stock: v.stock || 0,
        price_override: v.price_override || null,
        status: v.status || 'active'
      }));
      await supabase.from('product_variants').insert(variantsToInsert);
    }
  }

  return data;
}

async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = { getProducts, getProductById, getProductBySlug, createProduct, updateProduct, deleteProduct };
