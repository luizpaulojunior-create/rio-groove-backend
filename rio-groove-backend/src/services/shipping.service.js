const env = require('../config/env');
const { getValidToken } = require('./melhorEnvioAuth.service');

const STABLE_PROVIDER_PATTERNS = [
  /correios/i,
  /jadlog/i,
  /loggi/i
];

const EXPRESS_NAME_PATTERNS = [
  /express/i,
  /same\s*day/i,
  /next\s*day/i,
  /dia\s*seguinte/i,
  /urgente/i
];

function formatDeliveryTime(option) {
  const days =
    parseInt(String(option.custom_delivery_time), 10)
    || parseInt(String(option.delivery_time), 10)
    || 0;
  if (days <= 0) {
    const raw = String(option.delivery_time || option.deadline || '').trim();
    if (raw && Number.isNaN(Number(raw))) return raw;
    return 'A calcular';
  }
  if (days === 1) return '1 dia útil';
  return `${days} dias úteis`;
}

function normalizeOption(option) {
  const companyName = option.company?.name || option.company || 'Melhor Envio';
  const serviceName = option.name || option.service || 'Entrega';

  return {
    id: option.id || `${serviceName}-${companyName}-${option.service_code || ''}`,
    name: serviceName,
    company: companyName,
    label: `${companyName} / ${serviceName}`,
    price: Number(option.price) || 0,
    delivery_time: formatDeliveryTime(option),
    delivery_days: parseInt(String(option.custom_delivery_time), 10)
      || parseInt(String(option.delivery_time), 10)
      || 0,
    currency: option.currency || 'BRL',
    service_code: option.service_code || ''
  };
}

function isExpressOption(option) {
  return EXPRESS_NAME_PATTERNS.some(function (pattern) {
    return pattern.test(option.name) || pattern.test(option.company) || pattern.test(option.service_code);
  });
}

function sortOptions(options) {
  return options.slice().sort(function (a, b) {
    const aExpress = isExpressOption(a) ? 0 : 1;
    const bExpress = isExpressOption(b) ? 0 : 1;
    if (aExpress !== bExpress) return aExpress - bExpress;
    if (a.price !== b.price) return a.price - b.price;
    return a.delivery_time.localeCompare(b.delivery_time || '');
  });
}

function filterValidOptions(options) {
  return options.filter(function (option) {
    return option.price > 0 && option.company && option.name;
  });
}

async function getShippingQuote({ cep, weight, height, width, length }) {
  const token = await getValidToken();
  const tokenPrefix = token ? token.substring(0, 15) + '...' : 'NENHUM';
  const tokenOrigin = (token && token === env.melhorEnvioToken) ? 'env' : 'supabase';
  
  console.log(`[MelhorEnvio] getShippingQuote - Origem do token: ${tokenOrigin} | Prefixo: ${tokenPrefix}`);
  console.log(`[MelhorEnvio] getShippingQuote - Header enviado: Authorization: Bearer ${tokenPrefix}`);

  if (!token) {
    throw new Error('Token do Melhor Envio não configurado no backend.');
  }

  const apiUrl = env.melhorEnvioSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
    : 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

  console.log('[MelhorEnvio] Ambiente Efetivo Sandbox:', env.melhorEnvioSandbox);
  console.log('[MelhorEnvio] URL Final de Cotação:', apiUrl);

  const requestBody = {
    from: {
      postal_code: env.melhorEnvioOriginCep
    },
    to: {
      postal_code: cep
    },
    products: [
      {
        weight: Number(weight) || 0.35,
        width: Number(width) || 30,
        height: Number(height) || 5,
        length: Number(length) || 25,
        quantity: 1,
        insurance_value: 0
      }
    ]
  };

  console.log('[MelhorEnvio] Payload enviado', JSON.stringify(requestBody, null, 2));
  console.log('[MelhorEnvio] Solicitação de frete recebida', {
    cep,
    weight,
    height,
    width,
    length,
    sandbox: env.melhorEnvioSandbox
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, 12000);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const responseText = await response.text();
      const message = `Melhor Envio retornou ${response.status}: ${responseText}`;
      console.error('[MelhorEnvio] API retornou erro', message);
      throw new Error(message);
    }

    const payload = await response.json();
    console.log('[MelhorEnvio] Resposta completa da API', payload);

    if (!Array.isArray(payload)) {
      console.error('[MelhorEnvio] Resposta inválida da API de frete', payload);
      throw new Error('Resposta inesperada da API de frete da Melhor Envio.');
    }

    const allOptions = payload.map(normalizeOption);
    console.log('[MelhorEnvio] Opções brutas recebidas', allOptions.map(function (option) {
      return {
        id: option.id,
        label: option.label,
        price: option.price,
        delivery_time: option.delivery_time,
        service_code: option.service_code
      };
    }));

    const filtered = filterValidOptions(allOptions);
    const sorted = sortOptions(filtered);

    console.log('[MelhorEnvio] Serviços renderizados no backend', sorted.map(function (option) {
      return {
        id: option.id,
        label: option.label,
        price: option.price,
        delivery_time: option.delivery_time,
        service_code: option.service_code
      };
    }));

    return sorted;
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error.name === 'AbortError'
      ? 'Timeout de conexão com Melhor Envio.'
      : error.message;
    console.error('[MelhorEnvio] Falha na cotação de frete', message);
    throw new Error(message);
  }
}

