const app = require('./app');
const env = require('./config/env');
const { testResend } = require('./services/notifications.service');

console.log('[BOOT] Iniciando servidor...');
console.log('[BOOT] Rotas de shipping carregadas');
console.log('[BOOT] /api/shipping/quote registrado');
console.log('[BOOT] OAuth Melhor Envio routes registradas');

console.log('[ENV CONFIG]', {
  nodeEnv: env.nodeEnv,
  hasFrontendUrl: !!env.frontendUrl,
  hasBackendUrl: !!env.backendUrl
});

console.log('[ZAPI CONFIG]', {
  hasWhatsappUrl: !!env.whatsappZapiUrl,
  hasWhatsappToken: !!env.whatsappZapiToken,
  hasWhatsappInstance: !!env.whatsappInstanceId
});

console.log('[RESEND CONFIG]', {
  hasResendApiKey: !!env.resendApiKey,
  hasAdminNotificationEmail: !!env.adminNotificationEmail,
  adminNotificationEmail: env.adminNotificationEmail // log only email, not token
});

// Teste automático na inicialização
testResend().catch(console.error);

app.listen(env.port, () => {
  console.log(`Rio Groove Store Backend rodando na porta ${env.port}`);
});
