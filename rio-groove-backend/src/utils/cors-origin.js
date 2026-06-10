const KNOWN_PAGES_PROJECTS = [
  'rio-groove-store-v2',
  'rio-groove-admin-painel',
];

const defaultOrigins = [
  'https://riogroovemovimentos.com.br',
  'https://www.riogroovemovimentos.com.br',
  'https://store.riogroovemovimentos.com.br',
  'https://admin.riogroovemovimentos.com.br',
];

function buildAllowedOrigins(env = process.env) {
  const envOrigins = [
    env.FRONTEND_URL,
    env.STORE_URL,
    env.ADMIN_URL,
  ].filter(Boolean);

  const additionalOrigins = String(env.ADDITIONAL_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...defaultOrigins, ...envOrigins, ...additionalOrigins])];
}

function isKnownPagesDevOrigin(origin) {
  if (!/\.pages\.dev$/i.test(origin)) return false;

  try {
    const { hostname } = new URL(origin);
    return KNOWN_PAGES_PROJECTS.some(
      (project) =>
        hostname === `${project}.pages.dev` ||
        hostname.endsWith(`.${project}.pages.dev`),
    );
  } catch {
    return false;
  }
}

function isNativeAppOrigin(origin) {
  return [
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
  ].includes(origin);
}

function isLocalDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function isOriginAllowed(origin, allowedOrigins = buildAllowedOrigins()) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (isNativeAppOrigin(origin)) return true;
  if (isKnownPagesDevOrigin(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) return true;
  return false;
}

module.exports = {
  KNOWN_PAGES_PROJECTS,
  buildAllowedOrigins,
  isKnownPagesDevOrigin,
  isLocalDevOrigin,
  isOriginAllowed,
};
