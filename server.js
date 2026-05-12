const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Rio Groove Backend Online 🚀');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config/public', (req, res) => {
  res.json({
    checkoutEndpoint: 'https://rio-groove-backend.onrender.com/api/checkout'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
