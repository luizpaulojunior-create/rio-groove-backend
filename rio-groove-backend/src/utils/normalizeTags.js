/**
 * Normaliza tags de produto vindas do FormData / Postgres.
 * Corrige arrays onde cada item é um JSON stringificado inteiro.
 */
function normalizeTagsArray(arr) {
  const flat = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('[')) {
      try {
        const inner = JSON.parse(trimmed);
        if (Array.isArray(inner)) {
          flat.push(...inner.map(String));
          continue;
        }
      } catch {
        // fall through
      }
    }
    flat.push(trimmed);
  }
  return flat;
}

function normalizeTagsField(raw) {
  const fallback = ['insumo:Camisa', 'model:Oversized Tradicional', 'genero:Masculino'];

  if (raw === undefined || raw === null || raw === '') return fallback;

  if (Array.isArray(raw)) {
    const normalized = normalizeTagsArray(raw);
    return normalized.length ? normalized : fallback;
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = normalizeTagsArray(parsed);
        return normalized.length ? normalized : fallback;
      }
    } catch {
      const split = raw.split(',').map((s) => s.trim()).filter(Boolean);
      return split.length ? split : fallback;
    }
  }

  return fallback;
}

module.exports = {
  normalizeTagsField,
};
