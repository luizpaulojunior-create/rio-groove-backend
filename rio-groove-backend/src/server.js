const { initSentry } = require('./lib/monitoring');
initSentry();

const app = require('./app');
const env = require('./config/env');
const { testResend } = require('./services/notifications.service');
const { loadInsumoCostConfig } = require('./services/insumoCosts.service');
const { startMelhorEnvioTrackingSyncScheduler } = require('./services/melhorEnvioTrackingSync.service');

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

  // One-shot: aplica o estoque físico do caderno uma única vez por release token.
  // Não reexecuta em restarts posteriores (evita sobrescrever baixas de venda).
  (async () => {
    const releaseToken = 'physical-stock-2026-07-15-xgg';
    try {
      const supabase = require('./lib/supabase');
      const { data: already } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider', 'system')
        .eq('topic', 'physical_stock_sync')
        .eq('resource_id', releaseToken)
        .maybeSingle();

      if (already) {
        console.log('[BOOT] Physical stock sync já aplicado:', releaseToken);
      } else {
        const { syncPhysicalStock } = require('./services/stock.service');
        const result = await syncPhysicalStock();
        console.log('[BOOT] Physical stock sync:', result.message);

        await supabase.from('webhook_events').upsert({
          provider: 'system',
          topic: 'physical_stock_sync',
          action: 'completed',
          resource_id: releaseToken,
          payload: result,
          processed_at: new Date().toISOString(),
        }, { onConflict: 'provider,topic,resource_id' });
      }
    } catch (error) {
      console.error('[BOOT] Physical stock sync failed:', error.message);
    }

    const sizeToken = 'product-size-g1-to-xgg-2026-07-15';
    try {
      const supabase = require('./lib/supabase');
      const { data: already } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider', 'system')
        .eq('topic', 'product_size_g1_to_xgg')
        .eq('resource_id', sizeToken)
        .maybeSingle();

      if (already) {
        console.log('[BOOT] Product size G1→XGG já aplicado:', sizeToken);
        return;
      }

      const { renameProductVariantG1ToXgg } = require('./services/productSizeMigration.service');
      const result = await renameProductVariantG1ToXgg();
      console.log('[BOOT] Product size migration:', result.message);

      await supabase.from('webhook_events').upsert({
        provider: 'system',
        topic: 'product_size_g1_to_xgg',
        action: 'completed',
        resource_id: sizeToken,
        payload: result,
        processed_at: new Date().toISOString(),
      }, { onConflict: 'provider,topic,resource_id' });
    } catch (error) {
      console.error('[BOOT] Product size G1→XGG failed:', error.message);
    }
  })();

  startMelhorEnvioTrackingSyncScheduler();
});
