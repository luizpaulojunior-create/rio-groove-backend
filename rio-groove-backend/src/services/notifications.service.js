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
  const deadline = data.deadline || order.shipping_deadline || 'Após confirmação do pagamento';
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

function buildPickupEmailTemplate(payload) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Retirada presencial do pedido ${payload.orderNumber}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="background:#120c0d;padding:30px 32px;text-align:center;">
                <h1 style="margin:0;color:#ff3c30;font-size:28px;letter-spacing:0.08em;">Rio Groove Store</h1>
                <p style="margin:12px 0 0;color:#dddddd;font-size:16px;">Seu pagamento foi aprovado com sucesso! 🎉</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="font-size:16px;color:#ffffff;">Olá ${payload.name},</p>
                <p style="font-size:16px;color:#cccccc;line-height:1.7;">Sua retirada presencial da Rio Groove Store já pode ser organizada.</p>
                <p style="font-size:16px;color:#ffffff;line-height:1.7;">Pedido: <strong>${payload.orderNumber}</strong></p>
                <p style="font-size:16px;color:#ffffff;line-height:1.7;">Entre em contato com nosso WhatsApp oficial para combinar local, data e horário da retirada:</p>
                <p style="font-size:20px;font-weight:700;color:#ff3c30;letter-spacing:0.08em;">21 96445-6789</p>
                <p style="font-size:16px;color:#cccccc;line-height:1.7;">Obrigado por fortalecer a cultura e os movimentos da Rio Groove. 🥁</p>
              </td>
            </tr>
            <tr>
              <td style="background:#090909;padding:24px;text-align:center;color:#777777;font-size:13px;">Rio Groove Store • Retirada presencial organizada com estilo</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildTrackingEmailTemplate(payload) {
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

function buildPickupWhatsAppMessage() {
  return `Seu pagamento foi aprovado com sucesso! 🎉

Sua retirada presencial da Rio Groove Store já pode ser organizada.

Entre em contato com nosso WhatsApp oficial para combinar local, data e horário da retirada:

21 96445-6789

Obrigado por fortalecer a cultura e os movimentos da Rio Groove. 🥁`;
}

function buildTrackingWhatsAppMessage(payload) {
  return `Olá ${payload.name}, seu pedido ${payload.orderNumber} já está a caminho.

Transportadora: ${payload.carrier}
Código de rastreio: ${payload.trackingCode || 'Em breve'}
Previsão de entrega: ${payload.deadline}

Acompanhe aqui: ${payload.trackingUrl || 'Link de rastreio em breve'}

Obrigado por comprar na Rio Groove Store.`;
}

function buildAdminEmailTemplate(order) {
  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #333;">${item.product_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${item.color}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${item.size}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Novo Pedido Aprovado: ${order.order_number}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="background:#120c0d;padding:30px 32px;text-align:center;">
                <h1 style="margin:0;color:#ff3c30;font-size:28px;letter-spacing:0.08em;">Rio Groove Store - Admin</h1>
                <p style="margin:12px 0 0;color:#dddddd;font-size:16px;">Novo pagamento aprovado! 💰</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="font-size:18px;color:#ff3c30;margin-top:0;">Detalhes do Pedido</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:8px;background:#1b1b1b;padding:16px;">
                  <tr><td style="padding:4px 0;color:#aaa;">Número do Pedido:</td><td style="padding:4px 0;text-align:right;"><strong>${order.order_number}</strong></td></tr>
                  <tr><td style="padding:4px 0;color:#aaa;">Referência Externa:</td><td style="padding:4px 0;text-align:right;">${order.external_reference}</td></tr>
                  <tr><td style="padding:4px 0;color:#aaa;">Cliente:</td><td style="padding:4px 0;text-align:right;">${order.customer_name}</td></tr>
                  <tr><td style="padding:4px 0;color:#aaa;">Valor Total:</td><td style="padding:4px 0;text-align:right;color:#4ade80;"><strong>R$ ${Number(order.total_amount).toFixed(2).replace('.', ',')}</strong></td></tr>
                  <tr><td style="padding:4px 0;color:#aaa;">Tipo de Entrega:</td><td style="padding:4px 0;text-align:right;">${order.shipping_method}</td></tr>
                  ${order.shipping_provider ? `<tr><td style="padding:4px 0;color:#aaa;">Transportadora:</td><td style="padding:4px 0;text-align:right;">${order.shipping_provider}</td></tr>` : ''}
                </table>

                <h3 style="font-size:16px;color:#ffffff;">Itens do Pedido</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;text-align:left;border-collapse:collapse;">
                  <thead>
                    <tr>
                      <th style="padding:8px;border-bottom:2px solid #444;color:#aaa;">Produto</th>
                      <th style="padding:8px;border-bottom:2px solid #444;color:#aaa;text-align:center;">Qtd</th>
                      <th style="padding:8px;border-bottom:2px solid #444;color:#aaa;text-align:center;">Cor</th>
                      <th style="padding:8px;border-bottom:2px solid #444;color:#aaa;text-align:center;">Tamanho</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendEmailWithResend({ to, subject, html }) {
  console.log('[ResendSender] Inicializando integração Resend...');
  if (!env.resendApiKey) {
    console.error('[ResendSender] Resend não configurado - RESEND_API_KEY ausente');
    throw new Error('Resend API key não configurada.');
  }

  const sender = env.emailFrom || 'contato@riogroovemovimentos.com.br';
  console.log('[EmailSender] Remetente validado para o envio:', sender);
  
  const payload = {
    from: sender,
    to: [to],
    subject,
    html
  };
  
  console.log('[ResendSender] Payload preparado para envio', { from: sender, to, subject });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.resendApiKey}`
    },
    body: JSON.stringify(payload)
  });

  const resultText = await response.text();
  console.log('[ResendSender] Resposta da API Resend:', {
    status: response.status,
    ok: response.ok,
    body: resultText
  });

  if (!response.ok) {
    throw new Error(`Resend retornou ${response.status}: ${resultText}`);
  }

  let result = {};
  try {
    result = resultText ? JSON.parse(resultText) : {};
  } catch (error) {
    console.warn('[ResendSender] Falha ao parsear resposta do Resend, retornando raw', error.message);
    result = { raw: resultText };
  }

  return result;
}

async function sendEmailWithSmtp({ to, subject, html }) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.emailFrom) {
    throw new Error('SMTP não configurado.');
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

  const mailOptions = {
    from: env.emailFrom,
    to,
    subject,
    html
  };

  return transporter.sendMail(mailOptions);
}

async function sendEmail(to, subject, html) {
  console.log('[NotificationsService] Chamando função de email', { to, subject });
  if (!to) {
    console.warn('[NotificationsService] E-mail do destinatário ausente, pulando envio.');
    return {
      status: 'skipped',
      reason: 'E-mail não disponível.'
    };
  }

  if (env.resendApiKey) {
    const result = await sendEmailWithResend({ to, subject, html }).catch(function (error) {
      console.error('[NotificationsService] Erro no Resend', error.stack || error.message);
      throw error;
    });
    return {
      status: 'sent',
      provider: 'resend',
      response: result
    };
  }

  console.log('[NotificationsService] Resend não configurado, usando SMTP');
  const result = await sendEmailWithSmtp({ to, subject, html });
  return {
    status: 'sent',
    provider: 'smtp',
    response: result
  };
}

async function sendWhatsAppZapi(phone, message) {
  console.log('[NotificationsService] Chamando função WhatsApp Z-API', { phone, hasUrl: Boolean(env.whatsappZapiUrl), hasToken: Boolean(env.whatsappZapiToken) });
  if (!env.whatsappZapiUrl || !env.whatsappZapiToken) {
    console.warn('[NotificationsService] WhatsApp Z-API não configurado, pulando envio.');
    return {
      status: 'skipped',
      reason: 'WhatsApp Z-API não configurado.'
    };
  }

  const payload = {
    phone,
    message
  };
  console.log('[NotificationsService] Payload enviado para Z-API', payload);

  const response = await fetch(env.whatsappZapiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.whatsappZapiToken}`
    },
    body: JSON.stringify(payload)
  });

  const resultText = await response.text();
  console.log('[NotificationsService] Resposta da Z-API', {
    status: response.status,
    ok: response.ok,
    body: resultText
  });

  if (!response.ok) {
    throw new Error(`Z-API retornou ${response.status}: ${resultText}`);
  }

  let result = {};
  try {
    result = resultText ? JSON.parse(resultText) : {};
  } catch (error) {
    console.warn('[NotificationsService] Falha ao parsear resposta da Z-API, retornando raw', error.message);
    result = { raw: resultText };
  }

  return {
    status: 'sent',
    provider: 'z-api',
    response: result
  };
}

