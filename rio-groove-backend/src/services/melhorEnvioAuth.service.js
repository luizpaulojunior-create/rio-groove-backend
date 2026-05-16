const env = require('../config/env');
const supabase = require('../lib/supabase');

const ME_OAUTH_BASE = env.melhorEnvioSandbox 
  ? 'https://sandbox.melhorenvio.com.br' 
  : 'https://melhorenvio.com.br';

async function getAuthorizationUrl() {
  console.log('[MelhorEnvio OAuth] Authorization iniciado');
  const clientId = env.melhorEnvioClientId;
  const redirectUri = encodeURIComponent(env.melhorEnvioRedirectUri || '');
  const scope = 'Nenhum (usando defaults do app no Melhor Envio)';
  console.log('[MelhorEnvio OAuth] Scope utilizado:', scope);
  return `${ME_OAUTH_BASE}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
}

async function handleCallback(code) {
  console.log('[MelhorEnvio OAuth] Code recebido', code);
  console.log('[MelhorEnvio OAuth] Iniciando token exchange');
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', env.melhorEnvioClientId);
  params.append('client_secret', env.melhorEnvioClientSecret);
  params.append('redirect_uri', env.melhorEnvioRedirectUri);
  params.append('code', code);

  console.log('[MelhorEnvio OAuth] Payload OAuth formatado corretamente');

  const response = await fetch(`${ME_OAUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[MelhorEnvio OAuth] Erro ao trocar code', text);
    throw new Error(`Falha ao obter token: ${text}`);
  }

  const data = await response.json();
  console.log('[MelhorEnvio OAuth] Access token gerado');

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  console.log('[MelhorEnvio OAuth] Tentando salvar token no Supabase:', {
    access_token_prefix: data.access_token ? data.access_token.substring(0, 15) + '...' : 'null',
    refresh_token_prefix: data.refresh_token ? data.refresh_token.substring(0, 15) + '...' : 'null',
    expires_at: expiresAt.toISOString(),
    expires_in_seconds: data.expires_in
  });

  const { error } = await supabase
    .from('oauth_tokens')
    .upsert({
      provider: 'melhor_envio',
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'provider' });

  if (error) {
    console.error('[MelhorEnvio OAuth] Erro ao salvar token no DB:', error);
    throw error;
  }
  
  console.log('[MelhorEnvio OAuth] Token salvo com sucesso no banco!');
  return data;
}

async function getValidToken() {
  console.log('[MelhorEnvio OAuth] Buscando token válido do banco (Supabase)...');
  console.log(`[MelhorEnvio OAuth] CONFIGURAÇÃO ATUAL -> Sandbox: ${env.melhorEnvioSandbox} | ClientID: ${env.melhorEnvioClientId}`);
  
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider', 'melhor_envio')
    .single();

  if (error || !data) {
    console.warn('[MelhorEnvio OAuth] Erro ao buscar token ou token inexistente no DB:', { error, hasData: !!data });
    console.log('[MelhorEnvio OAuth] Usando fallback env.melhorEnvioToken:', env.melhorEnvioToken ? env.melhorEnvioToken.substring(0, 15) + '...' : 'null');
    return env.melhorEnvioToken; // fallback
  }

  console.log('[MelhorEnvio OAuth] Token encontrado no banco:', {
    expires_at: data.expires_at,
    token_prefix: data.access_token ? data.access_token.substring(0, 15) + '...' : 'null',
    aviso: 'Se o ambiente (Sandbox/Prod) mudou recentemente, este token antigo salvo no banco pode ser inválido para a URL atual (causando 403).'
  });

  const now = new Date();
  const expiresAt = new Date(data.expires_at);

  if (now >= expiresAt) {
    console.log('[MelhorEnvio OAuth] Token expirado, renovando...', { now: now.toISOString(), expiresAt: expiresAt.toISOString() });
    return await refreshToken(data.refresh_token);
  }

  console.log('[MelhorEnvio OAuth] Token válido retornado do banco');
  return data.access_token;
}

async function refreshToken(refreshTokenValue) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshTokenValue);
  params.append('client_id', env.melhorEnvioClientId);
  params.append('client_secret', env.melhorEnvioClientSecret);

  const response = await fetch(`${ME_OAUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao renovar token: ${text}`);
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await supabase
    .from('oauth_tokens')
    .upsert({
      provider: 'melhor_envio',
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'provider' });

  console.log('[MelhorEnvio OAuth] Token renovado e salvo');
  return data.access_token;
}

module.exports = {
  getAuthorizationUrl,
  handleCallback,
  getValidToken
};
