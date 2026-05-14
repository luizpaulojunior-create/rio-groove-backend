const nodemailer = require('nodemailer');
const env = require('../config/env');

function onlyDigits(value) {
  return String(value || '').replace(/\D+/g, '');
}

function buildTrackingUrl(trackingCode, provider) {
  if (!trackingCode) return null;
  if (provider && /melhor envio/i.test(provider)) {
    return `https://www.melhorenvio.com.br/rastreamento?codigo=${encodeURIComponent(trackingCode)}`;
  }
  return null;
}

function normalizeWhatsAppNumber(phone) {
  const digits = onlyDigits(phone);
  if (!digits) return null;

  if (digits.length === 11 && digits.startsWith('55')) {
    return digits;
  }

  if (digits.length === 11) {
    return `${env.whatsappDefaultCountry}${digits}`;
  }

  if (digits.length === 10) {
    return `${env.whatsappDefaultCountry}${digits}`;
  }

  if (digits.length > 11 && digits.startsWith(env.whatsappDefaultCountry)) {
    return digits;
  }

  return `${env.whatsappDefaultCountry}${digits}`;
}

function buildNotificationData(order, data) {
  const carrier = data.carrier || order.shipping_provider || 'Melhor Envio';
  const trackingCode = data.trackingCode || order.shipping_tracking_code || '';
  const deadline = data.deadline || order.shipping_deadline || 'A confirmar';
  const trackingUrl = data.trackingUrl || buildTrackingUrl(trackingCode, carrier) || order.shipping_label_url || '';

  return {
    name: order.customer_name || 'Cliente',
    orderNumber: order.order_number || order.external_reference || 'Pedido',
    carrier,
    trackingCode,
    deadline,
    trackingUrl,
    email: order.customer_email,
    phone: order.customer_phone
  };
}

function buildEmailTemplate(payload) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rastreamento do pedido ${payload.orderNumber}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="background:#120c0d;padding:30px 32px;text-align:center;">
                <h1 style="margin:0;color:#ff3c30;font-size:28px;letter-spacing:0.08em;">Rio Groove Store</h1>
                <p style="margin:12px 0 0;color:#dddddd;font-size:16px;">Seu pedido está a caminho com rastreio disponível.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="font-size:16px;color:#ffffff;">Olá ${payload.name},</p>
                <p style="font-size:16px;color:#cccccc;line-height:1.7;">Seu pedido <strong>${payload.orderNumber}</strong> foi processado e a etiqueta foi gerada com sucesso. Abaixo estão os detalhes para você acompanhar a entrega.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 16px;border-radius:16px;background:#1b1b1b;padding:20px;">
                  <tr>
                    <td style="padding:12px 0;font-size:14px;color:#999999;">Transportadora</td>
                    <td style="padding:12px 0;font-size:15px;color:#ffffff;text-align:right;">${payload.carrier}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;font-size:14px;color:#999999;">Código de rastreio</td>
                    <td style="padding:12px 0;font-size:15px;color:#ffffff;text-align:right;">${payload.trackingCode || 'Em breve'}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;font-size:14px;color:#999999;">Previsão de entrega</td>
                    <td style="padding:12px 0;font-size:15px;color:#ffffff;text-align:right;">${payload.deadline}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;font-size:14px;color:#999999;">Pedido</td>
                    <td style="padding:12px 0;font-size:15px;color:#ffffff;text-align:right;">${payload.orderNumber}</td>
                  </tr>
                </table>
                <p style="font-size:16px;color:#ffffff;">Você pode acompanhar seu pedido clicando no botão abaixo:</p>
                <p style="text-align:center;margin:24px 0;">
                  <a href="${payload.trackingUrl || '#'}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#ff3c30;color:#ffffff;text-decoration:none;font-weight:700;">Acompanhar rastreio</a>
                </p>
                <p style="font-size:14px;color:#888888;line-height:1.7;">Caso o botão não funcione, copie e cole o link abaixo no navegador:</p>
                <p style="font-size:13px;color:#bbbbbb;word-break:break-all;">${payload.trackingUrl || 'Link de rastreio ainda não disponível'}</p>
                <p style="font-size:16px;color:#cccccc;line-height:1.7;">Obrigado por comprar na Rio Groove Store. Qualquer dúvida, estamos à disposição.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#090909;padding:24px;text-align:center;color:#777777;font-size:13px;">Rio Groove Store • Entrega com estilo e autenticidade</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildWhatsAppMessage(payload) {
  return `Olá ${payload.name}, seu pedido ${payload.orderNumber} já está a caminho.

Transportadora: ${payload.carrier}
Código de rastreio: ${payload.trackingCode || 'Em breve'}
Previsão de entrega: ${payload.deadline}

Acompanhe aqui: ${payload.trackingUrl || 'Link de rastreio em breve'}

Obrigado por comprar na Rio Groove Store.`;
}

async function sendTrackingEmail(order, data) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.emailFrom) {
    return {
      status: 'skipped',
      reason: 'SMTP não configurado.'
    };
  }

  if (!order.customer_email) {
    return {
      status: 'skipped',
      reason: 'E-mail do cliente não disponível.'
    };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword
    }
  });

  const payload = buildNotificationData(order, data);
  const html = buildEmailTemplate(payload);

  const mailOptions = {
    from: env.emailFrom,
    to: order.customer_email,
    subject: `Seu pedido ${payload.orderNumber} está a caminho`,
    html
  };

  await transporter.sendMail(mailOptions);

  return {
    status: 'sent',
    to: order.customer_email
  };
}

async function sendTrackingWhatsApp(order, data) {
  if (!env.whatsappApiUrl || !env.whatsappApiToken) {
    return {
      status: 'skipped',
      reason: 'WhatsApp API não configurada.'
    };
  }

  if (!order.customer_phone) {
    return {
      status: 'skipped',
      reason: 'Telefone do cliente não disponível.'
    };
  }

  const destination = normalizeWhatsAppNumber(order.customer_phone);
  if (!destination) {
    return {
      status: 'failed',
      reason: 'Telefone inválido para WhatsApp.'
    };
  }

  const payload = buildNotificationData(order, data);
  const message = buildWhatsAppMessage(payload);

  const response = await fetch(env.whatsappApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.whatsappApiToken}`
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: destination,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const result = await response.text();
  if (!response.ok) {
    throw new Error(`WhatsApp API retornou ${response.status}: ${result}`);
  }

  return {
    status: 'sent',
    to: destination,
    response: result
  };
}

async function sendOrderTrackingNotification(order, data) {
  const notificationData = buildNotificationData(order, data);
  const emailResult = await sendTrackingEmail(order, data).catch(function (error) {
    return {
      status: 'failed',
      reason: error.message
    };
  });

  const whatsappResult = await sendTrackingWhatsApp(order, data).catch(function (error) {
    return {
      status: 'failed',
      reason: error.message
    };
  });

  const summary = {
    email: emailResult,
    whatsapp: whatsappResult
  };

  return summary;
}

module.exports = {
  sendOrderTrackingNotification
};
