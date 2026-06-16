const { createClient } = require('@supabase/supabase-js');
const supabase = require('../lib/supabase');
const env = require('../config/env');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function assertPassword(password) {
  if (!password || String(password).length < 6) {
    const err = new Error('A senha deve ter pelo menos 6 caracteres.');
    err.statusCode = 400;
    throw err;
  }
}

async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) throw error;

    const hit = data.users.find((user) => normalizeEmail(user.email) === normalized);
    if (hit) return hit;

    if (data.users.length < 200) break;
  }

  return null;
}

async function confirmUserEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { confirmed: false, reason: 'invalid_email' };
  }

  const { data: rpcUpdated, error: rpcError } = await supabase.rpc('confirm_auth_user_by_email', {
    user_email: normalized,
  });

  if (!rpcError && rpcUpdated === true) {
    return { confirmed: true, via: 'rpc' };
  }

  const user = await findUserByEmail(normalized);
  if (!user) {
    return { confirmed: false, reason: 'not_found' };
  }

  if (user.email_confirmed_at) {
    return { confirmed: true, already: true, via: 'existing' };
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  if (error) throw error;

  return { confirmed: true, via: 'admin' };
}

async function registerCustomer({ email, password, metadata = {} }) {
  const normalized = normalizeEmail(email);
  assertPassword(password);

  if (!normalized) {
    const err = new Error('Informe um e-mail válido.');
    err.statusCode = 400;
    throw err;
  }

  const existing = await findUserByEmail(normalized);
  if (existing) {
    if (!existing.email_confirmed_at) {
      await supabase.auth.admin.updateUserById(existing.id, { email_confirm: true });
    }
    return { status: 'existing', email: normalized };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('already') || message.includes('registered')) {
      await confirmUserEmail(normalized);
      return { status: 'existing', email: normalized };
    }
    throw error;
  }

  return {
    status: 'created',
    email: normalized,
    userId: data.user?.id || null,
  };
}

async function signInCustomer({ email, password }) {
  const normalized = normalizeEmail(email);
  assertPassword(password);

  if (!env.supabaseAnonKey) {
    const err = new Error('Autenticação indisponível no servidor.');
    err.statusCode = 503;
    throw err;
  }

  const anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await anonClient.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('invalid login') || error.code === 'invalid_credentials') {
      const err = new Error('E-mail ou senha incorretos.');
      err.statusCode = 401;
      throw err;
    }
    throw error;
  }

  return {
    user: data.user,
    session: data.session,
  };
}

async function activateCustomerLogin({ email, password }) {
  const normalized = normalizeEmail(email);
  assertPassword(password);

  const confirmResult = await confirmUserEmail(normalized);
  if (confirmResult.reason === 'not_found') {
    const err = new Error('Conta não encontrada para este e-mail.');
    err.statusCode = 404;
    throw err;
  }

  const login = await signInCustomer({ email: normalized, password });

  return {
    ok: true,
    confirmed: true,
    alreadyConfirmed: Boolean(confirmResult.already),
    user: login.user,
    session: login.session,
  };
}

module.exports = {
  registerCustomer,
  activateCustomerLogin,
  confirmUserEmail,
};
