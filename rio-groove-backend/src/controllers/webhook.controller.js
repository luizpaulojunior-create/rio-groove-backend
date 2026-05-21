const asyncHandler = require('../utils/asyncHandler');
const { processMercadoPagoWebhook, processStripeWebhook } = require('../services/payments.service');

const stripeWebhook = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log('[WebhookController] Requisição Stripe recebida no endpoint');

  try {
    const result = await processStripeWebhook(req);
    const durationMs = Date.now() - startTime;
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error('[WebhookController] Erro no processamento Stripe:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

const mercadoPagoWebhook = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log('[WebhookController] Requisição recebida no endpoint', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    },
    body: req.body
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
    console.error('[WebhookController] Exception antes de chegar no PaymentsService', {
      error: error.stack || error.message,
      durationMs,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ received: false, error: 'Webhook processing error' });
  }
});

module.exports = {
  mercadoPagoWebhook,
  stripeWebhook
};
