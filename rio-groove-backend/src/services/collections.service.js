const supabase = require('../lib/supabase');

async function getCollections(query = {}, options = {}) {
  let req = supabase
    .from('collections')
    .select('*, products(count)')
    .order('created_at', { ascending: false });

  if (!options.includeInactive) {
    req = req.eq('active', true);
  } else if (query.active !== undefined) {
    const activeFilter = query.active === 'true' || query.active === true;
    req = req.eq('active', activeFilter);
  }

  const { data, error } = await req;
  if (error) throw error;
  return data;
}

async function getCollectionBySlug(slug) {
  const { data, error } = await supabase
    .from('collections')
    .select('*, products(*, product_images(*))')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  
  if (data && data.products) {
    data.products = data.products.filter(p => p.active !== false);
  }
  
  return data;
}

async function createCollection(collection) {
  const { data, error } = await supabase
    .from('collections')
    .insert(collection)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function updateCollection(id, updates) {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function deleteCollection(id) {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = {
  getCollections,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection
};
