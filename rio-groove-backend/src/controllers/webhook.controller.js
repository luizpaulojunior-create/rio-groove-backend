const asyncHandler = require('../utils/asyncHandler');
const { processMercadoPagoWebhook } = require('../services/payments.service');
const { processMelhorEnvioWebhook } = require('../services/melhorEnvioWebhook.service');

const mercadoPagoWebhook = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log('[WebhookController] MP webhook', {
    bodyType: req.body?.type || req.body?.action || null,
    resourceId: req.body?.data?.id || req.query?.['data.id'] || null,
  });

  try {
    const result = await processMercadoPagoWebhook(req);
    const durationMs = Date.now() - startTime;
    console.log('[WebhookController] Finalizando requisição', {
      status: 200,
      durationMs,
      resultSummary: {
        ignored: result.ignored,
        reason: result.reason || null,
        paymentStatus: result.paymentStatus || null
      }
    });
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const isAuthError = /assinatura|signature|x-signature|webhook secret/i.test(error.message || '');
    console.error('[WebhookController] Exception antes de chegar no PaymentsService', {
      error: error.stack || error.message,
      durationMs,
      timestamp: new Date().toISOString(),
    });
    const status = isAuthError ? 401 : 500;
    return res.status(status).json({ received: false, error: isAuthError ? 'Unauthorized webhook' : 'Webhook processing error' });
  }
});

const melhorEnvioWebhook = asyncHandler(async (req, res) => {
  console.log('[WebhookController] ME webhook', {
    event: req.body?.event || null,
    shipmentId: req.body?.data?.id || null,
  });

  try {
    const result = await processMelhorEnvioWebhook(req);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    const isAuthError = /assinatura|signature|x-me-signature|client secret/i.test(error.message || '');
    console.error('[WebhookController] ME webhook error', error.message);
    const status = isAuthError ? 401 : 500;
    return res.status(status).json({
      received: false,
      error: isAuthError ? 'Unauthorized webhook' : 'Webhook processing error',
    });
  }
});

module.exports = {
  mercadoPagoWebhook,
  melhorEnvioWebhook,
};
