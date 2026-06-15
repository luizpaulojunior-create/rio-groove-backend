const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { uploadCustomOrderFile, uploadImage } = require('./upload.service');
const { STORAGE_BUCKET, STORAGE_PATHS } = require('../config/storage');
const { validateCustomOrderPayload, VALID_STATUSES } = require('../config/customProducts');
const { computeOrderPricing, getProductPaymentTotal } = require('../config/customPricing');
const { getCustomOrderPackage } = require('../config/customShipping');
const { getShippingQuote } = require('./shipping.service');
const { onlyDigits } = require('../utils/order');
const { createCustomOrderPaymentPreference, parseCustomPaymentRef } = require('./customOrdersPayment.service');

function generateProtocol() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RG-PERS-${year}-${suffix}`;
}

function generateAccessToken() {
  return crypto.randomBytes(24).toString('hex');
}

function parseJsonField(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function canViewMockup(order) {
  if (order.order_type === 'ready_art') return true;
  return order.art_payment_status === 'paid' || order.art_payment_status === 'not_required';
}

function sanitizeOrderForCustomer(order, { includeFiles = true } = {}) {
  if (!order) return null;
  const viewMockup = canViewMockup(order);
  const files = includeFiles && Array.isArray(order.custom_order_files)
    ? order.custom_order_files.map((f) => {
        if (f.kind === 'mockup' && !viewMockup) {
          return { ...f, storage_url: null, locked: true };
        }
        return { ...f, locked: false };
      })
    : [];

  return {
    id: order.id,
    protocol: order.protocol,
    access_token: order.access_token,
    order_type: order.order_type,
    status: order.status,
    contact_name: order.contact_name,
    contact_email: order.contact_email,
    contact_phone: order.contact_phone,
    insumo: order.insumo,
    genero: order.genero,
    model: order.model,
    segmento: order.segmento,
    quantity: order.quantity,
    size_breakdown: order.size_breakdown,
    blank_color: order.blank_color,
    print_placements: order.print_placements,
    brief_title: order.brief_title,
    brief_description: order.brief_description,
    style_reference: order.style_reference,
    usage_type: order.usage_type,
    customer_notes: order.customer_notes,
    art_fee_amount: order.art_fee_amount,
    product_unit_amount: order.product_unit_amount,
    shipping_amount: order.shipping_amount,
    product_payment_total: getProductPaymentTotal(order),
    art_payment_status: order.art_payment_status,
    product_payment_status: order.product_payment_status,
    art_fee_paid_at: order.art_fee_paid_at,
    product_paid_at: order.product_paid_at,
    revision_count: order.revision_count,
    max_revisions: order.max_revisions,
    mockup_ready_at: order.mockup_ready_at,
    approved_at: order.approved_at,
    mockup_unlocked: viewMockup,
    custom_order_files: files,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

function assertCustomerOwnsOrder(order, user) {
  if (!order) {
    const err = new Error('Pedido não encontrado.');
    err.statusCode = 404;
    throw err;
  }
  const email = String(user.email || '').trim().toLowerCase();
  const orderEmail = String(order.contact_email || '').trim().toLowerCase();
  if (order.customer_id && order.customer_id === user.id) return;
  if (orderEmail && orderEmail === email) return;
  const err = new Error('Pedido não encontrado.');
  err.statusCode = 404;
  throw err;
}

async function createCustomOrder(body, files = [], user = null) {
  const errors = validateCustomOrderPayload(body);
  if (errors.length) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }

  const pricing = computeOrderPricing(body);
  if (pricing.productUnit == null) {
    const err = new Error('Preço não disponível para este insumo. Entre em contato.');
    err.statusCode = 400;
    throw err;
  }
  if (body.order_type === 'exclusive_art' && pricing.artFee == null) {
    const err = new Error('Taxa de arte não disponível para este insumo.');
    err.statusCode = 400;
    throw err;
  }

  const protocol = generateProtocol();
  const accessToken = generateAccessToken();
  const quantity = Math.max(1, Number(body.quantity) || 1);
  const segmento = body.segmento || (body.insumo === 'Cropped' ? 'cropped' : null);
  const persistedInsumo = body.insumo === 'Cropped' ? 'Camisa' : body.insumo;

  const row = {
    protocol,
    access_token: accessToken,
    order_type: body.order_type,
    status: 'received',
    customer_id: user?.id || null,
    contact_name: String(body.contact_name).trim(),
    contact_email: String(body.contact_email).trim().toLowerCase(),
    contact_phone: String(body.contact_phone).trim(),
    insumo: persistedInsumo,
    genero: body.genero || null,
    model: body.model || null,
    segmento,
    quantity,
    size_breakdown: parseJsonField(body.size_breakdown, {}),
    blank_color: body.blank_color?.trim() || null,
    print_placements: parseJsonField(body.print_placements, []),
    brief_title: body.brief_title?.trim() || null,
    brief_description: body.brief_description?.trim() || null,
    style_reference: body.style_reference?.trim() || null,
    usage_type: body.usage_type?.trim() || null,
    customer_notes: body.customer_notes?.trim() || null,
    shipping_cep: onlyDigits(body.shipping_cep || '') || null,
    rights_confirmed: body.rights_confirmed === true || body.rights_confirmed === 'true',
    art_fee_amount: body.order_type === 'exclusive_art' ? pricing.artFee : 0,
    product_unit_amount: pricing.productUnit,
    art_payment_status: pricing.artPaymentStatus || 'pending',
    product_payment_status: 'pending',
    revision_count: 0,
    max_revisions: 3,
  };

  const { data: order, error } = await supabase
    .from('custom_orders')
    .insert(row)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Erro ao criar pedido personalizado: ${error.message}`);
  }

  const fileRecords = [];
  const artFiles = files.filter((f) => f.fieldname === 'art_files' || f.fieldname === 'files');
  const refFiles = files.filter((f) => f.fieldname === 'reference_files');

  for (const file of artFiles) {
    const url = await uploadCustomOrderFile(
      file,
      STORAGE_BUCKET,
      `${STORAGE_PATHS.CUSTOM_ORDERS}/${order.id}/customer`,
    );
    fileRecords.push({
      custom_order_id: order.id,
      kind: 'customer_art',
      file_name: file.originalname,
      storage_url: url,
    });
  }

  for (const file of refFiles) {
    const url = await uploadCustomOrderFile(
      file,
      STORAGE_BUCKET,
      `${STORAGE_PATHS.CUSTOM_ORDERS}/${order.id}/reference`,
    );
    fileRecords.push({
      custom_order_id: order.id,
      kind: 'reference',
      file_name: file.originalname,
      storage_url: url,
    });
  }

  if (fileRecords.length) {
    const { error: filesError } = await supabase.from('custom_order_files').insert(fileRecords);
    if (filesError) {
      console.error('[customOrders] file insert error:', filesError);
    }
  }

  return sanitizeOrderForCustomer({ ...order, custom_order_files: fileRecords });
}

