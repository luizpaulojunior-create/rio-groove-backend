const { supabase } = require('../lib/supabase');

const TERMINAL_STATUSES = new Set(['sent', 'consent_denied', 'invalid', 'failed']);
const MAX_ATTEMPTS = 3;

/** @type {Map<string, object>} */
const memoryLog = new Map();

function nowIso() {
  return new Date().toISOString();
}

function mapRow(row) {
  if (!row) return null;
  return {
    dedupKey: row.dedup_key,
    transactionId: row.transaction_id,
    status: row.status,
    attempts: Number(row.attempts || 0),
    eventId: row.event_id,
    analyticsConsent: row.analytics_consent,
    lastHttpStatus: row.last_http_status,
    lastResponse: row.last_response,
    lastError: row.last_error,
    payload: row.payload,
    sentAt: row.sent_at,
    updatedAt: row.updated_at,
  };
}

async function findByDedupKey(dedupKey) {
  try {
    const { data, error } = await supabase
      .from('ga4_purchase_log')
      .select('*')
      .eq('dedup_key', dedupKey)
      .maybeSingle();
    if (error) {
      if (error.code === '42P01') return mapRow(memoryLog.get(dedupKey));
      throw error;
    }
    return mapRow(data);
  } catch {
    return mapRow(memoryLog.get(dedupKey));
  }
}

async function upsertLog(row) {
  const record = {
    dedup_key: row.dedupKey,
    transaction_id: row.transactionId,
    provider: row.provider || 'ga4',
    source: row.source || 'measurement_protocol',
    status: row.status,
    attempts: row.attempts ?? 0,
    event_id: row.eventId || null,
    analytics_consent: row.analyticsConsent ?? null,
    last_http_status: row.lastHttpStatus ?? null,
    last_response: row.lastResponse ?? null,
    last_error: row.lastError ?? null,
    payload: row.payload ?? null,
    sent_at: row.sentAt ?? null,
    updated_at: nowIso(),
  };

  memoryLog.set(row.dedupKey, record);

  try {
    const { error } = await supabase
      .from('ga4_purchase_log')
      .upsert(record, { onConflict: 'dedup_key' });
    if (error && error.code !== '42P01') {
      console.warn('[GA4-MP] Falha ao persistir ga4_purchase_log — cache em memória', error.message);
    }
  } catch (error) {
    console.warn('[GA4-MP] Erro ao persistir ga4_purchase_log — cache em memória', error.message);
  }

  return record;
}

/**
 * Reserva slot de envio. Retorna duplicate se já enviado ou em processamento válido.
 */
async function beginSendAttempt({ dedupKey, transactionId, eventId, analyticsConsent, payload }) {
  const existing = await findByDedupKey(dedupKey);

  if (existing) {
    if (existing.status === 'sent') {
      return { action: 'duplicate', existing };
    }
    if (existing.status === 'consent_denied' || existing.status === 'invalid') {
      return { action: 'blocked', existing };
    }
    if (existing.status === 'failed' && existing.attempts >= MAX_ATTEMPTS) {
      return { action: 'failed_final', existing };
    }
    const attempts = existing.attempts + 1;
    if (attempts > MAX_ATTEMPTS) {
      await upsertLog({
        ...existing,
        dedupKey,
        transactionId,
        status: 'failed',
        attempts,
        lastError: 'max_attempts_exceeded',
      });
      return { action: 'failed_final', existing };
    }
    const updated = await upsertLog({
      ...existing,
      dedupKey,
      transactionId,
      status: 'pending',
      attempts,
      eventId: eventId || existing.eventId,
      analyticsConsent,
      payload: payload || existing.payload,
    });
    return { action: 'retry', record: updated, attempts };
  }

  const created = await upsertLog({
    dedupKey,
    transactionId,
    status: 'pending',
    attempts: 1,
    eventId,
    analyticsConsent,
    payload,
  });
  return { action: 'begin', record: created, attempts: 1 };
}

async function markSent({ dedupKey, transactionId, eventId, httpStatus, responseBody }) {
  const existing = await findByDedupKey(dedupKey);
  return upsertLog({
    dedupKey,
    transactionId,
    status: 'sent',
    eventId,
    lastHttpStatus: httpStatus,
    lastResponse: responseBody || null,
    sentAt: nowIso(),
    lastError: null,
    attempts: existing?.attempts || 1,
  });
}

async function markRetryScheduled({
  dedupKey,
  transactionId,
  eventId,
  attempts,
  httpStatus,
  responseBody,
  errorMessage,
}) {
  return upsertLog({
    dedupKey,
    transactionId,
    status: 'retry_scheduled',
    eventId,
    attempts,
    lastHttpStatus: httpStatus ?? null,
    lastResponse: responseBody || null,
    lastError: errorMessage || `http_${httpStatus}`,
  });
}

async function markFailed({
  dedupKey,
  transactionId,
  eventId,
  attempts,
  httpStatus,
  responseBody,
  errorMessage,
}) {
  return upsertLog({
    dedupKey,
    transactionId,
    status: 'failed',
    eventId,
    attempts,
    lastHttpStatus: httpStatus ?? null,
    lastResponse: responseBody || null,
    lastError: errorMessage || 'definitive_failure',
  });
}

async function markIgnored({ dedupKey, transactionId, status, reason, analyticsConsent }) {
  return upsertLog({
    dedupKey: dedupKey || transactionId,
    transactionId,
    status,
    attempts: 0,
    analyticsConsent,
    lastError: reason,
    sentAt: null,
  });
}

module.exports = {
  MAX_ATTEMPTS,
  TERMINAL_STATUSES,
  findByDedupKey,
  beginSendAttempt,
  markSent,
  markRetryScheduled,
  markFailed,
  markIgnored,
};
