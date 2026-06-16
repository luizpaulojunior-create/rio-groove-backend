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

function isIncompleteAccount(user) {
  if (!user) return false;
  // Nunca entrou de fato — cadastro antigo pode ter senha/hash inconsistente.
  return !user.last_sign_in_at;
}

async function ensureAccountAccess(user, { password, metadata = {} }) {
  if (!user.last_sign_in_at) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      password,
      user_metadata: {
        ...(user.user_metadata || {}),
        ...metadata,
      },
    });
    if (error) throw error;
    return { resynced: true };
  }

  if (!user.email_confirmed_at) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (error) throw error;
  }

  return { resynced: false };
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
    const access = await ensureAccountAccess(existing, { password, metadata });
    return {
      status: 'existing',
      email: normalized,
      resynced: access.resynced,
    };
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

async function createCustomerSession(email) {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: normalized,
  });

  if (error) throw error;

  const token =
    new URL(data.properties.action_link).searchParams.get('token')
    || data.properties.hashed_token;

  const apiKey = env.supabaseAnonKey || env.supabaseServiceRoleKey;
  if (!apiKey) {
    const err = new Error('Autenticação indisponível no servidor.');
    err.statusCode = 503;
    throw err;
  }

  const verifyRes = await fetch(`${env.supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'magiclink',
      token,
      email: normalized,
    }),
  });

  const payload = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok) {
    const err = new Error(payload.msg || payload.error_description || payload.message || 'Falha ao iniciar sessão.');
    err.statusCode = 401;
    throw err;
  }

  if (!payload.access_token || !payload.refresh_token) {
    const err = new Error('Sessão inválida retornada pelo auth.');
    err.statusCode = 500;
    throw err;
  }

  return {
    user: payload.user || null,
    session: {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
      token_type: payload.token_type,
      user: payload.user,
    },
  };
}

async function signInCustomer({ email, password, allowMagicLinkFallback = false }) {
  const normalized = normalizeEmail(email);
  assertPassword(password);

  if (!env.supabaseAnonKey) {
    if (allowMagicLinkFallback) {
      return createCustomerSession(normalized);
    }
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

  if (!error) {
    return {
      user: data.user,
      session: data.session,
    };
  }

  const msg = String(error.message || '').toLowerCase();
  const invalidPassword =
    msg.includes('invalid login') || error.code === 'invalid_credentials';

  if (allowMagicLinkFallback && (invalidPassword || !env.supabaseAnonKey)) {
    try {
      return await createCustomerSession(normalized);
    } catch (magicLinkError) {
      if (!invalidPassword) throw magicLinkError;
    }
  }

  if (invalidPassword) {
    const err = new Error('E-mail ou senha incorretos.');
    err.statusCode = 401;
    throw err;
  }

  throw error;
}

async function activateCustomerLogin({ email, password, metadata = {} }) {
  const normalized = normalizeEmail(email);
  assertPassword(password);

  const user = await findUserByEmail(normalized);
  if (!user) {
    const err = new Error('Conta não encontrada para este e-mail.');
    err.statusCode = 404;
    throw err;
  }

  const access = await ensureAccountAccess(user, { password, metadata });

  if (access.resynced) {
    const login = await createCustomerSession(normalized);
    return {
      ok: true,
      confirmed: true,
      alreadyConfirmed: Boolean(user.email_confirmed_at),
      user: login.user,
      session: login.session,
    };
  }

  const login = await signInCustomer({
    email: normalized,
    password,
    allowMagicLinkFallback: true,
  });

  return {
    ok: true,
    confirmed: true,
    alreadyConfirmed: Boolean(user.email_confirmed_at && user.last_sign_in_at),
    user: login.user,
    session: login.session,
  };
}

module.exports = {
  registerCustomer,
  activateCustomerLogin,
  confirmUserEmail,
  signInCustomer,
  createCustomerSession,
};
