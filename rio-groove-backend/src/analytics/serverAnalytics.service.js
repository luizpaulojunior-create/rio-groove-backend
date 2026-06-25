const { resolvePurchaseConsent } = require('./consent');
const { validatePurchasePayload } = require('./purchaseValidation');
const { ga4Measurement } = require('../services/ga4Measurement.service');

/** @type {Array<() => Promise<void>>} */
const jobQueue = [];
let draining = false;

function enqueue(job) {
  jobQueue.push(job);
  if (!draining) {
    draining = true;
    setImmediate(drainQueue);
  }
}

async function drainQueue() {
  while (jobQueue.length) {
    const job = jobQueue.shift();
    try {
      await job();
    } catch (error) {
      console.error('[ServerAnalytics] Erro não tratado na fila', {
        message: error.message,
        stack: error.stack,
      });
    }
  }
  draining = false;
}

/**
 * Enfileira purchase server-side após confirmação oficial do Mercado Pago.
 * Não bloqueia o webhook.
 */
function enqueueApprovedPurchase({ payment, order, kind = 'store', phase = null, context = {} }) {
  enqueue(async () => {
    const consent = resolvePurchaseConsent({ order, payment, kind });
    if (consent !== true) {
      console.log('[GA4-MP] purchase ignorado — consentimento não concedido', {
        transactionContext: context,
        kind,
        phase,
        consent,
      });
      return;
    }

    let result;
    if (kind === 'custom') {
      result = await ga4Measurement.sendPurchaseForCustomOrder(order, phase, {
        ...context,
        analyticsConsent: true,
        async: true,
      });
    } else {
      result = await ga4Measurement.sendPurchaseForApprovedPayment(payment, order, {
        ...context,
        analyticsConsent: true,
        async: true,
      });
    }

    if (result?.status === 'retry_scheduled') {
      console.log('[GA4-MP] retry agendado', {
        transactionId: result.transactionId,
        attempt: result.attempt,
        nextDelayMs: result.nextDelayMs,
      });
    }
  });
}

function enqueueStoreOrderPurchase({ payment, order, context = {} }) {
  enqueueApprovedPurchase({ payment, order, kind: 'store', context });
}

function enqueueCustomOrderPurchase({ payment, order, phase, context = {} }) {
  enqueueApprovedPurchase({ payment, order, kind: 'custom', phase, context });
}

module.exports = {
  enqueue,
  enqueueApprovedPurchase,
  enqueueStoreOrderPurchase,
  enqueueCustomOrderPurchase,
};
