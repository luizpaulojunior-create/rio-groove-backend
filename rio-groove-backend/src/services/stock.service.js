const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

const getStock = async () => {
  const { data, error } = await supabase.from('stock_items').select('*, stock_images(*)').order('created_at', { ascending: false });
  if (error) {
    if (error.code === 'PGRST205') {
       return []; // Tabela não existe ainda
    }
    throw error;
  }
  return data || [];
};

const getStockItem = async (id) => {
  const { data, error } = await supabase.from('stock_items').select('*, stock_images(*)').eq('id', id).single();
  if (error) throw error;
  return data;
};

const createStockItem = async (stockData) => {
  const payload = {
    category: stockData.category,
    gender: stockData.gender || 'Masculino',
    model: stockData.model,
    fabric: stockData.fabric || 'Lisa',
    color_key: stockData.color_key,
    color_label: stockData.color_label,
    color_hex: stockData.color_hex,
    size: stockData.size,
    quantity: stockData.quantity !== undefined ? stockData.quantity : stockData.stock,
    min_stock: stockData.min_stock,
    unit_cost: stockData.unit_cost !== undefined ? stockData.unit_cost : stockData.cost,
    sku: stockData.sku,
    is_active: stockData.is_active !== undefined ? stockData.is_active : (stockData.active !== undefined ? stockData.active : true)
  };
  const { data, error } = await supabase.from('stock_items').insert([payload]).select('*').single();
  if (error) throw error;
  return data;
};

const updateStockItem = async (id, stockData) => {
  const payload = { ...stockData };
  if (payload.stock !== undefined) {
    payload.quantity = payload.stock;
    delete payload.stock;
  }
  if (payload.cost !== undefined) {
    payload.unit_cost = payload.cost;
    delete payload.cost;
  }
  if (payload.active !== undefined) {
    payload.is_active = payload.active;
    delete payload.active;
  }
  const { data, error } = await supabase.from('stock_items').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
};

const deleteStockItem = async (id) => {
  const { error } = await supabase.from('stock_items').delete().eq('id', id);
  if (error) throw error;
  return true;
};

const adjustStock = async (id, quantity, reason) => {
  const current = await getStockItem(id);
  const currentQuantity = current.quantity !== undefined ? current.quantity : current.stock;
  const newQuantity = currentQuantity + quantity;
  if (newQuantity < 0) throw new Error('Estoque não pode ficar negativo');
  
  const { data, error } = await supabase.from('stock_items').update({ quantity: newQuantity }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
};

const seedStockItems = async () => {
  const category = 'Camiseta';
  const model = 'Oversized';
  const gender = 'Masculino';
  const fabric = 'Lisa';
  const colors = [
    { key: 'blk', label: 'Preto', hex: '#000000' },
    { key: 'wht', label: 'Branco', hex: '#FFFFFF' },
    { key: 'off', label: 'Off White', hex: '#F5F1E8' }
  ];
  const sizes = ['P', 'M', 'G', 'GG'];
  const defaultCost = 42.00;
  const defaultStock = 10;
  const defaultMinStock = 5;

  const itemsToInsert = [];

  for (const color of colors) {
    for (const size of sizes) {
      const sku = `OVR-${color.key.toUpperCase()}-${size}-LS`;
      itemsToInsert.push({
        category,
        gender,
        fabric,
        model,
        color_key: color.key,
        color_label: color.label,
        color_hex: color.hex,
        size,
        unit_cost: defaultCost,
        quantity: defaultStock,
        min_stock: defaultMinStock,
        sku,
        is_active: true
      });
    }
  }

  // Check existing
  const { data: existing, error: fetchErr } = await supabase.from('stock_items').select('model, color_key, size');
  if (fetchErr) {
    if (fetchErr.code === 'PGRST205') {
      throw new Error('Tabela stock_items não existe. Execute o script SQL no Supabase.');
    }
    throw fetchErr;
  }

  const existingSet = new Set(existing.map(e => `${e.model}-${e.color_key}-${e.size}`));
  const newItems = itemsToInsert.filter(item => !existingSet.has(`${item.model}-${item.color_key}-${item.size}`));

  if (newItems.length > 0) {
    const { error: insertErr } = await supabase.from('stock_items').insert(newItems);
    if (insertErr) throw insertErr;
  }

  let message = '';
  if (newItems.length === itemsToInsert.length) {
    message = `${itemsToInsert.length} itens criados com sucesso`;
  } else if (newItems.length > 0) {
    message = `${newItems.length} novos itens adicionados\n${itemsToInsert.length - newItems.length} já existiam`;
  } else {
    message = `Todos os ${itemsToInsert.length} itens já existiam`;
  }

  return {
    total_created: newItems.length,
    already_existed: itemsToInsert.length - newItems.length,
    message
  };
};

module.exports = {
  getStock,
  getStockItem,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  adjustStock,
  seedStockItems
};
