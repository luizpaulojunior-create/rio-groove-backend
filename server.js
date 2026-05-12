const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
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
app.post('/api/checkout', (req, res) => {
  res.json({
    init_point: 'https://www.mercadopago.com.br'
  });
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
