const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin === env.frontendUrl) return callback(null, true);
    return callback(new Error('Origem não autorizada pelo CORS.'));
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
