const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCheckoutPayload } = require('../src/utils/validation');

test('validateCheckoutPayload rejects empty cart', () => {
  const result = validateCheckoutPayload({ items: [] });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => /pelo menos um item/i.test(err)));
});

test('validateCheckoutPayload rejects invalid customer email', () => {
  const result = validateCheckoutPayload({
    items: [{
      title: 'Camisa Teste',
      color: 'Preto',
      size: 'M',
      quantity: 1,
      unit_price: 99.9,
    }],
    customer: {
      name: 'Cliente Teste',
      email: 'invalido',
      phone: '21999999999',
      cpf: '12345678901',
    },
    address: {
      cep: '22723019',
      street: 'Rua Teste',
      number: '100',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    shipping: {
      id: '1',
      label: 'PAC',
      price: 20,
    },
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => /e-mail/i.test(err)));
});

test('validateCheckoutPayload accepts minimal valid payload', () => {
  const result = validateCheckoutPayload({
    items: [{
      title: 'Camisa Teste',
      color: 'Preto',
      size: 'M',
      quantity: 1,
      unit_price: 99.9,
    }],
    customer: {
      name: 'Cliente Teste',
      email: 'cliente@example.com',
      phone: '21999999999',
      cpf: '12345678901',
    },
    address: {
      cep: '22723019',
      street: 'Rua Teste',
      number: '100',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    shipping: {
      id: '1',
      label: 'PAC',
      price: 20,
    },
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.customer.email, 'cliente@example.com');
  assert.equal(result.data.total, 119.9);
});
