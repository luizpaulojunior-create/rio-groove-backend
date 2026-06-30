const fs = require('fs');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const FUNNEL_STEPS = [
  { event: 'page_view', label: 'Visitas (páginas)' },
  { event: 'view_item', label: 'Visualização de produto' },
  { event: 'add_to_cart', label: 'Adicionou ao carrinho' },
  { event: 'begin_checkout', label: 'Iniciou checkout' },
  { event: 'purchase', label: 'Compra concluída' },
];

const DEVICE_LABELS = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  tablet: 'Tablet',
  '(not set)': 'Não informado',
};

let clientCache = null;
let reportCache = new Map();

function parseServiceAccountCredentials() {
  try {
    const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
    if (raw) {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }
      return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
    }

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath && fs.existsSync(credentialsPath)) {
      return JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }

    return null;
  } catch (error) {
    console.warn('[GA4] Falha ao ler credenciais:', error.message);
    return null;
  }
}

function hasGa4CredentialsEnv() {
  const raw = String(process.env.GA4_SERVICE_ACCOUNT_JSON || '').trim();
  if (raw) return true;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  return Boolean(credentialsPath && fs.existsSync(credentialsPath));
}

function defaultPropertyMeta() {
  return {
    propertyId: process.env.GA4_PROPERTY_ID || '539502234',
    measurementId: process.env.GA4_MEASUREMENT_ID || 'G-2J23RT1MN3',
  };
}

function emptyConversionPayload(dateRange) {
  const emptyFunnel = FUNNEL_STEPS.map((step) => ({
    step: step.event,
    label: step.label,
    events: 0,
    users: 0,
    rateFromPrevious: null,
    rateFromTop: 0,
  }));

  return {
    ...dateRange,
    ...defaultPropertyMeta(),
    overview: {
      sessions: 0,
      activeUsers: 0,
      pageViews: 0,
      purchases: 0,
      purchaseRevenue: 0,
    },
    funnel: emptyFunnel,
    devices: [],
    topProducts: [],
    insights: {
      overallConversion: 0,
      cartAbandonment: 0,
      checkoutDropoff: 0,
    },
  };
}

function isGa4Configured() {
  return Boolean(parseServiceAccountCredentials());
}

function getPropertyResource() {
  const id = String(process.env.GA4_PROPERTY_ID || '539502234').replace(/^properties\//, '');
  return `properties/${id}`;
}

function getClient() {
  if (clientCache) return clientCache;

  const credentials = parseServiceAccountCredentials();
  if (!credentials) {
    throw new Error('GA4 não configurado: defina GA4_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS');
  }

  clientCache = new BetaAnalyticsDataClient({ credentials });
  return clientCache;
}

function periodToDateRange(period = '7d') {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));

  return {
    period,
    days,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function mapMetricValue(row, index = 0) {
  const value = row?.metricValues?.[index]?.value;
  return Number(value || 0);
}

function mapDimensionValue(row, index = 0) {
  return String(row?.dimensionValues?.[index]?.value || '').trim();
}

async function runCachedReport(cacheKey, ttlMs, runner) {
  const now = Date.now();
  const cached = reportCache.get(cacheKey);
  if (cached && now - cached.at < ttlMs) {
    return cached.data;
  }

  const data = await runner();
  reportCache.set(cacheKey, { at: now, data });
  return data;
}

async function fetchOverview(client, property, dateRange) {
  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'ecommercePurchases' },
      { name: 'purchaseRevenue' },
    ],
  });

  const row = response.rows?.[0];
  return {
    sessions: mapMetricValue(row, 0),
    activeUsers: mapMetricValue(row, 1),
    pageViews: mapMetricValue(row, 2),
    purchases: mapMetricValue(row, 3),
    purchaseRevenue: Number(mapMetricValue(row, 4).toFixed(2)),
  };
}

async function fetchFunnel(client, property, dateRange) {
  const eventNames = FUNNEL_STEPS.map((step) => step.event);

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: eventNames },
      },
    },
    limit: eventNames.length,
  });

  const byEvent = new Map();
  for (const row of response.rows || []) {
    byEvent.set(mapDimensionValue(row, 0), {
      events: mapMetricValue(row, 0),
      users: mapMetricValue(row, 1),
    });
  }

  const topUsers = byEvent.get('page_view')?.users || byEvent.get('view_item')?.users || 1;
  let previousUsers = null;

  return FUNNEL_STEPS.map((step) => {
    const metrics = byEvent.get(step.event) || { events: 0, users: 0 };
    const rateFromPrevious = previousUsers
      ? Number(((metrics.users / previousUsers) * 100).toFixed(1))
      : null;
    const rateFromTop = topUsers
      ? Number(((metrics.users / topUsers) * 100).toFixed(1))
      : 0;

    previousUsers = metrics.users || previousUsers;

    return {
      step: step.event,
      label: step.label,
      events: metrics.events,
      users: metrics.users,
      rateFromPrevious,
      rateFromTop,
    };
  });
}

