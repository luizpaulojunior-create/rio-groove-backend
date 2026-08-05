const env = require('../config/env');
const supabase = require('../lib/supabase');
const { sendEmail } = require('./notifications.service');

const REPORT_TIME_ZONE = 'America/Sao_Paulo';
const REPORT_START_HOUR = 9;
const REPORT_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const REPORT_INITIAL_DELAY_MS = 90 * 1000;

let reportTimer = null;
let reportInProgress = false;

function getZonedDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIME_ZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function getWeeklyReportToken(date = new Date()) {
  const parts = getZonedDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isWeeklyReportDue(date = new Date()) {
  const parts = getZonedDateParts(date);
  return parts.weekday === 'Mon' && Number(parts.hour) >= REPORT_START_HOUR;
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeStock(rows = []) {
  const items = rows
    .filter((row) => row && row.is_active !== false)
    .map((row) => ({
      ...row,
      quantity: numberOrZero(row.quantity ?? row.stock),
      min_stock: numberOrZero(row.min_stock),
    }));

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const outOfStock = items.filter((item) => item.quantity <= 0);
  const lowStock = items.filter(
    (item) => item.quantity > 0 && item.quantity <= Math.max(1, item.min_stock),
  );

  return {
    items,
    totalSkus: items.length,
    totalUnits,
    outOfStock,
    lowStock,
    healthySkus: items.length - outOfStock.length - lowStock.length,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stockStatus(item) {
  if (item.quantity <= 0) return { label: 'ZERADO', color: '#ef4444' };
  if (item.quantity <= Math.max(1, item.min_stock)) {
    return { label: 'BAIXO', color: '#f59e0b' };
  }
  return { label: 'OK', color: '#22c55e' };
}

function buildWeeklyStockReportHtml(summary, generatedAt = new Date()) {
  const reportDate = new Intl.DateTimeFormat('pt-BR', {
    timeZone: REPORT_TIME_ZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(generatedAt);

  const sorted = [...summary.items].sort((a, b) => {
    const left = `${a.category}|${a.model}|${a.color_label}|${a.size}`;
    const right = `${b.category}|${b.model}|${b.color_label}|${b.size}`;
    return left.localeCompare(right, 'pt-BR');
  });

  const rows = sorted.map((item) => {
    const status = stockStatus(item);
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #262626;">${escapeHtml(item.model || item.category)}</td>
        <td style="padding:10px;border-bottom:1px solid #262626;">${escapeHtml(item.color_label || item.color_key)}</td>
        <td style="padding:10px;border-bottom:1px solid #262626;text-align:center;">${escapeHtml(item.size)}</td>
        <td style="padding:10px;border-bottom:1px solid #262626;text-align:center;font-weight:700;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #262626;text-align:center;color:${status.color};font-weight:700;">${status.label}</td>
      </tr>`;
  }).join('');

  return `<!doctype html>
<html>
  <head><meta charset="UTF-8"><title>Condição semanal do estoque</title></head>
  <body style="margin:0;padding:24px;background:#090909;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table width="760" cellpadding="0" cellspacing="0" style="max-width:760px;background:#111111;border:1px solid #262626;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:28px;background:#160b08;">
            <h1 style="margin:0;color:#ff4d00;font-size:26px;">Condição semanal do estoque</h1>
            <p style="margin:8px 0 0;color:#bdbdbd;">${escapeHtml(reportDate)}</p>
          </td></tr>
          <tr><td style="padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="8">
              <tr>
                <td style="padding:16px;background:#1a1a1a;border-radius:12px;"><strong>${summary.totalUnits}</strong><br><span style="color:#999;">peças</span></td>
                <td style="padding:16px;background:#1a1a1a;border-radius:12px;"><strong>${summary.totalSkus}</strong><br><span style="color:#999;">SKUs</span></td>
                <td style="padding:16px;background:#1a1a1a;border-radius:12px;"><strong style="color:#ef4444;">${summary.outOfStock.length}</strong><br><span style="color:#999;">zerados</span></td>
                <td style="padding:16px;background:#1a1a1a;border-radius:12px;"><strong style="color:#f59e0b;">${summary.lowStock.length}</strong><br><span style="color:#999;">baixos</span></td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#1c1c1c;color:#bdbdbd;">
                  <th style="padding:10px;text-align:left;">Modelo</th>
                  <th style="padding:10px;text-align:left;">Cor</th>
                  <th style="padding:10px;">Tam.</th>
                  <th style="padding:10px;">Qtd.</th>
                  <th style="padding:10px;">Condição</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function loadCurrentStock() {
  const { data, error } = await supabase
    .from('stock_items')
    .select('sku, category, model, color_key, color_label, size, quantity, min_stock, is_active')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

async function wasReportSent(token) {
  const { data, error } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'system')
    .eq('topic', 'weekly_stock_report')
    .eq('resource_id', token)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function markReportSent(token, summary, emailResult) {
  const { error } = await supabase.from('webhook_events').upsert({
    provider: 'system',
    topic: 'weekly_stock_report',
    action: 'completed',
    resource_id: token,
    payload: {
      total_units: summary.totalUnits,
      total_skus: summary.totalSkus,
      out_of_stock: summary.outOfStock.length,
      low_stock: summary.lowStock.length,
      provider: emailResult?.provider || null,
    },
    processed_at: new Date().toISOString(),
  }, { onConflict: 'provider,topic,resource_id' });

  if (error) throw error;
}

async function sendWeeklyStockReport({ force = false, record = true, now = new Date() } = {}) {
  if (reportInProgress) {
    return { skipped: true, reason: 'Relatório já está em processamento.' };
  }

  if (!force && !isWeeklyReportDue(now)) {
    return { skipped: true, reason: 'Fora da janela de segunda-feira.' };
  }

  const token = getWeeklyReportToken(now);
  if (!force && await wasReportSent(token)) {
    return { skipped: true, reason: 'Relatório desta semana já enviado.', token };
  }

  reportInProgress = true;
  try {
    const rows = await loadCurrentStock();
    const summary = summarizeStock(rows);
    const html = buildWeeklyStockReportHtml(summary, now);
    const subject =
      `Estoque Rio Groove — ${summary.totalUnits} peças, ` +
      `${summary.outOfStock.length} SKUs zerados`;
    const emailResult = await sendEmail(env.adminNotificationEmail, subject, html);

    if (emailResult.status !== 'sent') {
      throw new Error(emailResult.reason || 'O relatório semanal não foi enviado.');
    }

    if (record) {
      await markReportSent(token, summary, emailResult);
    }

    console.log('[WeeklyStockReport] Enviado', {
      token,
      to: env.adminNotificationEmail,
      totalUnits: summary.totalUnits,
      outOfStock: summary.outOfStock.length,
      lowStock: summary.lowStock.length,
    });

    return { sent: true, token, summary, email: emailResult };
  } finally {
    reportInProgress = false;
  }
}

function startWeeklyStockReportScheduler() {
  if (process.env.WEEKLY_STOCK_REPORT_ENABLED === 'false') {
    console.log('[WeeklyStockReport] Scheduler desativado por configuração.');
    return;
  }

  const run = () => {
    sendWeeklyStockReport().catch((error) => {
      console.error('[WeeklyStockReport] Erro no scheduler:', error.message);
    });
  };

  setTimeout(run, REPORT_INITIAL_DELAY_MS);
  reportTimer = setInterval(run, REPORT_CHECK_INTERVAL_MS);
  console.log('[WeeklyStockReport] Scheduler ativo', {
    recipient: env.adminNotificationEmail,
    timeZone: REPORT_TIME_ZONE,
    mondayFromHour: REPORT_START_HOUR,
  });
}

function stopWeeklyStockReportScheduler() {
  if (reportTimer) clearInterval(reportTimer);
  reportTimer = null;
}

module.exports = {
  getWeeklyReportToken,
  isWeeklyReportDue,
  summarizeStock,
  buildWeeklyStockReportHtml,
  sendWeeklyStockReport,
  startWeeklyStockReportScheduler,
  stopWeeklyStockReportScheduler,
};
