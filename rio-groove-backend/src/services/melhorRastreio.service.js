const env = require('../config/env');
const { getValidToken } = require('./melhorEnvioAuth.service');
const { pickHighestFulfillmentStatus } = require('./shipping.service');

const MR_GRAPHQL_URL = 'https://melhor-rastreio-api.melhorrastreio.com.br/graphql';

const MR_BROWSER_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Origin: 'https://www.melhorrastreio.com.br',
  'User-Agent': 'RioGroove/1.0 (contato@riogroovemovimentos.com.br)',
};

const MR_FLAG_TO_FULFILLMENT = {
  ADDED: 'postado',
  POSTING: 'postado',
  POSTED: 'postado',
  MOVEMENT: 'em_transito',
  ONROUTE: 'saiu_para_entrega',
  DELIVERED: 'entregue',
  RETURNED: 'em_transito',
};

function mapMelhorRastreioFlagToFulfillment(flag) {
  const key = String(flag || '').toUpperCase().trim();
  return MR_FLAG_TO_FULFILLMENT[key] || null;
}

function mapEventTextToFulfillment(text) {
  const value = String(text || '').toLowerCase();
  if (!value) return null;
  if (/entregue ao destinat|objeto entregue|pacote entregue|delivered/.test(value)) {
    return 'entregue';
  }
  if (
    /saiu para (a )?entrega|out for delivery|em rota de entrega|saiu para entrega/.test(value)
  ) {
    return 'saiu_para_entrega';
  }
  if (
    /em tr[aâ]nsito|transferid|chegou na transportadora|em deslocamento|recebido pela transportadora|unidade de destino|cte do pacote/.test(value)
  ) {
    return 'em_transito';
  }
  if (/postad|coletad|despachad|objeto postado/.test(value)) return 'postado';
  return null;
}

async function resolveAuthTokens() {
  const tokens = [];
  if (env.melhorRastreioGraphqlToken) tokens.push(env.melhorRastreioGraphqlToken);

  try {
    const meToken = await getValidToken();
    if (meToken) tokens.push(meToken);
  } catch (error) {
    console.warn('[MelhorRastreio] Falha ao obter token ME:', error.message);
  }

  if (env.melhorEnvioToken) tokens.push(env.melhorEnvioToken);
  return [...new Set(tokens.filter(Boolean))];
}

async function graphqlRequest(query, variables = {}, token = null) {
  const headers = {
    ...MR_BROWSER_HEADERS,
    Referer: `https://www.melhorrastreio.com.br/rastreio/${variables?.tracker?.trackingCode || ''}`,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(MR_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `Melhor Rastreio GraphQL ${response.status}`);
  }
  return payload;
}

async function graphqlWithAuth(query, variables = {}) {
  const tokens = await resolveAuthTokens();
  let lastPayload = null;

  for (const token of tokens) {
    const payload = await graphqlRequest(query, variables, token);
    lastPayload = payload;
    const unauthorized = payload?.errors?.some((error) =>
      /unauthorized|unauthenticated/i.test(error?.message || ''),
    );
    if (!unauthorized) return payload;
  }

  return (
    lastPayload || {
      errors: [{ message: 'Melhor Rastreio indisponível sem token válido.' }],
    }
  );
}

async function resolveCarrierType(trackingCode) {
  const payload = await graphqlRequest(
    `query($code: String!) { carriersFromTrackingCode(code: $code) }`,
    { code: trackingCode },
  );
  return payload?.data?.carriersFromTrackingCode?.[0] || 'melhorenvio';
}

async function requestParcelRefresh(trackingCode, carrierType, token) {
  try {
    await graphqlRequest(
      `query($tracker: TrackerTrackingCode!) { forceParcelUpdate(tracker: $tracker) }`,
      { tracker: { trackingCode } },
      token,
    );
  } catch (error) {
    console.warn('[MelhorRastreio] forceParcelUpdate', error.message);
  }
}

async function fetchParcelByTrackingCode(trackingCode) {
  const code = String(trackingCode || '').trim();
  if (!code) return null;

  const carrierType = await resolveCarrierType(code);
  const tokens = await resolveAuthTokens();

  if (!tokens.length) {
    return { unauthorized: true, reason: 'Sem token Melhor Envio/Rastreio configurado.' };
  }

  for (const token of tokens) {
    await requestParcelRefresh(code, carrierType, token);

    const payload = await graphqlRequest(
      `query($tracker: TrackerSearchInput!) {
        findParcel(tracker: $tracker) {
          lastStatus
          trackingOriginalEvent
          postedAt
          deliveredAt
          estimatedDelivery
          trackingEvents {
            title
            description
            createdAt
            status
          }
        }
      }`,
      { tracker: { type: carrierType, trackingCode: code } },
      token,
    );

    if (payload?.errors?.length) {
      const message = payload.errors[0]?.message || 'Melhor Rastreio indisponível';
      if (/unauthorized|unauthenticated/i.test(message)) continue;
      throw new Error(message);
    }

    if (payload?.data?.findParcel) {
      return payload.data.findParcel;
    }
  }

  return { unauthorized: true, reason: 'Melhor Rastreio rejeitou os tokens disponíveis.' };
}

function resolveFulfillmentFromParcel(parcel) {
  if (!parcel || parcel.unauthorized) return null;

  const candidates = [];
  const fromFlag = mapMelhorRastreioFlagToFulfillment(parcel.lastStatus);
  if (fromFlag) candidates.push(fromFlag);

  const events = Array.isArray(parcel.trackingEvents) ? parcel.trackingEvents : [];
  for (const event of events) {
    const fromEvent = mapEventTextToFulfillment(
      `${event?.title || ''} ${event?.description || ''} ${event?.status || ''}`,
    );
    if (fromEvent) candidates.push(fromEvent);
  }

  const fromOriginal = mapEventTextToFulfillment(parcel.trackingOriginalEvent);
  if (fromOriginal) candidates.push(fromOriginal);

  return pickHighestFulfillmentStatus(candidates);
}

function extractLatestEventLabel(parcel) {
  if (!parcel || parcel.unauthorized) return null;
  if (parcel.trackingOriginalEvent) return String(parcel.trackingOriginalEvent);

  const events = Array.isArray(parcel.trackingEvents) ? parcel.trackingEvents : [];
  const latest = events[0];
  if (!latest) return null;
  return String(latest.description || latest.title || '').trim() || null;
}

async function syncFulfillmentFromMelhorRastreio(trackingCode) {
  try {
    const parcel = await fetchParcelByTrackingCode(trackingCode);
    if (!parcel) {
      return { synced: false, reason: 'Pacote não encontrado no Melhor Rastreio.' };
    }
    if (parcel.unauthorized) {
      return {
        synced: false,
        reason: parcel.reason || 'Melhor Rastreio requer autenticação.',
      };
    }

    const fulfillmentStatus = resolveFulfillmentFromParcel(parcel);
    return {
      synced: Boolean(fulfillmentStatus),
      fulfillmentStatus,
      lastStatus: parcel.lastStatus || null,
      lastEvent: extractLatestEventLabel(parcel),
      raw: parcel,
    };
  } catch (error) {
    console.warn('[MelhorRastreio] syncFulfillmentFromMelhorRastreio', error.message);
    return { synced: false, reason: error.message };
  }
}

module.exports = {
  fetchParcelByTrackingCode,
  syncFulfillmentFromMelhorRastreio,
  mapMelhorRastreioFlagToFulfillment,
  mapEventTextToFulfillment,
};
