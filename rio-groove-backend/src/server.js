const app = require('./app');
const env = require('./config/env');

console.log('[BOOT] Iniciando servidor...');
console.log('[BOOT] Rotas de shipping carregadas');
console.log('[BOOT] /api/shipping/quote registrado');

app.listen(env.port, () => {
  console.log(`Rio Groove Store Backend rodando na porta ${env.port}`);
});
