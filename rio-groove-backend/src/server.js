const { initSentry } = require('./lib/monitoring');
initSentry();

const app = require('./app');
const env = require('./config/env');
const { testResend } = require('./services/notifications.service');
const { syncYellowStockItems } = require('./services/stock.service');
const { loadInsumoCostConfig } = require('./services/insumoCosts.service');

console.log('[BOOT] Iniciando servidor...');
console.log('[BOOT] Rotas de shipping carregadas');
console.log('[BOOT] /api/shipping/quote registrado');
console.log('[BOOT] OAuth Melhor Envio routes registradas');

console.log('[ENV CONFIG]', {
  nodeEnv: env.nodeEnv,
  hasFrontendUrl: !!env.frontendUrl,
  hasBackendUrl: !!env.backendUrl,
  hasSentry: !!process.env.SENTRY_DSN,
});

console.log('[ZAPI CONFIG]', {
  hasWhatsappUrl: !!env.whatsappZapiUrl,
  hasWhatsappToken: !!env.whatsappZapiToken,
  hasWhatsappInstance: !!env.whatsappInstanceId
});

console.log('[RESEND CONFIG]', {
  hasResendApiKey: !!env.resendApiKey,
  hasAdminNotificationEmail: !!env.adminNotificationEmail,
});

if (env.nodeEnv === 'development' || process.env.RUN_BOOT_TESTS === 'true') {
  testResend().catch(console.error);
}

app.listen(env.port, () => {
  console.log(`Rio Groove Store Backend rodando na porta ${env.port}`);

  loadInsumoCostConfig()
    .then(() => {
      console.log('[BOOT] Insumo cost config loaded');
    })
    .catch((error) => {
      console.error('[BOOT] Insumo cost config failed:', error.message);
    });

  syncYellowStockItems(10)
    .then((result) => {
      console.log('[BOOT] Yellow stock sync:', result.message);
    })
    .catch((error) => {
      console.error('[BOOT] Yellow stock sync failed:', error.message);
    });
});
