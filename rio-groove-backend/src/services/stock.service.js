const supabase = require('../lib/supabase');
const {
  buildOperationalStockItems,
  buildFocusOperationalStockItems,
  stockDedupKey,
  SEED_DEFAULTS,
  normalizeCategory,
  GENDER_NEUTRAL,
  FABRIC_NEUTRAL,
  categoryUsesFabric,
  classifyLegacyInvalidStockItem,
  isFocusOperationalStockItem
} = require('../config/inventory');
const { getBlankUnitCosts } = require('./insumoCosts.service');

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

/**
 * Decremento atômico via RPC `decrement_stock_if_available` (migration 18).
 * Fallback não-atômico se a RPC ainda não existir no Supabase.
 */
const decrementStockIfAvailable = async (id, quantity, reason) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error('Quantidade inválida para reserva de estoque.');
  }

  const { data, error } = await supabase.rpc('decrement_stock_if_available', {
    p_stock_id: id,
    p_quantity: qty,
  });

  if (error) {
    const missingRpc =
      error.code === 'PGRST202' ||
      /decrement_stock_if_available/i.test(error.message || '');

    if (missingRpc) {
      console.warn('[Stock] RPC decrement_stock_if_available ausente — usando fallback não-atômico.');
      return adjustStock(id, -qty, reason);
    }
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error('Estoque insuficiente para concluir a reserva.');
  }

  return row;
};

const incrementStock = async (id, quantity, reason) => {
  return adjustStock(id, quantity, reason);
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

  const itemsToInsert = buildOperationalStockItems(SEED_DEFAULTS, getBlankUnitCosts());

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

const YELLOW_STOCK_CATEGORIES = ['Camisa', 'Regata', 'Boné'];
const DEFAULT_YELLOW_QUANTITY = 10;

const syncYellowStockItems = async (quantity = DEFAULT_YELLOW_QUANTITY) => {
  const targetQty = Number(quantity);
  if (!Number.isInteger(targetQty) || targetQty < 0) {
    throw new Error('Quantidade inválida para sincronização do estoque amarelo.');
  }

  const yellowDefaults = {
    ...SEED_DEFAULTS,
    quantity: targetQty,
    min_stock: SEED_DEFAULTS.min_stock,
    is_active: true
  };

  const itemsToSync = buildOperationalStockItems(yellowDefaults, getBlankUnitCosts()).filter(
    (item) =>
      item.color_key === 'yel' &&
      YELLOW_STOCK_CATEGORIES.includes(normalizeCategory(item.category))
  );

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

  const newItems = itemsToSync
    .filter((item) => !existingSet.has(stockDedupKey(item)))
    .map((item) => {
      const cat = normalizeCategory(item.category);
      return {
        ...item,
        gender: item.gender || GENDER_NEUTRAL,
        fabric: item.fabric || (categoryUsesFabric(cat) ? 'Lisa' : FABRIC_NEUTRAL),
        quantity: targetQty
      };
    });

  const BATCH_SIZE = 200;
  for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
    const batch = newItems.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await supabase.from('stock_items').insert(batch);
    if (insertErr) throw insertErr;
  }

  const { data: updatedRows, error: updateErr } = await supabase
    .from('stock_items')
    .update({ quantity: targetQty })
    .eq('color_key', 'yel')
    .in('category', YELLOW_STOCK_CATEGORIES)
    .select('id');

  if (updateErr) throw updateErr;

  const message =
    newItems.length > 0
      ? `${newItems.length} SKUs amarelos criados e ${(updatedRows || []).length} itens ajustados para ${targetQty} un.`
      : `${(updatedRows || []).length} SKUs amarelos ajustados para ${targetQty} un.`;

  return {
    total_expected: itemsToSync.length,
    total_created: newItems.length,
    total_updated: (updatedRows || []).length,
    quantity: targetQty,
    categories: YELLOW_STOCK_CATEGORIES,
    sample_skus: itemsToSync.slice(0, 8).map((item) => item.sku),
    message
  };
};

