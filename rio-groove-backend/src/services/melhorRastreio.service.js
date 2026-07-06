const env = require('../config/env');

const MR_GRAPHQL_URL = 'https://melhor-rastreio-api.melhorrastreio.com.br/graphql';

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
  if (/entregue|delivered/.test(value)) return 'entregue';
  if (/saiu para entrega|out for delivery|em rota de entrega/.test(value)) {
    return 'saiu_para_entrega';
  }
  if (/em tr[aâ]nsito|transferid|chegou na transportadora|em deslocamento/.test(value)) {
    return 'em_transito';
  }
  if (/postad|coletad|despachad/.test(value)) return 'postado';
  return null;
}

async function graphqlRequest(query, variables = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (env.melhorRastreioGraphqlToken) {
    headers.Authorization = `Bearer ${env.melhorRastreioGraphqlToken}`;
  }

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

async function resolveCarrierType(trackingCode) {
  const payload = await graphqlRequest(
    `query($code: String!) { carriersFromTrackingCode(code: $code) }`,
    { code: trackingCode },
  );
  return payload?.data?.carriersFromTrackingCode?.[0] || 'melhorenvio';
}

async function fetchParcelByTrackingCode(trackingCode) {
  const code = String(trackingCode || '').trim();
  if (!code) return null;

  const carrierType = await resolveCarrierType(code);
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
  );

  if (payload?.errors?.length) {
    const message = payload.errors[0]?.message || 'Melhor Rastreio indisponível';
    if (/unauthorized/i.test(message)) {
      return { unauthorized: true, reason: message };
    }
    throw new Error(message);
  }

  return payload?.data?.findParcel || null;
}

function resolveFulfillmentFromParcel(parcel) {
  if (!parcel || parcel.unauthorized) return null;

  const fromFlag = mapMelhorRastreioFlagToFulfillment(parcel.lastStatus);
  if (fromFlag) return fromFlag;

  const events = Array.isArray(parcel.trackingEvents) ? parcel.trackingEvents : [];
  for (const event of events) {
    const fromEvent = mapEventTextToFulfillment(
      `${event?.title || ''} ${event?.description || ''} ${parcel.trackingOriginalEvent || ''}`,
    );
    if (fromEvent) return fromEvent;
  }

  return mapEventTextToFulfillment(parcel.trackingOriginalEvent);
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
        reason: 'Melhor Rastreio requer token (MELHOR_RASTREIO_GRAPHQL_TOKEN).',
      };
    }

    const fulfillmentStatus = resolveFulfillmentFromParcel(parcel);
    return {
      synced: Boolean(fulfillmentStatus),
      fulfillmentStatus,
      lastStatus: parcel.lastStatus || null,
      lastEvent: parcel.trackingOriginalEvent || null,
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
