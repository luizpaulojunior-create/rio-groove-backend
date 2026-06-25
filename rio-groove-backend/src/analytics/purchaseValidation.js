function validatePurchasePayload(purchase) {
  const errors = [];
  const transactionId = String(purchase?.transaction_id || '').trim();

  if (!transactionId) errors.push('transaction_id ausente');

  const value = Number(purchase?.value);
  if (!Number.isFinite(value) || value < 0) errors.push('value inválido');

  const currency = String(purchase?.currency || '').trim();
  if (!currency || currency.length !== 3) errors.push('currency inválida');

  const items = Array.isArray(purchase?.items) ? purchase.items : [];
  if (!items.length) {
    errors.push('items vazio');
  } else {
    items.forEach((item, index) => {
      const name = String(item?.item_name || item?.name || '').trim();
      const id = String(item?.item_id || item?.id || '').trim();
      if (!id) errors.push(`items[${index}].item_id ausente`);
      if (!name) errors.push(`items[${index}].item_name ausente`);
      const price = Number(item?.price ?? item?.unit_price);
      if (!Number.isFinite(price)) errors.push(`items[${index}].price inválido`);
      const qty = Number(item?.quantity || 1);
      if (!Number.isFinite(qty) || qty < 1) errors.push(`items[${index}].quantity inválido`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    transactionId,
    value,
    currency,
    itemCount: items.length,
  };
}

module.exports = {
  validatePurchasePayload,
};