async function sendPickupNotification(order) {
  console.log('[NotificationsService] Entrando em sendPickupNotification', {
    orderId: order.id,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone
  });

  const emailPayload = buildNotificationData(order, {});
  const emailHtml = buildPickupEmailTemplate(emailPayload);
  const emailSubject = `Retirada presencial liberada para seu pedido ${emailPayload.orderNumber}`;
  const whatsappMessage = buildPickupWhatsAppMessage(emailPayload);

  console.log('[NotificationsService] Chamando sendEmail para pickup', { emailSubject });
  const emailResult = await sendEmail(order.customer_email, emailSubject, emailHtml).catch(function (error) {
    console.error('[NotificationsService] Erro ao enviar email de pickup', error.stack || error.message);
    return {
      status: 'failed',
      reason: error.message
    };
  });

  const whatsappDestination = normalizeWhatsAppNumber(order.customer_phone);
  console.log('[NotificationsService] Chamando sendWhatsAppZapi para pickup', { whatsappDestination });
  const whatsappResult = whatsappDestination
    ? await sendWhatsAppZapi(whatsappDestination, whatsappMessage).catch(function (error) {
        console.error('[NotificationsService] Erro ao enviar WhatsApp de pickup', error.stack || error.message);
        return {
          status: 'failed',
          reason: error.message
        };
      })
    : { status: 'skipped', reason: 'Telefone do cliente não disponível.' };

  console.log('[NotificationsService] sendPickupNotification finalizado', { emailResult, whatsappResult });
  return {
    email: emailResult,
    whatsapp: whatsappResult
  };
}

