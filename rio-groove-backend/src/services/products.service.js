const supabase = require('../lib/supabase');

async function getProducts(query = {}) {
  let req = supabase.from('products').select('*, collections(name), product_images(*)').order('created_at', { ascending: false });
  
  if (query.active !== undefined) {
    const isActive = query.active === 'true' || query.active === true;
    req = req.eq('active', isActive);
  }
  
  const { data, error } = await req;
  if (error) throw error;
  return data;
}

async function getProductById(id) {
  const { data, error } = await supabase.from('products').select('*, collections(name), product_images(*)').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function getProductBySlug(slug) {
  const { data, error } = await supabase.from('products').select('*, collections(name), product_images(*)').eq('slug', slug).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function createProduct(productData) {
  const { images, ...product } = productData;
  const { data, error } = await supabase.from('products').insert(product).select('*').single();
  if (error) {
    const errorObj = new Error(error.message);
    errorObj.response = { data: { error: error.message } };
    throw errorObj;
  }
  
  if (images && images.length > 0) {
    const imagesToInsert = images.map((img, index) => ({
      image_url: img.image_url,
      alt_text: img.alt_text,
      color_variant: img.color_variant,
      product_id: data.id,
      sort_order: img.sort_order ?? index
    }));
    await supabase.from('product_images').insert(imagesToInsert);
  }
  
  return data;
}

async function updateProduct(id, updates) {
  const { images, ...productUpdates } = updates;
  const { data, error } = await supabase.from('products').update(productUpdates).eq('id', id).select('*').single();
  if (error) {
    const errorObj = new Error(error.message);
    errorObj.response = { data: { error: error.message } };
    throw errorObj;
  }

  if (images !== undefined) {
    await supabase.from('product_images').delete().eq('product_id', id);
    if (images.length > 0) {
      const imagesToInsert = images.map((img, index) => ({
        image_url: img.image_url,
        alt_text: img.alt_text,
        color_variant: img.color_variant,
        product_id: id,
        sort_order: img.sort_order ?? index
      }));
      await supabase.from('product_images').insert(imagesToInsert);
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