async function listCustomOrders({ status } = {}) {
  let query = supabase
    .from('custom_orders')
    .select('*, custom_order_files(*)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

async function listCustomOrdersForCustomer(user) {
  const email = String(user.email || '').trim().toLowerCase();
  const { data, error } = await supabase
    .from('custom_orders')
    .select('id, protocol, order_type, status, insumo, model, quantity, art_payment_status, product_payment_status, art_fee_amount, product_unit_amount, shipping_amount, created_at, updated_at')
    .or(`customer_id.eq.${user.id},contact_email.eq.${email}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    ...row,
    product_payment_total: getProductPaymentTotal(row),
  }));
}

async function getCustomOrderById(id) {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('*, custom_order_files(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function getCustomOrderForCustomer(id, user) {
  const order = await getCustomOrderById(id);
  assertCustomerOwnsOrder(order, user);
  if (!order.customer_id && user.id) {
    await supabase
      .from('custom_orders')
      .update({ customer_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    order.customer_id = user.id;
  }
  return sanitizeOrderForCustomer(order);
}

async function getCustomOrderByToken(token) {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('id, protocol, status, order_type, insumo, genero, model, quantity, created_at, updated_at')
    .eq('access_token', token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function updateCustomOrder(id, patch, mockupFile = null) {
  const allowed = [
    'status', 'admin_notes', 'shipping_amount', 'shipping_cep',
    'shipping_method', 'shipping_service_id', 'revision_count', 'max_revisions',
  ];

  const updates = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (patch[key] !== undefined && patch[key] !== '') updates[key] = patch[key];
  }

  if (updates.shipping_cep !== undefined) {
    const cep = onlyDigits(updates.shipping_cep);
    updates.shipping_cep = cep.length === 8 ? cep : null;
  }

  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    const err = new Error('Status inválido.');
    err.statusCode = 400;
    throw err;
  }

  const existing = await getCustomOrderById(id);
  if (!existing) {
    const err = new Error('Pedido não encontrado.');
    err.statusCode = 404;
    throw err;
  }

  if (mockupFile) {
    const url = await uploadImage(
      mockupFile,
      STORAGE_BUCKET,
      `${STORAGE_PATHS.CUSTOM_ORDERS}/${id}/mockup`,
    );
    await supabase.from('custom_order_files').insert({
      custom_order_id: id,
      kind: 'mockup',
      file_name: mockupFile.originalname,
      storage_url: url,
    });
    if (existing.order_type === 'exclusive_art') {
      updates.status = 'mockup_ready';
      updates.mockup_ready_at = new Date().toISOString();
    } else if (existing.status === 'received' || existing.status === 'reviewing') {
      updates.status = 'awaiting_product_payment';
    }
  }

  const { error } = await supabase.from('custom_orders').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  return getCustomOrderById(id);
}

async function quoteCustomOrderShipping(id, cepOverride) {
  const order = await getCustomOrderById(id);
  if (!order) {
    const err = new Error('Pedido não encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const cep = onlyDigits(cepOverride || order.shipping_cep || '');
  if (cep.length !== 8) {
    const err = new Error('Informe um CEP válido (8 dígitos) para cotar o frete.');
    err.statusCode = 400;
    throw err;
  }

  const pkg = getCustomOrderPackage(order);
  const options = await getShippingQuote({
    cep,
    weight: pkg.weight,
    height: pkg.height,
    width: pkg.width,
    length: pkg.length,
  });

  return {
    cep,
    package: pkg,
    options: options || [],
  };
}

async function incrementRevision(id) {
  const order = await getCustomOrderById(id);
  if (!order) {
    const err = new Error('Pedido não encontrado.');
    err.statusCode = 404;
    throw err;
  }
  const next = Number(order.revision_count || 0) + 1;
  const { error } = await supabase
    .from('custom_orders')
    .update({ revision_count: next, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return getCustomOrderById(id);
}

async function approveCustomOrderForProduction(id, user) {
  const order = await getCustomOrderById(id);
  assertCustomerOwnsOrder(order, user);

  if (order.order_type === 'exclusive_art' && order.art_payment_status !== 'paid') {
    const err = new Error('Pague a taxa de arte antes de aprovar a peça.');
    err.statusCode = 400;
    throw err;
  }

  if (!['art_paid', 'awaiting_product_payment', 'mockup_ready'].includes(order.status)
    && order.order_type === 'exclusive_art') {
    const err = new Error('Mockup ainda não disponível para aprovação.');
    err.statusCode = 400;
    throw err;
  }

  const { error } = await supabase
    .from('custom_orders')
    .update({
      status: 'awaiting_product_payment',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return getCustomOrderForCustomer(id, user);
}

async function startArtFeePayment(id, user, returnOrigin) {
  const order = await getCustomOrderById(id);
  assertCustomerOwnsOrder(order, user);

  if (order.order_type !== 'exclusive_art') {
    const err = new Error('Este pedido não possui taxa de arte.');
    err.statusCode = 400;
    throw err;
  }
  if (order.art_payment_status === 'paid') {
    const err = new Error('Taxa de arte já paga.');
    err.statusCode = 400;
    throw err;
  }
  if (order.status !== 'mockup_ready') {
    const err = new Error('Mockup ainda não está pronto para pagamento.');
    err.statusCode = 400;
    throw err;
  }

  const payment = await createCustomOrderPaymentPreference({
    order,
    phase: 'art',
    returnOrigin,
  });

  await supabase
    .from('custom_orders')
    .update({
      payment_link: payment.checkoutUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  return payment;
}

async function startProductPayment(id, user, returnOrigin) {
  const order = await getCustomOrderById(id);
  assertCustomerOwnsOrder(order, user);

  if (order.product_payment_status === 'paid') {
    const err = new Error('Peça já paga.');
    err.statusCode = 400;
    throw err;
  }
  if (order.status !== 'awaiting_product_payment') {
    const err = new Error('Aprove o mockup antes de pagar a peça.');
    err.statusCode = 400;
    throw err;
  }

  const payment = await createCustomOrderPaymentPreference({
    order,
    phase: 'product',
    returnOrigin,
  });

  await supabase
    .from('custom_orders')
    .update({
      payment_link: payment.checkoutUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  return payment;
}

async function applyCustomOrderPaymentUpdate(payment) {
  const ref = String(
    payment.external_reference
    || payment.metadata?.external_reference
    || '',
  ).trim();

  let match = parseCustomPaymentRef(ref);
  if (!match && payment.metadata?.custom_order_id && payment.metadata?.payment_phase) {
    match = {
      orderId: payment.metadata.custom_order_id,
      phase: payment.metadata.payment_phase,
    };
  }
  if (!match) return { ignored: true };

  if (String(payment.status || '').toLowerCase() !== 'approved') {
    return { ignored: true, reason: 'Pagamento não aprovado.' };
  }

  const order = await getCustomOrderById(match.orderId);
  if (!order) return { ignored: true, reason: 'Pedido personalizado não encontrado.' };

  const now = new Date().toISOString();
  const updates = { updated_at: now, payment_status: 'approved' };

  if (match.phase === 'art') {
    updates.art_payment_status = 'paid';
    updates.art_fee_paid_at = now;
    updates.status = 'art_paid';
  } else {
    updates.product_payment_status = 'paid';
    updates.product_paid_at = now;
    updates.status = 'in_production';
  }

  const { data, error } = await supabase
    .from('custom_orders')
    .update(updates)
    .eq('id', order.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return { ignored: false, order: data, phase: match.phase };
}

module.exports = {
  createCustomOrder,
  listCustomOrders,
  listCustomOrdersForCustomer,
  getCustomOrderById,
  getCustomOrderForCustomer,
  getCustomOrderByToken,
  updateCustomOrder,
  quoteCustomOrderShipping,
  incrementRevision,
  approveCustomOrderForProduction,
  startArtFeePayment,
  startProductPayment,
  applyCustomOrderPaymentUpdate,
  sanitizeOrderForCustomer,
  canViewMockup,
  getProductPaymentTotal,
};
