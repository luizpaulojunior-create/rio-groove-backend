const supabase = require('../lib/supabase');
const {
  needsFulfillmentRepair,
  sanitizeOrderForResponse,
  buildOrderUpdatesFromFulfillment,
} = require('../utils/orderFulfillment');

async function repairOrderFulfillmentIfNeeded(order) {
  if (!order?.id || !needsFulfillmentRepair(order)) {
    return sanitizeOrderForResponse(order);
  }

  try {
    const updates = buildOrderUpdatesFromFulfillment('pagamento_aprovado', order);
    const repaired = await updateOrderById(order.id, updates);
    let result = repaired;

    if (!repaired.stock_deducted_at) {
      try {
        const { deductStockForOrder } = require('./stockCheckout.service');
        const items = order.order_items || (await getOrderItems(order.id));
        const orderWithItems = { ...repaired, items, order_items: items };
        await deductStockForOrder(orderWithItems, items || []);
        result = await updateOrderById(order.id, {
          stock_deducted_at: new Date().toISOString(),
        });
      } catch (stockError) {
        console.error('[OrdersService] Falha ao rebaixar estoque após reparo:', stockError.message);
      }
    }

    console.log('[OrdersService] fulfillment_status reparado automaticamente', {
      orderId: order.id,
      orderNumber: order.order_number,
      from: order.fulfillment_status,
      to: result.fulfillment_status,
    });
    return sanitizeOrderForResponse(result);
  } catch (error) {
    console.error('[OrdersService] Falha ao reparar fulfillment_status:', error.message);
    return sanitizeOrderForResponse(order);
  }
}

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

  let query = supabase.from('orders').select('*, order_items(*)').limit(1);

  if (/^[0-9a-fA-F-]{36}$/.test(ref)) {
    query = query.or(`id.eq.${ref},external_reference.eq.${ref},order_number.eq.${ref}`);
  } else {
    query = query.or(`external_reference.eq.${ref},order_number.eq.${ref}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function getOrderByMelhorEnvioShipmentId(shipmentId) {
  const id = String(shipmentId || '').trim();
  if (!id) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('melhor_envio_shipment_id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getOrders(options = {}) {
  const limit = options.limit || 200;
  const offset = options.offset || 0;
  const search = String(options.search || '').trim();

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    const term = search.replace(/[%_,]/g, '').trim();
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(
        [
          `order_number.ilike.${pattern}`,
          `customer_name.ilike.${pattern}`,
          `customer_email.ilike.${pattern}`,
          `external_reference.ilike.${pattern}`,
          `id.ilike.${pattern}`,
        ].join(','),
      );
    }
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  const orders = await Promise.all(
    (data || []).map(async (order) => {
      let items = [];
      try {
        items = await getOrderItems(order.id);
      } catch (itemsError) {
        console.error('[OrdersService] Falha ao carregar itens do pedido', {
          orderId: order.id,
          orderNumber: order.order_number,
          error: itemsError.message,
        });
      }
      return repairOrderFulfillmentIfNeeded({ ...order, order_items: items, items });
    }),
  );

  return { orders, total: count || 0 };
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

  const items = order.order_items || await getOrderItems(order.id);
  const sanitized = await repairOrderFulfillmentIfNeeded({ ...order, items, order_items: items });
  return sanitized;
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
  getOrders,
  createOrder,
  createOrderItems,
  deleteOrder,
  updateOrderById,
  updateOrderByExternalReference,
  getOrderByExternalReference,
  getOrderByReference,
  getOrderByMelhorEnvioShipmentId,
  getOrderItems,
  getOrderWithItems,
  registerWebhookEvent
};
