const env = require('../config/env');
const supabase = require('../lib/supabase');

const ME_OAUTH_BASE = env.melhorEnvioSandbox 
  ? 'https://sandbox.melhorenvio.com.br' 
  : 'https://melhorenvio.com.br';

async function getAuthorizationUrl() {
  console.log('[MelhorEnvio OAuth] Authorization iniciado');
  const clientId = env.melhorEnvioClientId;
  const redirectUri = env.melhorEnvioRedirectUri;
  return `${ME_OAUTH_BASE}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=cart-read cart-write companies-read companies-write document-read document-write ecommerce-read ecommerce-write offset-read offset-write products-read products-write shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking tags-read tags-write transactions-read`;
}

async function handleCallback(code) {
  console.log('[MelhorEnvio OAuth] Code recebido', code);
  
  const response = await fetch(`${ME_OAUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: env.melhorEnvioClientId,
      client_secret: env.melhorEnvioClientSecret,
      redirect_uri: env.melhorEnvioRedirectUri,
      code: code
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[MelhorEnvio OAuth] Erro ao trocar code', text);
    throw new Error(`Falha ao obter token: ${text}`);
  }

  const data = await response.json();
  console.log('[MelhorEnvio OAuth] Access token gerado');

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

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
    console.error('[MelhorEnvio OAuth] Erro ao salvar token no DB', error);
    throw error;
  }
  
  console.log('[MelhorEnvio OAuth] Token salvo');
  return data;
}

async function getValidToken() {
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider', 'melhor_envio')
    .single();

  if (error || !data) {
    return env.melhorEnvioToken; // fallback
  }

  const now = new Date();
  const expiresAt = new Date(data.expires_at);

  if (now >= expiresAt) {
    console.log('[MelhorEnvio OAuth] Token expirado, renovando...');
    return await refreshToken(data.refresh_token);
  }

  return data.access_token;
}

async function refreshToken(refreshToken) {
  const response = await fetch(`${ME_OAUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.melhorEnvioClientId,
      client_secret: env.melhorEnvioClientSecret
    })
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
