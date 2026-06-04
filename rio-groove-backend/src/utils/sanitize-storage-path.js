const { STORAGE_PATHS } = require('../config/storage');

const ALLOWED_PREFIXES = new Set(Object.values(STORAGE_PATHS));

function sanitizeStorageFolderPath(rawPath) {
  const trimmed = String(rawPath || '').trim().replace(/\\/g, '/');
  if (!trimmed) {
    throw Object.assign(new Error('Caminho de upload inválido.'), { statusCode: 400 });
  }
  if (trimmed.includes('..') || trimmed.startsWith('/') || /[\0%]/.test(trimmed)) {
    throw Object.assign(new Error('Caminho de upload inválido.'), { statusCode: 400 });
  }

  const normalized = trimmed.replace(/\/+/g, '/').replace(/\/$/, '');
  const allowed = [...ALLOWED_PREFIXES].some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );

  if (!allowed) {
    throw Object.assign(new Error('Pasta de upload não permitida.'), { statusCode: 400 });
  }

  return normalized;
}

module.exports = { sanitizeStorageFolderPath };