async function ensureShippingRequestBody(order, shipmentId) {
  if (!order || !shipmentId) {
    throw new Error('Pedido ou shipmentId inválido para compra de frete.');
  }

  const products = (order.items || []).map(function (item) {
    const metadata = item.metadata_json || {};
    return {
      weight: Number(metadata.weight || metadata.peso || 0.35),
      width: Number(metadata.width || metadata.largura || 30),
      height: Number(metadata.height || metadata.altura || 5),
      length: Number(metadata.length || metadata.comprimento || 25),
      quantity: Number(item.quantity) || 1,
      insurance_value: 0
    };
  });

  return {
    shipment_id: shipmentId,
    from: {
      postal_code: env.melhorEnvioOriginCep
    },
    to: {
      postal_code: order.shipping_cep,
      street_name: order.shipping_street,
      street_number: order.shipping_number,
      neighborhood: order.shipping_neighborhood,
      city: order.shipping_city,
      federal_unit: order.shipping_state
    },
    products
  };
}

function getMelhorEnvioBaseUrl() {
  const url = env.melhorEnvioSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment'
    : 'https://melhorenvio.com.br/api/v2/me/shipment';
  
  console.log('[MelhorEnvio] Base URL para operações:', url, '| Sandbox env:', env.melhorEnvioSandbox);
  return url;
}

function getMelhorEnvioApiRoot() {
  return env.melhorEnvioSandbox
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';
}

