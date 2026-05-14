const supabase = require('../lib/supabase');

async function createOrder({ order }) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function createOrderItems(items) {
  if (!items.length) return [];

  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select('*');

  if (error) throw error;
  return data || [];
}

async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
}

async function updateOrderById(orderId, updates) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function updateOrderByExternalReference(externalReference, updates) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('external_reference', externalReference)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function getOrderByExternalReference(externalReference) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('external_reference', externalReference)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getOrderByReference(reference) {
  const ref = String(reference || '').trim();
  if (!ref) return null;

  let query = supabase.from('orders').select('*').limit(1);

  if (/^[0-9a-fA-F-]{36}$/.test(ref)) {
    query = query.or(`id.eq.${ref},external_reference.eq.${ref},order_number.eq.${ref}`);
  } else {
    query = query.or(`external_reference.eq.${ref},order_number.eq.${ref}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function getOrderItems(orderId) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function getOrderWithItems(reference) {
  const order = await getOrderByReference(reference);
  if (!order) return null;

  const items = await getOrderItems(order.id);
  return { ...order, items };
}

async function registerWebhookEvent({ provider, topic, action, resourceId, payload }) {
  const { data, error } = await supabase
    .from('webhook_events')
    .upsert({
      provider,
      topic,
      action,
      resource_id: String(resourceId || ''),
      payload,
      processed_at: new Date().toISOString()
    }, { onConflict: 'provider,topic,resource_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  createOrder,
  createOrderItems,
  deleteOrder,
  updateOrderById,
  updateOrderByExternalReference,
  getOrderByExternalReference,
  getOrderByReference,
  getOrderItems,
  getOrderWithItems,
  registerWebhookEvent
};
