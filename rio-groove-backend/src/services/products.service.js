const supabase = require('../lib/supabase');

async function getProducts() {
  const { data, error } = await supabase.from('products').select('*, collections(name)').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert(product).select('*').single();
  if (error) throw error;
  return data;
}

async function updateProduct(id, updates) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
