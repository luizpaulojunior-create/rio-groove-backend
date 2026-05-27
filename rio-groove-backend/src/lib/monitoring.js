let Sentry = null;

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
  } catch (error) {
    console.warn('[Sentry] Falha ao inicializar:', error.message);
    Sentry = null;
  }

  return Sentry;
}

function captureException(error, context = {}) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  }
}

module.exports = {
  initSentry,
  captureException,
  getSentry: () => Sentry,
};