async function fetchDevices(client, property, dateRange) {
  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'sessions' }, { name: 'ecommercePurchases' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 5,
  });

  return (response.rows || []).map((row) => {
    const device = mapDimensionValue(row, 0).toLowerCase();
    const sessions = mapMetricValue(row, 0);
    const purchases = mapMetricValue(row, 1);
    const users = mapMetricValue(row, 2);

    return {
      device,
      label: DEVICE_LABELS[device] || device,
      sessions,
      purchases,
      users,
      conversionRate: sessions ? Number(((purchases / sessions) * 100).toFixed(2)) : 0,
    };
  });
}

async function fetchTopProducts(client, property, dateRange, limit = 10) {
  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'itemName' }],
    metrics: [
      { name: 'itemsViewed' },
      { name: 'itemsAddedToCart' },
      { name: 'itemsPurchased' },
    ],
    orderBys: [{ metric: { metricName: 'itemsViewed' }, desc: true }],
    limit,
  });

  return (response.rows || [])
    .map((row) => {
      const name = mapDimensionValue(row, 0);
      if (!name || name === '(not set)') return null;

      const views = mapMetricValue(row, 0);
      const addedToCart = mapMetricValue(row, 1);
      const purchased = mapMetricValue(row, 2);

      return {
        name,
        views,
        addedToCart,
        purchased,
        cartRate: views ? Number(((addedToCart / views) * 100).toFixed(1)) : 0,
        purchaseRate: views ? Number(((purchased / views) * 100).toFixed(1)) : 0,
      };
    })
    .filter(Boolean);
}

function getServiceAccountEmail() {
  return parseServiceAccountCredentials()?.client_email || null;
}

async function getConversionReport(period = '7d') {
  const dateRange = periodToDateRange(period);
  const meta = defaultPropertyMeta();

  if (!isGa4Configured()) {
    const invalidEnv = hasGa4CredentialsEnv();
    return {
      configured: false,
      message: invalidEnv
        ? 'GA4_SERVICE_ACCOUNT_JSON está definido no Render, mas o JSON/base64 é inválido. Cole o arquivo inteiro da conta de serviço ou use base64 válido.'
        : 'Configure GA4_PROPERTY_ID e GA4_SERVICE_ACCOUNT_JSON no backend (conta de serviço com papel Viewer na propriedade GA4).',
      ...meta,
      ...dateRange,
    };
  }

  try {
    return await runCachedReport(cacheKeyForRange(dateRange), 5 * 60 * 1000, async () => {
      const client = getClient();
      const property = getPropertyResource();

      const [overview, funnel, devices, topProducts] = await Promise.all([
        fetchOverview(client, property, dateRange),
        fetchFunnel(client, property, dateRange),
        fetchDevices(client, property, dateRange),
        fetchTopProducts(client, property, dateRange, 12),
      ]);

      const cartStep = funnel.find((step) => step.step === 'add_to_cart');
      const checkoutStep = funnel.find((step) => step.step === 'begin_checkout');
      const purchaseStep = funnel.find((step) => step.step === 'purchase');
      const viewStep = funnel.find((step) => step.step === 'view_item');

      return {
        configured: true,
        ...meta,
        ...dateRange,
        overview,
        funnel,
        devices,
        topProducts,
        insights: {
          overallConversion: viewStep?.users
            ? Number(((purchaseStep?.users || 0) / viewStep.users) * 100).toFixed(2)
            : 0,
          cartAbandonment: cartStep?.users
            ? Number((((cartStep.users - (purchaseStep?.users || 0)) / cartStep.users) * 100).toFixed(1))
            : 0,
          checkoutDropoff: checkoutStep?.users
            ? Number((((checkoutStep.users - (purchaseStep?.users || 0)) / checkoutStep.users) * 100).toFixed(1))
            : 0,
        },
      };
    });
  } catch (error) {
    console.error('[GA4] Erro ao consultar Data API:', error.message);
    const serviceAccountEmail = getServiceAccountEmail();
    const hint = /permission|denied|403|401/i.test(String(error.message))
      ? ` Adicione${serviceAccountEmail ? ` o e-mail ${serviceAccountEmail}` : ' o e-mail da conta de serviço'} como Viewer em GA4 → Admin → Gerenciamento de acesso à propriedade (ID ${meta.propertyId}).`
      : '';
    return {
      configured: true,
      fetchError: `${error.message || 'Erro ao consultar Google Analytics Data API'}.${hint}`,
      serviceAccountEmail,
      ...emptyConversionPayload(dateRange),
    };
  }
}

function cacheKeyForRange(dateRange) {
  return `conversion:${dateRange.period}:${dateRange.startDate}:${dateRange.endDate}`;
}

module.exports = {
  isGa4Configured,
  getConversionReport,
  FUNNEL_STEPS,
};
