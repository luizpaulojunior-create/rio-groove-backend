const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');
const requestId = require('./middlewares/request-id');
const { apiLimiter } = require('./middlewares/rate-limit');
const { buildAllowedOrigins, isOriginAllowed } = require('./utils/cors-origin');

const app = express();

app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const allowedOrigins = buildAllowedOrigins(process.env);

const corsOptions = {
  origin: function (origin, callback) {
    const allowed = isOriginAllowed(origin, allowedOrigins);

    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production' && !allowed) {
      console.log(`[CORS] Blocked: ${origin}`);
    }

    if (allowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Type'],
};

// Garante que o middleware CORS seja o primeiro a ser carregado antes de qualquer rota
app.use(requestId);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Garante resposta correta ao preflight OPTIONS

app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => {
    if (req.path.startsWith('/api/webhooks')) {
      req.rawBody = buf;
    }
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  if (req.path.startsWith('/api/webhooks') || req.path === '/api/health') return next();
  return apiLimiter(req, res, next);
});

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
