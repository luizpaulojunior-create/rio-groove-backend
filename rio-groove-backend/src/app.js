const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

const allowedOrigins = [
  'https://store.riogroovemovimentos.com.br', // Frontend Principal
  'https://rio-groove-storefront-v2.pages.dev',
  'https://rio-groove-storefront.pages.dev',
  'https://riogroovemovimentos.com',
  'http://localhost:5173',
  'http://localhost:3000' // Testes locais
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests sem origin (como health checks do Render ou server-to-server)
    if (!origin) {
      console.log('[CORS] Origin allowed (no origin / server-to-server)');
      return callback(null, true);
    }

    // Verifica se a origin está na lista exata ou é um subdomínio do pages.dev
    const isAllowed = allowedOrigins.includes(origin) || /\.pages\.dev$/.test(origin);
    
    console.log(`[CORS] Request from Origin: ${origin} | Allowed: ${isAllowed}`);
    
    if (isAllowed) {
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
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Garante resposta correta ao preflight OPTIONS

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
