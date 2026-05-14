const env = require('../config/env');

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

function normalizeOption(option) {
  const companyName = option.company?.name || option.company || 'Melhor Envio';
  const serviceName = option.name || option.service || 'Entrega';

  return {
    id: option.id || `${serviceName}-${companyName}-${option.service_code || ''}`,
    name: serviceName,
    company: companyName,
    price: Number(option.price) || 0,
    delivery_time: option.delivery_time || option.deadline || '',
    currency: option.currency || 'BRL',
    service_code: option.service_code || ''
  };
}

function isStableProvider(option) {
  return STABLE_PROVIDER_PATTERNS.some(function (pattern) {
    return pattern.test(option.company) || pattern.test(option.name) || pattern.test(option.service_code);
  });
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

function filterStableOptions(options) {
  const stable = options.filter(function (option) {
    return isStableProvider(option) || isExpressOption(option);
  });
  return stable.length ? stable : options.slice(0, 5);
}

async function getShippingQuote({ cep, weight, height, width, length }) {
  if (!env.melhorEnvioToken) {
    throw new Error('MELHOR_ENVIO_TOKEN não configurado no backend.');
  }

  const apiUrl = env.melhorEnvioSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
    : 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';

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

  console.log('[ShippingQuote] Solicitação de frete recebida', {
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
        Authorization: `Bearer ${env.melhorEnvioToken}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const responseText = await response.text();
      const message = `Melhor Envio retornou ${response.status}: ${responseText}`;
      console.error('[ShippingQuote] API retornou erro', message);
      throw new Error(message);
    }

    const payload = await response.json();

    if (!Array.isArray(payload)) {
      console.error('[ShippingQuote] Resposta inválida da API de frete', payload);
      throw new Error('Resposta inesperada da API de frete da Melhor Envio.');
    }

    const allOptions = payload.map(normalizeOption);
    console.log('[ShippingQuote] Opções recebidas', allOptions.map(function (option) {
      return {
        id: option.id,
        company: option.company,
        name: option.name,
        price: option.price,
        delivery_time: option.delivery_time
      };
    }));

    const filtered = filterStableOptions(allOptions);
    const sorted = sortOptions(filtered).slice(0, 5);

    console.log('[ShippingQuote] Opções filtradas e ordenadas', sorted.map(function (option) {
      return {
        id: option.id,
        label: `${option.company} - ${option.name}`,
        price: option.price,
        delivery_time: option.delivery_time
      };
    }));

    return sorted;
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error.name === 'AbortError'
      ? 'Timeout de conexão com Melhor Envio.'
      : error.message;
    console.error('[ShippingQuote] Falha na cotação de frete', message);
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
  return env.melhorEnvioSandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment'
    : 'https://www.melhorenvio.com.br/api/v2/me/shipment';
}

async function executeMelhorEnvioRequest(endpoint, body) {
  if (!env.melhorEnvioToken) {
    throw new Error('MELHOR_ENVIO_TOKEN não configurado no backend.');
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
        Authorization: `Bearer ${env.melhorEnvioToken}`
      },
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Melhor Envio retornou ${response.status}: ${text}`);
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
  const requestBody = await ensureShippingRequestBody(order, shipmentId);
  console.log('[ShippingService] Comprando frete para pedido', order.id, shipmentId);
  const result = await executeMelhorEnvioRequest('/checkout', requestBody);
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
  const result = await executeMelhorEnvioRequest('/generate', { shipment_id: shipmentId });
  const labelData = extractLabelData(result);

  return {
    shipmentId,
    result,
    ...labelData
  };
}

async function printShippingLabel(shipmentId) {
  if (!shipmentId) {
    throw new Error('Shipment ID obrigatório para imprimir etiqueta.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, 15000);

  try {
    const url = `${getMelhorEnvioBaseUrl()}/print`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/pdf, application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.melhorEnvioToken}`
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Melhor Envio retornou ${response.status}: ${text}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return { shipmentId, pdf: buffer };
    }

    return { shipmentId, result: await response.json() };
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

module.exports = {
  getShippingQuote,
  purchaseShipping,
  generateShippingLabel,
  printShippingLabel,
  isPickupShippingMethod
};
