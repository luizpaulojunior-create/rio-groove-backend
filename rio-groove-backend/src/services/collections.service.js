const supabase = require('../lib/supabase');

async function getCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*, products(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function getCollectionBySlug(slug) {
  const { data, error } = await supabase
    .from('collections')
    .select('*, products(*)')
    .eq('slug', slug)
    .single();
  if (error) throw error;
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
