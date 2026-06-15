/** Catálogo de insumos para pedidos personalizados (DTF — sem mínimo de peças). */

const MODELS_MASC_CAMISA = ['Oversized Tradicional', 'Regular', 'Regata'];

const MODELS_FEM_CAMISA = ['Baby look', 'Cropped', 'Oversized'];

const MODELS_MASC = MODELS_MASC_CAMISA;

const MODELS_FEM = MODELS_FEM_CAMISA;

const MODELS_CROPPED = ['Cropped'];

const MODELS_REGATA = ['Regata Tradicional', 'Regata Street', 'Regata Minimal'];

const MODELS_BONE = ['Trucker', 'Dad Hat', 'Snapback'];

const MODELS_CANECA = ['Caneca 330ml'];

const MODELS_ACESSORIO = ['Shoulder Bag', 'Chaveiro', 'Outro acessório'];

const SIZES_APPAREL = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

const VALID_INSUMOS = ['Camisa', 'Cropped', 'Regata', 'Boné', 'Caneca', 'Acessório'];

const VALID_ORDER_TYPES = ['ready_art', 'exclusive_art'];

const VALID_STATUSES = [
  'received', 'reviewing', 'mockup_ready', 'art_paid',
  'awaiting_product_payment', 'in_production', 'shipped', 'completed', 'cancelled',
];

function isCroppedOrder(body) {
  return body.insumo === 'Cropped' || String(body.segmento || '').toLowerCase() === 'cropped';
}

function modelsForInsumo(insumo, genero, segmento) {
  if (isCroppedOrder({ insumo, segmento })) {
    return MODELS_CROPPED;
  }
  switch (insumo) {
    case 'Regata':
      return MODELS_REGATA;
    case 'Boné':
      return MODELS_BONE;
    case 'Caneca':
      return MODELS_CANECA;
    case 'Acessório':
      return MODELS_ACESSORIO;
    case 'Camisa':
      if (genero === 'Feminino') return MODELS_FEM_CAMISA;
      if (genero === 'Masculino') return MODELS_MASC_CAMISA;
      return [];
    default:
      return [];
  }
}

function needsApparelSizes(insumo, segmento) {
  return ['Camisa', 'Cropped', 'Regata'].includes(insumo) || segmento === 'cropped';
}

function validateCustomOrderPayload(body) {
  const errors = [];

  if (!VALID_ORDER_TYPES.includes(body.order_type)) {
    errors.push('Tipo de pedido inválido.');
  }
  if (!body.contact_name?.trim()) errors.push('Nome é obrigatório.');
  if (!body.contact_email?.trim()) errors.push('E-mail é obrigatório.');
  if (!body.contact_phone?.trim()) errors.push('Telefone é obrigatório.');
  if (!VALID_INSUMOS.includes(body.insumo)) errors.push('Insumo inválido.');

  const qty = Number(body.quantity);
  if (!Number.isFinite(qty) || qty < 1) errors.push('Quantidade deve ser no mínimo 1.');

  if (['Camisa', 'Cropped'].includes(body.insumo) || isCroppedOrder(body)) {
    if (!['Masculino', 'Feminino'].includes(body.genero)) {
      errors.push('Gênero é obrigatório para este insumo.');
    }
  }

  if (isCroppedOrder(body) && body.genero && body.genero !== 'Feminino') {
    errors.push('Cropped é exclusivo para gênero feminino.');
  }

  const models = modelsForInsumo(body.insumo, body.genero, body.segmento);
  if (models.length && body.model && !models.includes(body.model)) {
    errors.push('Modelo inválido para o insumo selecionado.');
  }

  if (body.order_type === 'exclusive_art' && !body.brief_description?.trim()) {
    errors.push('Descreva a arte exclusiva desejada.');
  }

  if (body.rights_confirmed !== true && body.rights_confirmed !== 'true') {
    errors.push('Confirme que possui direitos sobre a arte enviada.');
  }

  return errors;
}

module.exports = {
  MODELS_MASC,
  MODELS_FEM,
  MODELS_CROPPED,
  MODELS_REGATA,
  MODELS_BONE,
  MODELS_CANECA,
  MODELS_ACESSORIO,
  SIZES_APPAREL,
  VALID_INSUMOS,
  VALID_ORDER_TYPES,
  VALID_STATUSES,
  modelsForInsumo,
  isCroppedOrder,
  needsApparelSizes,
  validateCustomOrderPayload,
};
