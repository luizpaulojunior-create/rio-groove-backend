const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`Rio Groove Store Backend rodando na porta ${env.port}`);
});
