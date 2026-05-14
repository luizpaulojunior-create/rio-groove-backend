const env = require('../config/env');

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

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.melhorEnvioToken}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const responseText = await response.text();
    const message = `Melhor Envio retornou ${response.status}: ${responseText}`;
    throw new Error(message);
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error('Resposta inesperada da API de frete da Melhor Envio.');
  }

  return payload.map((option) => ({
    id: option.id || `${option.name}-${option.company?.name}-${option.service_code}`,
    name: option.name || 'Entrega',
    company: option.company?.name || 'Melhor Envio',
    price: Number(option.price) || 0,
    delivery_time: option.delivery_time || option.deadline || '',
    currency: option.currency || 'BRL'
  }));
}

module.exports = {
  getShippingQuote
};