async function sendOrderTrackingNotification(order, data) {
  console.log('[NotificationsService] Entrando em sendOrderTrackingNotification', {
    orderId: order.id,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    data
  });

  const payload = buildNotificationData(order, data);
  const emailHtml = buildTrackingEmailTemplate(payload);
  const emailSubject = `Seu pedido ${payload.orderNumber} está a caminho`;
  const whatsappMessage = buildTrackingWhatsAppMessage(payload);

  console.log('[NotificationsService] Chamando sendEmail para rastreio', { emailSubject });
  const emailResult = await sendEmail(order.customer_email, emailSubject, emailHtml).catch(function (error) {
    console.error('[NotificationsService] Erro ao enviar email de rastreio', error.stack || error.message);
    return {
      status: 'failed',
      reason: error.message
    };
  });

  const whatsappDestination = normalizeWhatsAppNumber(order.customer_phone);
  console.log('[NotificationsService] Chamando sendWhatsAppZapi para rastreio', { whatsappDestination });
  const whatsappResult = whatsappDestination
    ? await sendWhatsAppZapi(whatsappDestination, whatsappMessage).catch(function (error) {
        console.error('[NotificationsService] Erro ao enviar WhatsApp de rastreio', error.stack || error.message);
        return {
          status: 'failed',
          reason: error.message
        };
      })
    : { status: 'skipped', reason: 'Telefone do cliente não disponível.' };

  console.log('[NotificationsService] sendOrderTrackingNotification finalizado', { emailResult, whatsappResult });
  return {
    email: emailResult,
    whatsapp: whatsappResult
  };
}

async function sendAdminNotification(order) {
  console.log('[AdminNotification] Entrando em sendAdminNotification', {
    orderId: order.id,
    orderNumber: order.order_number
  });

  const adminEmail = env.adminNotificationEmail;
  if (!adminEmail) {
    console.warn('[AdminNotification] Email do administrador não configurado. Pulando notificação interna.');
    return { status: 'skipped', reason: 'ADMIN_NOTIFICATION_EMAIL não configurado' };
  }

  const emailHtml = buildAdminEmailTemplate(order);
  const emailSubject = `🚨 NOVO PEDIDO APROVADO: ${order.order_number} - R$ ${Number(order.total_amount).toFixed(2).replace('.', ',')}`;

  console.log('[AdminNotification] Chamando sendEmail para a administração da loja', { adminEmail, emailSubject });
  
  const emailResult = await sendEmail(adminEmail, emailSubject, emailHtml).catch(function (error) {
    console.error('[AdminEmail] Erro ao enviar email administrativo', error.stack || error.message);
    return {
      status: 'failed',
      reason: error.message
    };
  });

  console.log('[AdminNotification] sendAdminNotification finalizado', { emailResult });
  return emailResult;
}

async function testResend() {
  console.log('[TestResend] Enviando email teste...');
  const testHtml = '<h1>Teste de E-mail Resend</h1><p>Se você recebeu isso, a API Key e o sender estão funcionando corretamente no backend da Rio Groove.</p>';
  try {
    const result = await sendEmailWithResend({
      to: env.adminNotificationEmail || 'riogroovemovimentos@gmail.com',
      subject: 'Rio Groove Store - Teste de Integração Resend',
      html: testHtml
    });
    console.log('[TestResend] Resposta Resend:', result);
    return { success: true, result };
  } catch (error) {
    console.error('[TestResend] Erro ao enviar email teste:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOrderTrackingNotification,
  sendPickupNotification,
  sendAdminNotification,
  testResend
};
