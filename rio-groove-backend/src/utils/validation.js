const { parseMoney, roundMoney } = require('./money');
const { normalizeString, onlyDigits, isValidEmail } = require('./order');

function normalizeItem(rawItem = {}) {
  const unitPrice = parseMoney(rawItem.unit_price ?? rawItem.price ?? rawItem.unitPrice);
  const quantity = Number(rawItem.quantity || 1);
  const productName = normalizeString(rawItem.title || rawItem.name);
  const color = normalizeString(rawItem.color);
  const size = normalizeString(rawItem.size);

  return {
    productName,
    slug: normalizeString(rawItem.slug),
    imageUrl: normalizeString(rawItem.image || rawItem.image_url || rawItem.data_image),
    color,
    size,
    quantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
    raw: rawItem
  };
}

function validateCheckoutPayload(body = {}) {
  const errors = [];
  const items = Array.isArray(body.items) ? body.items.map(normalizeItem) : [];

  if (!items.length) {
    errors.push('O checkout precisa ter pelo menos um item.');
  }

  items.forEach((item, index) => {
    if (!item.productName) errors.push(`Item ${index + 1}: nome obrigatório.`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1) errors.push(`Item ${index + 1}: quantidade inválida.`);
    if (item.unitPrice <= 0) errors.push(`Item ${index + 1}: preço inválido.`);
    if (!item.size) errors.push(`Item ${index + 1}: tamanho obrigatório.`);
    if (!item.color) errors.push(`Item ${index + 1}: cor obrigatória.`);
  });

  const customer = {
    name: normalizeString(body.customer?.name),
    email: normalizeString(body.customer?.email),
    phone: normalizeString(body.customer?.phone || body.customer?.whatsapp),
    cpf: onlyDigits(body.customer?.cpf),
    acceptsMarketing: Boolean(
      body.customer?.acceptsMarketing ||
      body.customer?.accepts_updates ||
      body.customer?.newsletter
    )
  };

  if (!customer.name) errors.push('Nome completo é obrigatório.');
  if (!isValidEmail(customer.email)) errors.push('E-mail inválido.');
  if (onlyDigits(customer.phone).length < 10) errors.push('Telefone/WhatsApp inválido.');
  if (customer.cpf && customer.cpf.length !== 11) errors.push('CPF inválido.');

  const address = {
    cep: onlyDigits(body.address?.cep),
    street: normalizeString(body.address?.street),
    number: normalizeString(body.address?.number),
    complement: normalizeString(body.address?.complement),
    neighborhood: normalizeString(body.address?.neighborhood),
    city: normalizeString(body.address?.city),
    state: normalizeString(body.address?.state).toUpperCase(),
    notes: normalizeString(body.notes || body.orderNotes || body.address?.notes)
  };

  if (address.cep.length !== 8) errors.push('CEP inválido.');
  if (!address.street) errors.push('Rua obrigatória.');
  if (!address.number) errors.push('Número obrigatório.');
  if (!address.neighborhood) errors.push('Bairro obrigatório.');
  if (!address.city) errors.push('Cidade obrigatória.');
  if (address.state.length !== 2) errors.push('Estado deve ter 2 letras.');

  const shipping = {
    label: normalizeString(body.shipping?.label || 'Entrega padrão'),
    price: parseMoney(body.shipping?.price),
    deadline: normalizeString(body.shipping?.deadline)
  };

  if (shipping.price < 0) {
    errors.push('Valor de frete inválido.');
  }

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const total = roundMoney(subtotal + shipping.price);

  return {
    valid: errors.length === 0,
    errors,
    data: {
      items,
      customer,
      address,
      shipping,
      subtotal,
      total,
      rawPayload: body
    }
  };
}

function validateShippingQuotePayload(body = {}) {
  const errors = [];
  const cep = onlyDigits(body.cep || '');
  const weight = Number(body.weight || 0);
  const height = Number(body.height || 0);
  const width = Number(body.width || 0);
  const length = Number(body.length || 0);

  if (cep.length !== 8) {
    errors.push('CEP inválido. Deve conter 8 números.');
  }
  if (!weight || weight <= 0) {
    errors.push('Peso inválido.');
  }
  if (!height || height <= 0) {
    errors.push('Altura inválida.');
  }
  if (!width || width <= 0) {
    errors.push('Largura inválida.');
  }
  if (!length || length <= 0) {
    errors.push('Comprimento inválido.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      cep,
      weight,
      height,
      width,
      length
    }
  };
}

module.exports = {
  validateCheckoutPayload,
  validateShippingQuotePayload
};