/** Zera estoque operacional da cor White (color_key wht). Não afeta Off White (off). */
const zeroWhiteStockItems = async () => {
  const { data: beforeRows, error: beforeErr } = await supabase
    .from('stock_items')
    .select('id, sku, category, color_key, quantity')
    .eq('color_key', 'wht');

  if (beforeErr) {
    if (beforeErr.code === 'PGRST205') {
      throw new Error('Tabela stock_items não existe. Execute o script SQL no Supabase.');
    }
    throw beforeErr;
  }

  const rows = beforeRows || [];
  if (rows.length === 0) {
    return {
      total_matched: 0,
      total_updated: 0,
      previous_quantity: 0,
      message: 'Nenhum SKU White (wht) encontrado no estoque.',
    };
  }

  const previousQuantity = rows.reduce(
    (sum, row) => sum + Number(row.quantity ?? row.stock ?? 0),
    0
  );

  const { data: updatedRows, error: updateErr } = await supabase
    .from('stock_items')
    .update({ quantity: 0 })
    .eq('color_key', 'wht')
    .select('id, sku, category');

  if (updateErr) throw updateErr;

  const updated = updatedRows || [];
  return {
    total_matched: rows.length,
    total_updated: updated.length,
    previous_quantity: previousQuantity,
    sample_skus: updated.slice(0, 8).map((row) => row.sku),
    message: `${updated.length} SKUs White (wht) zerados (antes: ${previousQuantity} un. no total).`,
  };
};

/**
 * Mantém ativo apenas oversized + regata + cropped em preto/off white.
 * Demais SKUs: quantity = 0 e is_active = false (preserva linhas no admin).
 */
const applyFocusOperationalStock = async () => {
  const focusDefaults = {
    ...SEED_DEFAULTS,
    quantity: 0,
    is_active: true
  };

  const itemsToEnsure = buildFocusOperationalStockItems(focusDefaults, getBlankUnitCosts());

  const { data: existing, error: fetchErr } = await supabase
    .from('stock_items')
    .select('id, category, gender, model, fabric, color_key, size, quantity, sku');

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

  const newItems = itemsToEnsure
    .filter((item) => !existingSet.has(stockDedupKey(item)))
    .map((item) => {
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

  const rows = existing || [];
  const focusIds = [];
  const otherIds = [];

  for (const row of rows) {
    if (isFocusOperationalStockItem(row)) {
      focusIds.push(row.id);
    } else {
      otherIds.push(row.id);
    }
  }

  let deactivated = 0;
  for (let i = 0; i < otherIds.length; i += BATCH_SIZE) {
    const batch = otherIds.slice(i, i + BATCH_SIZE);
    const { data: updated, error: updateErr } = await supabase
      .from('stock_items')
      .update({ quantity: 0, is_active: false })
      .in('id', batch)
      .select('id');
    if (updateErr) throw updateErr;
    deactivated += (updated || []).length;
  }

  let activated = 0;
  for (let i = 0; i < focusIds.length; i += BATCH_SIZE) {
    const batch = focusIds.slice(i, i + BATCH_SIZE);
    const { data: updated, error: updateErr } = await supabase
      .from('stock_items')
      .update({ is_active: true })
      .in('id', batch)
      .select('id');
    if (updateErr) throw updateErr;
    activated += (updated || []).length;
  }

  const previousOtherQty = rows
    .filter((row) => !isFocusOperationalStockItem(row))
    .reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);

  const message =
    `${deactivated} SKUs zerados/desativados ` +
    `(${previousOtherQty} un. removidas do estoque ativo). ` +
    `${activated} SKUs foco mantidos ativos (preto/off white · oversized/regata/cropped). ` +
    `${newItems.length} SKUs foco criados se faltavam.`;

  return {
    total_existing: rows.length,
    focus_active: activated,
    other_zeroed: deactivated,
    focus_created: newItems.length,
    units_removed_from_other: previousOtherQty,
    focus_colors: ['blk', 'off'],
    focus_models: {
      oversized: ['Oversized Boxy', 'Oversized Tradicional', 'Oversized Feminina'],
      cropped: ['Boxy Cropped', 'Cropped Tradicional', 'Regata Cropped Boxy'],
      regata: ['Regular', 'Machão']
    },
    sample_focus_skus: itemsToEnsure.slice(0, 8).map((item) => item.sku),
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
  decrementStockIfAvailable,
  incrementStock,
  seedStockItems,
  syncYellowStockItems,
  zeroWhiteStockItems,
  applyFocusOperationalStock
};
