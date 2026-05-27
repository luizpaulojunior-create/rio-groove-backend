const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');
const requestId = require('./middlewares/request-id');
const { buildAllowedOrigins, isOriginAllowed } = require('./utils/cors-origin');

const app = express();

const allowedOrigins = buildAllowedOrigins(process.env);

const corsOptions = {
  origin: function (origin, callback) {
    const allowed = isOriginAllowed(origin, allowedOrigins);

    if (!origin) {
      console.log('[CORS] Origin allowed (no origin / server-to-server)');
      return callback(null, true);
    }

    console.log(`[CORS] Request from Origin: ${origin} | Allowed: ${allowed}`);

    if (allowed) {
      callback(null, true);
    } else {
      console.log(`[CORS] Blocked by CORS: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Garante que o middleware CORS seja o primeiro a ser carregado antes de qualquer rota
app.use(requestId);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Garante resposta correta ao preflight OPTIONS

app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

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
