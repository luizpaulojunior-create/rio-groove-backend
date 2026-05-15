const app = require('./app');
const env = require('./config/env');

console.log('[BOOT] Iniciando servidor...');
console.log('[BOOT] Rotas de shipping carregadas');
console.log('[BOOT] /api/shipping/quote registrado');

console.log('[ZAPI ENV CHECK]', {
  hasUrl: !!process.env.WHATSAPP_API_URL,
  hasToken: !!process.env.WHATSAPP_API_TOKEN,
  hasInstance: !!process.env.WHATSAPP_INSTANCE_ID,
  hasBaseUrl: !!process.env.ZAPI_BASE_URL,
  hasInstanceToken: !!process.env.ZAPI_INSTANCE_TOKEN,
  hasClientToken: !!process.env.ZAPI_CLIENT_TOKEN,
  // E também logar as variáveis que mapeamos no env.js pra ter certeza
  hasEnvZapiUrl: !!env.whatsappZapiUrl,
  hasEnvZapiToken: !!env.whatsappZapiToken
});

app.listen(env.port, () => {
  console.log(`Rio Groove Store Backend rodando na porta ${env.port}`);
});
