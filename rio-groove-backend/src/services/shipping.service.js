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

module.exports = {
  getShippingQuote
};
