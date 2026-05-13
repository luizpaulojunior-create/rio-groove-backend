const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.use(cors({
  origin(origin, callback) {

    // Permite chamadas sem origin (Mercado Pago/webhooks)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      env.frontendUrl,
      'https://store.riogroovemovimentos.com.br',
      'https://riogroovemovimentos.com.br',
      'https://proud-breeze-a824.luizpaulojunior.workers.dev'
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // libera Mercado Pago e chamadas externas necessárias
    return callback(null, true);
  },

  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'Rio Groove Store Backend',
    docs: '/api/health'
  });
});

app.use(routes);
app.use(errorHandler);

module.exports = app;
