const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Rio Groove Backend Online 🚀');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