function isPdfBuffer(buffer) {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

function extractMelhorEnvioUrl(payload) {
  if (!payload) return null;

  if (typeof payload === 'string') {
    const trimmed = payload.trim().replace(/^["']|["']$/g, '');
    if (trimmed.startsWith('http')) return trimmed;
    try {
      return extractMelhorEnvioUrl(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractMelhorEnvioUrl(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof payload === 'object') {
    const direct =
      payload.url ||
      payload.link ||
      payload.pdf ||
      payload.file ||
      payload.protocol ||
      payload.label_url ||
      payload.labelUrl;
    if (direct && String(direct).startsWith('http')) return String(direct);

    for (const [key, value] of Object.entries(payload)) {
      if (String(key).startsWith('http')) return String(key);
      const found = extractMelhorEnvioUrl(value);
      if (found) return found;
    }
  }

  return null;
}

function getMelhorEnvioUserAgent() {
  const name = env.storeName || 'Rio Groove Admin';
  const email = env.storeEmail || env.adminNotificationEmail || 'contato@riogroovemovimentos.com.br';
  return `${name} (${email})`;
}

function formatMelhorEnvioHttpError(status, bodyText) {
  const text = String(bodyText || '').trim();

  if (status === 403 && (/<html/i.test(text) || /Acesso indisponível/i.test(text))) {
    return new Error(
      'Melhor Envio negou impressão (403). Vá em Configurações → Reconectar Melhor Envio para autorizar impressão de etiquetas (shipping-print).',
    );
  }

  if (/<html/i.test(text)) {
    return new Error(`Melhor Envio retornou ${status}. Reconecte a integração em Configurações.`);
  }

  try {
    const json = JSON.parse(text);
    return new Error(json.message || `Melhor Envio retornou ${status}.`);
  } catch {
    return new Error(`Melhor Envio retornou ${status}: ${text.slice(0, 240)}`);
  }
}

async function fetchRemotePdfBuffer(pdfUrl) {
  const headers = { 'User-Agent': getMelhorEnvioUserAgent() };

  const response = await fetch(pdfUrl, { headers, redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`Falha ao baixar PDF (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (isPdfBuffer(buffer)) {
    return buffer;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
    return buffer;
  }

  throw new Error('URL retornada não é um PDF.');
}

async function fetchMelhorEnvioOrderDetails(shipmentId) {
  const root = getMelhorEnvioApiRoot();
  const token = await getValidToken();
  if (!token) return null;

  const response = await fetch(`${root}/api/v2/me/orders/${encodeURIComponent(String(shipmentId))}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getMelhorEnvioUserAgent(),
    },
  });

  if (!response.ok) {
    console.warn('[MelhorEnvio] orders/{id} retornou', response.status);
    return null;
  }

  return response.json();
}

async function executeMelhorEnvioRequest(endpoint, body) {
  const token = await getValidToken();
  const tokenPrefix = token ? token.substring(0, 15) + '...' : 'NENHUM';
  const tokenOrigin = (token && token === env.melhorEnvioToken) ? 'env' : 'supabase';

  console.log(`[MelhorEnvio] executeMelhorEnvioRequest - Endpoint: ${endpoint}`);
  console.log(`[MelhorEnvio] executeMelhorEnvioRequest - Origem do token: ${tokenOrigin} | Prefixo: ${tokenPrefix}`);
  console.log(`[MelhorEnvio] executeMelhorEnvioRequest - Header enviado: Authorization: Bearer ${tokenPrefix}`);

  if (!token) {
    throw new Error('Token do Melhor Envio não configurado no backend.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, 15000);

  try {
    const url = `${getMelhorEnvioBaseUrl()}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getMelhorEnvioUserAgent(),
      },
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw formatMelhorEnvioHttpError(response.status, text);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.arrayBuffer();
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error.name === 'AbortError'
      ? 'Timeout de conexão com Melhor Envio.'
      : error.message;
    throw new Error(message);
  }
}

async function purchaseShipping(order, shipmentId) {
  console.log('[ShippingService] Comprando frete para pedido', order.id, shipmentId);
  const result = await executeMelhorEnvioRequest('/checkout', { orders: [String(shipmentId)] });
  return {
    shipmentId: shipmentId,
    result
  };
}

function extractLabelData(result) {
  if (!result || typeof result !== 'object') return {};

  const trackingCode = result.tracking_code || result.trackingCode || result.tracking?.code || result.tracking?.tracking_code || '';
  const trackingUrl = result.tracking_url || result.trackingUrl || result.url || result.label_url || result.labelUrl || '';
  const labelUrl = result.url || result.label_url || result.labelUrl || '';

  return {
    trackingCode,
    trackingUrl,
    labelUrl
  };
}

async function generateShippingLabel(shipmentId) {
  if (!shipmentId) {
    throw new Error('Shipment ID obrigatório para gerar etiqueta.');
  }

  console.log('[ShippingService] Gerando etiqueta para shipment', shipmentId);
  try {
    const result = await executeMelhorEnvioRequest('/generate', { orders: [String(shipmentId)] });
    const labelData = extractLabelData(result);

    return {
      shipmentId,
      result,
      ...labelData
    };
  } catch (error) {
    if (isAlreadyGeneratedMelhorEnvioError(error.message)) {
      console.log('[ShippingService] Etiqueta já gerada no Melhor Envio.');
      return {
        shipmentId,
        result: { alreadyGenerated: true },
        trackingCode: '',
        trackingUrl: '',
        labelUrl: '',
      };
    }
    throw error;
  }
}

async function printShippingLabel(shipmentId, { mode = 'public' } = {}) {
  if (!shipmentId) {
    throw new Error('Shipment ID obrigatório para imprimir etiqueta.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, 15000);

  try {
    const url = `${getMelhorEnvioBaseUrl()}/print`;
    const token = await getValidToken();
    const tokenPrefix = token ? token.substring(0, 15) + '...' : 'NENHUM';
    const tokenOrigin = (token && token === env.melhorEnvioToken) ? 'env' : 'supabase';
    
    console.log(`[MelhorEnvio] printShippingLabel - Origem do token: ${tokenOrigin} | Prefixo: ${tokenPrefix} | mode: ${mode}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/pdf, application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getMelhorEnvioUserAgent(),
      },
      body: JSON.stringify({ mode, orders: [String(shipmentId)] }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw formatMelhorEnvioHttpError(response.status, text);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return { shipmentId, pdf: buffer };
    }

    return { shipmentId, result: await response.json() };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout de conexão com Melhor Envio.');
    }
    throw error;
  }
}

/** Baixa bytes do PDF via API ME (proxy server-side — evita link privado no browser). */
async function downloadShippingLabelPdf(shipmentId) {
  if (!shipmentId) {
    throw new Error('Shipment ID obrigatório para baixar PDF.');
  }

  const token = await getValidToken();
  if (!token) {
    throw new Error('Token do Melhor Envio não configurado no backend.');
  }

  const root = getMelhorEnvioApiRoot();
  const imprimirUrl = `${root}/api/v2/me/imprimir/pdf/${encodeURIComponent(String(shipmentId))}`;

  console.log('[MelhorEnvio] downloadShippingLabelPdf via', imprimirUrl);

  try {
    const fileRes = await fetch(imprimirUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': getMelhorEnvioUserAgent(),
      },
    });

    if (fileRes.ok) {
      const contentType = fileRes.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const pdf = Buffer.from(await fileRes.arrayBuffer());
        if (isPdfBuffer(pdf)) {
          return { pdf, labelUrl: null, source: 'imprimir-direct' };
        }
      }

      const rawText = await fileRes.text();
      let payload;
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = rawText;
      }

      const pdfUrl = extractMelhorEnvioUrl(payload);
      if (pdfUrl) {
        const pdf = await fetchRemotePdfBuffer(pdfUrl);
        return { pdf, labelUrl: pdfUrl, source: 'imprimir-s3' };
      }
    } else if (fileRes.status === 403) {
      throw formatMelhorEnvioHttpError(403, await fileRes.text());
    } else {
      const errText = await fileRes.text();
      console.warn('[MelhorEnvio] imprimir/pdf retornou', fileRes.status, errText.slice(0, 300));
    }
  } catch (error) {
    console.warn('[MelhorEnvio] imprimir/pdf falhou:', error.message);
  }

  try {
    const orderDetails = await fetchMelhorEnvioOrderDetails(shipmentId);
    const orderPdfUrl = extractMelhorEnvioUrl(orderDetails?.protocol) ||
      extractMelhorEnvioUrl(orderDetails?.pdf) ||
      extractMelhorEnvioUrl(orderDetails?.files) ||
      extractMelhorEnvioUrl(orderDetails);
    if (orderPdfUrl) {
      const pdf = await fetchRemotePdfBuffer(orderPdfUrl);
      return { pdf, labelUrl: orderPdfUrl, source: 'orders-detail' };
    }
  } catch (error) {
    console.warn('[MelhorEnvio] orders/{id} falhou:', error.message);
  }

  let printResult;
  try {
    printResult = await printShippingLabel(shipmentId, { mode: 'public' });
  } catch (printError) {
    if (printError.message?.includes('403') || printError.message?.includes('shipping-print')) {
      throw printError;
    }
    console.warn('[MelhorEnvio] print public falhou, tentando generate:', printError.message?.slice(0, 120));
    await generateShippingLabel(shipmentId);
    printResult = await printShippingLabel(shipmentId, { mode: 'public' });
  }

  if (printResult.pdf) {
    return { pdf: printResult.pdf, labelUrl: null, source: 'print-direct' };
  }

  const printUrl = extractMelhorEnvioUrl(printResult.result) || extractMelhorEnvioUrl(printResult);
  if (printUrl && /amazonaws\.com/i.test(printUrl)) {
    try {
      const pdf = await fetchRemotePdfBuffer(printUrl);
      return { pdf, labelUrl: printUrl, source: 'print-url-pdf' };
    } catch (fetchError) {
      console.warn('[MelhorEnvio] S3 print URL falhou:', fetchError.message);
    }
  }

  throw new Error(
    'PDF da etiqueta indisponível. Reconecte o Melhor Envio em Configurações (permissão shipping-print) e tente Baixar PDF novamente.',
  );
}

async function createShipmentInCart(order, serviceId) {
  const token = await getValidToken();
  const tokenPrefix = token ? token.substring(0, 15) + '...' : 'NENHUM';
  const tokenOrigin = (token && token === env.melhorEnvioToken) ? 'env' : 'supabase';

  console.log(`[MelhorEnvio] createShipmentInCart - Origem do token: ${tokenOrigin} | Prefixo: ${tokenPrefix}`);
  console.log(`[MelhorEnvio] createShipmentInCart - Header enviado: Authorization: Bearer ${tokenPrefix}`);

  if (!token) {
    throw new Error('Token do Melhor Envio não configurado no backend.');
  }

  const apiUrl = env.melhorEnvioSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/cart'
    : 'https://melhorenvio.com.br/api/v2/me/cart';

  console.log('[MelhorEnvio] Ambiente Efetivo Sandbox (Cart):', env.melhorEnvioSandbox);
  console.log('[MelhorEnvio] URL Final de Cart:', apiUrl);

  let totalWeight = 0;
  let maxHeight = 0;
  let maxWidth = 0;
  let maxLength = 0;

  const products = (order.items || []).map(function (item) {
    const metadata = item.metadata_json || {};
    const qty = Number(item.quantity) || 1;
    const w = Number(metadata.weight || metadata.peso || 0.35);
    const h = Number(metadata.height || metadata.altura || 5);
    const wd = Number(metadata.width || metadata.largura || 30);
    const l = Number(metadata.length || metadata.comprimento || 25);
    
    totalWeight += w * qty;
    maxHeight = Math.max(maxHeight, h);
    maxWidth = Math.max(maxWidth, wd);
    maxLength = Math.max(maxLength, l);

    return {
      name: item.product_name || 'Produto Rio Groove',
      quantity: qty,
      unitary_value: Number(item.unit_price) || 0
    };
  });

  const totalItems = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  if (totalItems > 3) {
    maxWidth = Math.max(maxWidth, 40);
    maxLength = Math.max(maxLength, 35);
  }

  const volumes = [
    {
      weight: Math.max(totalWeight, 0.35),
      height: Math.max(maxHeight, 3),
      width: Math.max(maxWidth, 20),
      length: Math.max(maxLength, 20)
    }
  ];

  const parsedServiceId = parseInt(String(serviceId).split('-')[0], 10);
  
  if (!parsedServiceId || isNaN(parsedServiceId)) {
    throw new Error(`ID de serviço (serviceId) inválido: ${serviceId}`);
  }

  const insuranceValue = Math.max(
    Number(order.total_amount || order.total || 1),
    1
  );
  console.log('[MelhorEnvio] insurance_value final:', insuranceValue);

  const requestBody = {
    service: parsedServiceId,
    from: {
      name: env.storeName,
      phone: String(env.storePhone).replace(/\D/g, ''),
      email: env.storeEmail,
      document: String(env.storeDocument).replace(/\D/g, ''),
      company_document: String(env.storeCompanyDocument).replace(/\D/g, ''),
      state_register: env.storeStateRegister,
      address: env.storeAddress,
      complement: env.storeComplement,
      number: env.storeNumber,
      district: env.storeDistrict,
      city: env.storeCity,
      country_id: 'BR',
      postal_code: String(env.storePostalCode).replace(/\D/g, ''),
      note: '',
      state_abbr: env.storeStateAbbr
    },
    to: {
      name: order.customer_name || 'Cliente',
      phone: String(order.customer_phone || '').replace(/\D/g, '').slice(0, 11),
      email: order.customer_email || 'cliente@riogroove.com.br',
      document: String(order.customer_cpf || '').replace(/\D/g, ''),
      address: order.shipping_street || 'Rua',
      number: order.shipping_number || 'S/N',
      complement: order.shipping_complement || '',
      district: order.shipping_neighborhood || 'Bairro',
      city: order.shipping_city || 'Cidade',
      state_abbr: order.shipping_state || 'RJ',
      postal_code: String(order.shipping_cep || '').replace(/\D/g, '')
    },
    products,
    volumes,
    options: {
      insurance_value: insuranceValue,
      receipt: false,
      own_hand: false,
      reverse_manage: false,
      non_commercial: true
    }
  };

  console.log('[MelhorEnvio] Payload enviado para /me/cart:', JSON.stringify(requestBody, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error('[MelhorEnvio] Erro na API do carrinho:', text);
      throw new Error(`Melhor Envio retornou ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('[MelhorEnvio] Resposta de sucesso (Cart):', JSON.stringify(data, null, 2));
    return data.id;
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error.name === 'AbortError'
      ? 'Timeout de conexão com Melhor Envio.'
      : error.message;
    throw new Error(message);
  }
}

function isPickupShippingMethod(shippingMethod) {
  return typeof shippingMethod === 'string' && /retirada|pickup|loja|presencial/i.test(shippingMethod);
}

function resolveMelhorEnvioServiceId(order) {
  const raw = order?.raw_checkout_payload || {};
  const shipping = raw.shipping || {};
  return shipping.id || shipping.service_id || null;
}

const LABEL_READY_STATUSES = new Set(['purchased', 'label_generated']);

const ME_PURCHASED_STATUSES = new Set(['released', 'posted', 'delivered', 'undelivered', 'suspended']);

function isMelhorEnvioShipmentUuid(value) {
  const normalized = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized);
}

function isAlreadyPurchasedMelhorEnvioError(message) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('já comprad') ||
    text.includes('ja comprad') ||
    text.includes('already') ||
    text.includes('already paid') ||
    text.includes('já pago') ||
    text.includes('ja pago')
  );
}

function isAlreadyGeneratedMelhorEnvioError(message) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('já gerad') ||
    text.includes('ja gerad') ||
    text.includes('already generated') ||
    text.includes('already been generated')
  );
}

async function resolveMelhorEnvioShipmentId(order, createIfMissing = false) {
  const stored = order?.melhor_envio_shipment_id;
  if (stored && isMelhorEnvioShipmentUuid(stored)) {
    return String(stored);
  }

  if (!createIfMissing) {
    return null;
  }

  const serviceId = resolveMelhorEnvioServiceId(order);
  if (!serviceId || serviceId === 'null') {
    throw new Error('Pedido sem envio vinculado ao Melhor Envio. Confirme o pagamento antes de gerar a etiqueta.');
  }

  const shipmentId = await createShipmentInCart(order, serviceId);
  return String(shipmentId);
}

async function isMelhorEnvioShipmentPurchased(shipmentId) {
  try {
    const trackingPayload = await fetchMelhorEnvioTracking([shipmentId]);
    const shipmentData = trackingPayload[String(shipmentId)] || trackingPayload[shipmentId] || null;
    if (!shipmentData) return false;

    const meStatus = String(shipmentData.status || shipmentData.situation || '').toLowerCase();
    return ME_PURCHASED_STATUSES.has(meStatus);
  } catch (error) {
    console.warn('[ShippingService] Falha ao consultar status ME antes da compra:', error.message);
    return false;
  }
}

async function ensureShippingPurchased(order, shipmentId) {
  if (LABEL_READY_STATUSES.has(order.shipping_status)) {
    return { alreadyPurchased: true, shipmentId };
  }

  if (await isMelhorEnvioShipmentPurchased(shipmentId)) {
    return { alreadyPurchased: true, shipmentId };
  }

  try {
    const purchaseResult = await purchaseShipping(order, shipmentId);
    return { alreadyPurchased: false, shipmentId, purchaseResult };
  } catch (error) {
    if (isAlreadyPurchasedMelhorEnvioError(error.message)) {
      console.log('[ShippingService] Frete já pago no Melhor Envio, seguindo para geração.');
      return { alreadyPurchased: true, shipmentId };
    }
    throw error;
  }
}

const ME_STATUS_TO_FULFILLMENT = {
  pending: 'preparando_envio',
  released: 'etiqueta_gerada',
  posted: 'postado',
  delivered: 'entregue',
  undelivered: 'em_transito',
  suspended: 'em_transito',
  canceled: 'cancelado',
};

function mapMelhorEnvioStatusToFulfillment(meStatus) {
  const key = String(meStatus || '').toLowerCase().trim();
  return ME_STATUS_TO_FULFILLMENT[key] || null;
}

async function fetchMelhorEnvioTracking(shipmentIds = []) {
  const ids = [...new Set(shipmentIds.filter(Boolean).map(String))];
  if (!ids.length) return {};

  const token = await getValidToken();
  if (!token) {
    throw new Error('Token do Melhor Envio não configurado no backend.');
  }

  const apiUrl = env.melhorEnvioSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/tracking'
    : 'https://melhorenvio.com.br/api/v2/me/shipment/tracking';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getMelhorEnvioUserAgent(),
    },
    body: JSON.stringify({ orders: ids }),
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Resposta inválida do Melhor Envio (tracking): ${text}`);
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Melhor Envio tracking ${response.status}`);
  }

  return payload;
}

async function syncOrderTrackingFromMelhorEnvio(order) {
  const shipmentId = order?.melhor_envio_shipment_id;
  if (!shipmentId) {
    return {
      order,
      synced: false,
      reason: 'Pedido sem envio Melhor Envio.',
    };
  }

  const trackingPayload = await fetchMelhorEnvioTracking([shipmentId]);
  const shipmentData = trackingPayload[String(shipmentId)] || trackingPayload[shipmentId] || null;

  if (!shipmentData) {
    return {
      order,
      synced: false,
      reason: 'Rastreio ainda indisponível no Melhor Envio.',
      raw: trackingPayload,
    };
  }

  const meStatus = shipmentData.status || shipmentData.situation || shipmentData.tracking?.status;
  const trackingCode =
    shipmentData.tracking ||
    shipmentData.tracking_code ||
    shipmentData.trackingCode ||
    order.shipping_tracking_code ||
    null;

  const mappedFulfillment = mapMelhorEnvioStatusToFulfillment(meStatus);
  const updates = {};

  if (trackingCode && trackingCode !== order.shipping_tracking_code) {
    updates.shipping_tracking_code = String(trackingCode);
  }

  if (mappedFulfillment && mappedFulfillment !== order.fulfillment_status) {
    updates.fulfillment_status = mappedFulfillment;
    updates.shipping_status = mappedFulfillment;
  }

  let updatedOrder = order;
  if (Object.keys(updates).length > 0) {
    const { updateOrderById } = require('./orders.service');
    updatedOrder = await updateOrderById(order.id, updates);
  }

  return {
    order: updatedOrder,
    synced: true,
    melhorEnvioStatus: meStatus,
    fulfillmentStatus: mappedFulfillment || order.fulfillment_status,
    trackingCode: trackingCode || order.shipping_tracking_code,
    raw: shipmentData,
  };
}

module.exports = {
  getShippingQuote,
  purchaseShipping,
  generateShippingLabel,
  printShippingLabel,
  downloadShippingLabelPdf,
  isPickupShippingMethod,
  createShipmentInCart,
  getMelhorEnvioUserAgent,
  resolveMelhorEnvioShipmentId,
  resolveMelhorEnvioServiceId,
  ensureShippingPurchased,
  isMelhorEnvioShipmentUuid,
  LABEL_READY_STATUSES,
  fetchMelhorEnvioTracking,
  syncOrderTrackingFromMelhorEnvio,
  mapMelhorEnvioStatusToFulfillment,
};
