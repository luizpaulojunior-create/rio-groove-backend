function errorHandler(error, req, res, next) {
  console.error('[API ERROR]', error);

  const status = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor.';

  return res.status(status).json({
    message,
    detail: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}

module.exports = errorHandler;
