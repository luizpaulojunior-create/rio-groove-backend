const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

const getStock = async () => {
  const { data, error } = await supabase.from('stock').select('*').order('created_at', { ascending: false });
  if (error) {
    if (error.code === 'PGRST205') {
       return []; // Tabela não existe ainda
    }
    throw error;
  }
  return data || [];
};

const getStockItem = async (id) => {
  const { data, error } = await supabase.from('stock').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

const createStockItem = async (stockData) => {
  const { data, error } = await supabase.from('stock').insert([stockData]).select('*').single();
  if (error) throw error;
  return data;
};

const updateStockItem = async (id, stockData) => {
  const { data, error } = await supabase.from('stock').update(stockData).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
};

const deleteStockItem = async (id) => {
  const { error } = await supabase.from('stock').delete().eq('id', id);
  if (error) throw error;
  return true;
};

const adjustStock = async (id, quantity, reason) => {
  const current = await getStockItem(id);
  const newQuantity = current.quantity + quantity;
  if (newQuantity < 0) throw new Error('Estoque não pode ficar negativo');
  
  const { data, error } = await supabase.from('stock').update({ quantity: newQuantity }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
};

module.exports = {
  getStock,
  getStockItem,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  adjustStock
};
