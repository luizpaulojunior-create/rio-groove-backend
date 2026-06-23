const FULFILLMENT_STATUSES = new Set([
  'aguardando_pagamento',
  'pagamento_aprovado',
  'estoque_reservado',
  'aguardando_producao',
  'em_producao',
  'producao_concluida',
  'preparando_envio',
  'etiqueta_gerada',
  'postado',
  'em_transito',
  'saiu_para_entrega',
  'entregue',
  'cancelado',
]);

const DB_TO_FULFILLMENT = {
  created: 'aguardando_pagamento',
  awaiting_payment: 'aguardando_pagamento',
  awaiting_capture: 'aguardando_pagamento',
  paid: 'pagamento_aprovado',
  payment_failed: 'cancelado',
  cancelled: 'cancelado',
  refunded: 'cancelado',
  fulfilled: 'entregue',
};

function isOrderPaid(order) {
  if (!order) return false;
  const paymentStatus = String(order.payment_status || '').toLowerCase();
  const orderStatus = String(order.status || '').toLowerCase();
  return (
    paymentStatus === 'paid' ||
    paymentStatus === 'approved' ||
    Boolean(order.paid_at) ||
    orderStatus === 'paid' ||
    orderStatus === 'fulfilled'
  );
}

function isPaidButWronglyCancelled(order) {
  if (!isOrderPaid(order) || order?.fulfillment_status !== 'cancelado') {
    return false;
  }

  const mpStatus = String(order.mercado_pago_status || '').toLowerCase();
  if (['refunded', 'charged_back'].includes(mpStatus)) {
    return false;
  }

  return true;
}

function resolveFulfillmentStatus(order) {
  const paid = isOrderPaid(order);
  const fulfillment = order?.fulfillment_status;

  if (isPaidButWronglyCancelled(order)) {
    return 'pagamento_aprovado';
  }

  if (fulfillment && FULFILLMENT_STATUSES.has(fulfillment)) {
    if (paid && fulfillment === 'aguardando_pagamento') {
      return 'pagamento_aprovado';
    }
    return fulfillment;
  }

  const dbStatus = String(order?.status || 'awaiting_payment').toLowerCase();
  if (DB_TO_FULFILLMENT[dbStatus]) {
    return DB_TO_FULFILLMENT[dbStatus];
  }

  if (paid) {
    return 'pagamento_aprovado';
  }

  return 'aguardando_pagamento';
}

function needsFulfillmentRepair(order) {
  if (!order || !isOrderPaid(order)) return false;
  if (order.fulfillment_status === 'aguardando_pagamento') return true;
  if (isPaidButWronglyCancelled(order)) return true;
  return false;
}

function sanitizeOrderForResponse(order) {
  if (!order) return order;

  const fulfillmentStatus = resolveFulfillmentStatus(order);
  const paid = isOrderPaid(order);

  return {
    ...order,
    fulfillment_status: fulfillmentStatus,
    status: paid ? 'paid' : (order.status || 'awaiting_payment'),
    payment_status: paid ? 'paid' : (order.payment_status || 'pending'),
  };
}

function buildOrderUpdatesFromFulfillment(fulfillmentStatus, existingOrder = {}) {
  if (!FULFILLMENT_STATUSES.has(fulfillmentStatus)) {
    throw new Error(`Status operacional inválido: ${fulfillmentStatus}`);
  }

  const updates = {
    fulfillment_status: fulfillmentStatus,
  };

  switch (fulfillmentStatus) {
    case 'aguardando_pagamento':
      updates.status = 'awaiting_payment';
      updates.payment_status = 'pending';
      break;
    case 'pagamento_aprovado':
      updates.status = 'paid';
      updates.payment_status = 'paid';
      if (!existingOrder.paid_at) {
        updates.paid_at = new Date().toISOString();
      }
      break;
    case 'cancelado':
      updates.status = 'cancelled';
      updates.payment_status = 'failed';
      break;
    case 'entregue':
      updates.status = 'fulfilled';
      updates.payment_status = existingOrder.payment_status || 'paid';
      break;
    case 'postado':
    case 'em_transito':
    case 'saiu_para_entrega':
      updates.status = 'paid';
      updates.payment_status = existingOrder.payment_status || 'paid';
      updates.shipping_status = fulfillmentStatus;
      break;
    default:
      updates.status = existingOrder.status === 'awaiting_payment' ? 'paid' : (existingOrder.status || 'paid');
      updates.payment_status = existingOrder.payment_status === 'pending' ? 'paid' : (existingOrder.payment_status || 'paid');
      if (fulfillmentStatus === 'pagamento_aprovado' && !existingOrder.paid_at) {
        updates.paid_at = new Date().toISOString();
      }
      break;
  }

  return updates;
}

function appendOrderLog(existingLogs, entry) {
  const logs = Array.isArray(existingLogs) ? [...existingLogs] : [];
  logs.push({
    id: `${Date.now()}-${logs.length + 1}`,
    action: entry.action,
    message: entry.message || entry.action,
    user: entry.user || 'Operador',
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  return logs;
}

module.exports = {
  FULFILLMENT_STATUSES,
  isOrderPaid,
  isPaidButWronglyCancelled,
  resolveFulfillmentStatus,
  needsFulfillmentRepair,
  sanitizeOrderForResponse,
  buildOrderUpdatesFromFulfillment,
  appendOrderLog,
};
