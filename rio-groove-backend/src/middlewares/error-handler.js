const { CUSTOM_ORDER_MAX_FILE_SIZE_BYTES } = require('../config/upload');

function errorHandler(error, req, res, next) {
  const { captureException } = require('../lib/monitoring');
  captureException(error, {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  console.error('[API ERROR]', req.requestId || '-', error);

  if (error && error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    const maxMb = Math.round(CUSTOM_ORDER_MAX_FILE_SIZE_BYTES / (1024 * 1024));
    return res.status(413).json({
      ok: false,
      error: `Arquivo muito grande. O limite é ${maxMb} MB por arquivo.`,
      message: `Arquivo muito grande. O limite é ${maxMb} MB por arquivo.`,
      requestId: req.requestId,
    });
  }

  const status = error.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const clientMessage =
    status < 500
      ? error.message || 'Requisição inválida.'
      : isProd
        ? 'Erro interno do servidor.'
        : error.message || 'Erro interno do servidor.';

  return res.status(status).json({
    ok: false,
    error: clientMessage,
    message: clientMessage,
    requestId: req.requestId,
    detail: isProd ? undefined : error.stack,
  });
}

module.exports = errorHandler;
