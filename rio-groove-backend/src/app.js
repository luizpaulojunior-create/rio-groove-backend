const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.use(cors({
  origin: [
    'https://6152c968.rio-groove-storefront.pages.dev',
    'https://rio-groove-storefront.pages.dev',
    'https://riogroovemovimentos.com',
    'http://localhost:5173'
  ],
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
