function errorHandler(error, req, res, next) {
  const { captureException } = require('../lib/monitoring');
  captureException(error, {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  console.error('[API ERROR]', req.requestId || '-', error);

  const status = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor.';

  return res.status(status).json({
    message,
    requestId: req.requestId,
    detail: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}

module.exports = errorHandler;
