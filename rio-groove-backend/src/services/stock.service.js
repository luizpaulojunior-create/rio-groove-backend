const supabase = require('../lib/supabase');
const {
  buildOperationalStockItems,
  stockDedupKey,
  SEED_DEFAULTS,
  normalizeCategory,
  GENDER_NEUTRAL,
  FABRIC_NEUTRAL,
  categoryUsesFabric,
  classifyLegacyInvalidStockItem
} = require('../config/inventory');

const getStock = async () => {
  const { data, error } = await supabase.from('stock_items').select('*').order('created_at', { ascending: false });
  if (error) {
    if (error.code === 'PGRST205') {
       return [];
    }
    throw error;
  }
  return data || [];
};

const getStockItem = async (id) => {
  const { data, error } = await supabase.from('stock_items').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

const createStockItem = async (stockData) => {
  const payload = {
    category: normalizeCategory(stockData.category),
    gender: Object.prototype.hasOwnProperty.call(stockData, 'gender')
      ? stockData.gender
      : 'Masculino',
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
  if (payload.category) {
    payload.category = normalizeCategory(payload.category);
  }
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
  delete payload.images;
  delete payload.stock_images;
  
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

const cleanupLegacyInvalidStockItems = async () => {
  const { data: rows, error: fetchErr } = await supabase
    .from('stock_items')
    .select('id, category, sku, model');

  if (fetchErr) {
    if (fetchErr.code === 'PGRST205') {
      return { removed: { accessory: 0, invalid_bone: 0, invalid_mug: 0, total: 0 } };
    }
    throw fetchErr;
  }

  const removed = { accessory: 0, invalid_bone: 0, invalid_mug: 0, total: 0 };
  const idsToDelete = [];

  for (const row of rows || []) {
    const kind = classifyLegacyInvalidStockItem(row);
    if (kind) {
      idsToDelete.push(row.id);
      removed[kind] += 1;
      removed.total += 1;
    }
  }

  const BATCH_SIZE = 200;
  for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + BATCH_SIZE);
    const { error: deleteErr } = await supabase.from('stock_items').delete().in('id', batch);
    if (deleteErr) throw deleteErr;
  }

  return { removed };
};

const seedStockItems = async () => {
  const { error: migrateErr } = await supabase
    .from('stock_items')
    .update({ category: 'Camisa' })
    .eq('category', 'Camiseta');

  if (migrateErr && migrateErr.code !== 'PGRST205') {
    throw migrateErr;
  }

  const cleanup = await cleanupLegacyInvalidStockItems();

  const itemsToInsert = buildOperationalStockItems(SEED_DEFAULTS);

  const { data: existing, error: fetchErr } = await supabase
    .from('stock_items')
    .select('category, gender, model, fabric, color_key, size');

  if (fetchErr) {
    if (fetchErr.code === 'PGRST205') {
      throw new Error('Tabela stock_items não existe. Execute o script SQL no Supabase.');
    }
    throw fetchErr;
  }

  const existingSet = new Set(
    (existing || []).map((row) =>
      stockDedupKey({
        category: normalizeCategory(row.category),
        gender: row.gender,
        model: row.model,
        fabric: row.fabric,
        color_key: row.color_key,
        size: row.size
      })
    )
  );

  const newItems = itemsToInsert.filter(
    (item) => !existingSet.has(stockDedupKey(item))
  ).map((item) => {
    const cat = normalizeCategory(item.category);
    return {
      ...item,
      gender: item.gender || GENDER_NEUTRAL,
      fabric: item.fabric || (categoryUsesFabric(cat) ? 'Lisa' : FABRIC_NEUTRAL)
    };
  });

  const BATCH_SIZE = 200;
  for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
    const batch = newItems.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await supabase.from('stock_items').insert(batch);
    if (insertErr) throw insertErr;
  }

  const skuSet = new Set(itemsToInsert.map((item) => item.sku));
  if (skuSet.size !== itemsToInsert.length) {
    throw new Error('Colisão de SKU detectada na grade operacional base.');
  }

  let message = '';
  if (newItems.length === itemsToInsert.length) {
    message = `${newItems.length} itens criados com sucesso (grade operacional completa).`;
  } else if (newItems.length > 0) {
    message = `${newItems.length} novos itens adicionados. ${itemsToInsert.length - newItems.length} já existiam.`;
  } else {
    message = `Grade operacional completa: todos os ${itemsToInsert.length} itens já existiam.`;
  }

  if (cleanup.removed.total > 0) {
    message = `${cleanup.removed.total} itens legados removidos. ${message}`;
  }

  return {
    total_expected: itemsToInsert.length,
    total_created: newItems.length,
    already_existed: itemsToInsert.length - newItems.length,
    removed: cleanup.removed,
    sample_skus: itemsToInsert.slice(0, 8).map((item) => item.sku),
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
