const { validatePosSalePayload, POS_PAYMENT_METHODS } = require('../src/utils/validation');
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

describe('validatePosSalePayload', () => {
  test('accepts a minimal fair sale with blank SKU', () => {
    const result = validatePosSalePayload({
      paymentMethod: 'pix',
      fairName: 'Feira da Glória',
      items: [
        {
          name: 'Zé Pilintra',
          slug: 'ze-pilintra',
          color: 'Black',
          size: 'M',
          quantity: 1,
          unitPrice: 129.9,
          sku: 'OVT-BLK-M-LS',
          stockItemId: 'stock-1',
        },
      ],
    });

    assert.equal(result.valid, true);
    assert.equal(result.data.paymentMethod, 'pix');
    assert.equal(result.data.fairName, 'Feira da Glória');
    assert.equal(result.data.items[0].sku, 'OVT-BLK-M-LS');
    assert.equal(result.data.total, 129.9);
  });

  test('rejects missing blank SKU/stock id and invalid payment', () => {
    const result = validatePosSalePayload({
      paymentMethod: 'boleto',
      items: [
        {
          name: 'Oxóssi',
          color: 'Off White',
          size: 'G',
          quantity: 1,
          unitPrice: 129.9,
        },
      ],
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => /SKU do blank/i.test(e)));
    assert.ok(result.errors.some((e) => /forma de pagamento/i.test(e)));
  });

  test('exposes allowed payment methods', () => {
    assert.ok(POS_PAYMENT_METHODS.has('pix'));
    assert.ok(POS_PAYMENT_METHODS.has('cash'));
    assert.ok(POS_PAYMENT_METHODS.has('card'));
  });
});
