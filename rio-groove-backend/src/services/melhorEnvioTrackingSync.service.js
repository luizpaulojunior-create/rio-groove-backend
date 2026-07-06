const env = require('../config/env');
const { getOrdersForMelhorEnvioTrackingSync } = require('./orders.service');
const {
  fetchMelhorEnvioTracking,
  mapMelhorEnvioStatusToFulfillment,
  normalizeTrackingCode,
  buildTrackingSyncUpdates,
} = require('./shipping.service');
const { updateOrderById } = require('./orders.service');
const { appendOrderLog } = require('../utils/orderFulfillment');

const DEFAULT_BATCH_SIZE = 40;
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

let syncInProgress = false;
let syncTimer = null;

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function applyMelhorEnvioShipmentToOrder(order, shipmentData, { source = 'sync' } = {}) {
  if (!order || !shipmentData) {
    return { order, updated: false, reason: 'Sem dados de rastreio.' };
  }

  const meStatus = shipmentData.status || shipmentData.situation || shipmentData.tracking?.status;
  const trackingCode = normalizeTrackingCode(
    shipmentData.tracking ||
      shipmentData.tracking_code ||
      shipmentData.trackingCode ||
      shipmentData.melhorenvio_tracking ||
      order.shipping_tracking_code,
  );
  const mappedFulfillment = mapMelhorEnvioStatusToFulfillment(meStatus);

  const updates = buildTrackingSyncUpdates(order, {
    fulfillmentStatus: mappedFulfillment,
    trackingCode,
    melhorEnvioStatus: meStatus,
  });

  if (!Object.keys(updates).length) {
    return { order, updated: false, reason: 'Status já atualizado.' };
  }

  updates.order_logs = appendOrderLog(order.order_logs, {
    action: `Rastreamento Melhor Envio: ${mappedFulfillment || meStatus}`,
    message:
      source === 'webhook'
        ? `Webhook Melhor Envio — ${meStatus || 'atualizado'}`
        : `Sincronização automática Melhor Envio — ${meStatus || 'atualizado'}`,
    user: 'Melhor Envio',
  });

  const updatedOrder = await updateOrderById(order.id, updates);
  return {
    order: updatedOrder,
    updated: true,
    fulfillmentStatus: mappedFulfillment,
    melhorEnvioStatus: meStatus,
    trackingCode,
  };
}

async function syncMelhorEnvioTrackingBatch(orders = [], options = {}) {
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  const eligible = (orders || []).filter((order) => order?.melhor_envio_shipment_id);
  const summary = {
    scanned: eligible.length,
    updated: 0,
    unchanged: 0,
    errors: 0,
    batches: 0,
  };

  for (const batch of chunkArray(eligible, batchSize)) {
    summary.batches += 1;
    const shipmentIds = batch.map((order) => String(order.melhor_envio_shipment_id));
    let trackingPayload = {};

    try {
      trackingPayload = await fetchMelhorEnvioTracking(shipmentIds);
    } catch (error) {
      console.error('[MelhorEnvioSync] Falha no lote de rastreio:', error.message);
      summary.errors += batch.length;
      continue;
    }

    for (const order of batch) {
      const shipmentId = String(order.melhor_envio_shipment_id);
      const shipmentData = trackingPayload[shipmentId] || null;

      if (!shipmentData) {
        summary.unchanged += 1;
        continue;
      }

      try {
        const result = await applyMelhorEnvioShipmentToOrder(order, shipmentData, {
          source: options.source || 'sync',
        });
        if (result.updated) summary.updated += 1;
        else summary.unchanged += 1;
      } catch (error) {
        console.error('[MelhorEnvioSync] Falha ao atualizar pedido', order.id, error.message);
        summary.errors += 1;
      }
    }
  }

  return summary;
}

async function syncAllPendingMelhorEnvioTracking(options = {}) {
  if (syncInProgress) {
    return { skipped: true, reason: 'Sincronização já em andamento.' };
  }

  syncInProgress = true;
  const startedAt = Date.now();
  const pageSize = options.pageSize || 200;
  const maxOrders = options.maxOrders || 2000;
  const aggregate = {
    scanned: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    batches: 0,
    pages: 0,
  };

  try {
    let offset = 0;
    while (aggregate.scanned < maxOrders) {
      const { orders, total } = await getOrdersForMelhorEnvioTrackingSync({
        limit: pageSize,
        offset,
      });

      if (!orders.length) break;

      aggregate.pages += 1;
      const batchSummary = await syncMelhorEnvioTrackingBatch(orders, options);
      aggregate.scanned += batchSummary.scanned;
      aggregate.updated += batchSummary.updated;
      aggregate.unchanged += batchSummary.unchanged;
      aggregate.errors += batchSummary.errors;
      aggregate.batches += batchSummary.batches;

      offset += orders.length;
      if (offset >= total) break;
    }

    const durationMs = Date.now() - startedAt;
    console.log('[MelhorEnvioSync] Concluído', { ...aggregate, durationMs });
    return { ...aggregate, durationMs, skipped: false };
  } finally {
    syncInProgress = false;
  }
}

function isTrackingSyncEnabled() {
  if (process.env.ME_TRACKING_SYNC_ENABLED === 'false') return false;
  return Boolean(env.melhorEnvioToken || env.melhorEnvioClientId);
}

function startMelhorEnvioTrackingSyncScheduler() {
  if (!isTrackingSyncEnabled()) {
    console.log('[MelhorEnvioSync] Scheduler desativado (sem credenciais ME).');
    return;
  }

  const intervalMs = Number(process.env.ME_TRACKING_SYNC_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  const run = () => {
    syncAllPendingMelhorEnvioTracking().catch((error) => {
      console.error('[MelhorEnvioSync] Erro no scheduler:', error.message);
    });
  };

  const initialDelayMs = Number(process.env.ME_TRACKING_SYNC_INITIAL_DELAY_MS || 60_000);
  setTimeout(run, initialDelayMs);
  syncTimer = setInterval(run, intervalMs);
  console.log('[MelhorEnvioSync] Scheduler ativo', { intervalMs, initialDelayMs });
}

function stopMelhorEnvioTrackingSyncScheduler() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
}

module.exports = {
  applyMelhorEnvioShipmentToOrder,
  syncMelhorEnvioTrackingBatch,
  syncAllPendingMelhorEnvioTracking,
  startMelhorEnvioTrackingSyncScheduler,
  stopMelhorEnvioTrackingSyncScheduler,
  isTrackingSyncEnabled,
};
