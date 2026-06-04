const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { uploadCustomOrderFile, uploadImage } = require('./upload.service');
const { STORAGE_BUCKET, STORAGE_PATHS } = require('../config/storage');
const { validateCustomOrderPayload, VALID_STATUSES } = require('../config/customProducts');

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

async function createCustomOrder(body, files = []) {
  const errors = validateCustomOrderPayload(body);
  if (errors.length) {
    const err = new Error(errors.join(' '));
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
    rights_confirmed: body.rights_confirmed === true || body.rights_confirmed === 'true',
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

  return {
    ...order,
    files: fileRecords,
  };
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

async function getCustomOrderById(id) {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('*, custom_order_files(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function getCustomOrderByToken(token) {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('id, protocol, status, order_type, insumo, genero, model, quantity, quote_amount, created_at, updated_at')
    .eq('access_token', token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function updateCustomOrder(id, patch, mockupFile = null) {
  const allowed = [
    'status', 'admin_notes', 'quote_amount', 'quote_valid_until',
    'payment_link', 'payment_status',
  ];

  const updates = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (patch[key] !== undefined) updates[key] = patch[key];
  }

  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    const err = new Error('Status inválido.');
    err.statusCode = 400;
    throw err;
  }

  const { data: order, error } = await supabase
    .from('custom_orders')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

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
  }

  return getCustomOrderById(id);
}

module.exports = {
  createCustomOrder,
  listCustomOrders,
  getCustomOrderById,
  getCustomOrderByToken,
  updateCustomOrder,
};
