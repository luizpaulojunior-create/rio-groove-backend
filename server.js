try {
  require('./src/server');
} catch (error) {
  console.error('Erro ao iniciar o backend da Rio Groove Store:', error);
  process.exit(1);
}

