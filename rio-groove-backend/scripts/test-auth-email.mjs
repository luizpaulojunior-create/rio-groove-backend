import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(root, '..');
const adminEnv = path.resolve(backendRoot, '../../rio-groove-admin/.env');

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(backendRoot, '.env'));
loadEnv(adminEnv);

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const redirect = 'https://store.riogroovemovimentos.com.br/auth/callback';

if (!url || !publishableKey) {
  console.log('ERRO: faltam SUPABASE_URL ou publishable key');
  process.exit(1);
}

console.log('Projeto:', url);
console.log('Key type:', publishableKey.startsWith('sb_publishable_') ? 'publishable (ok)' : 'legacy/outro');

const sb = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const emails = ['luizpaulojunior@gmail.com', 'kellylunaa@icloud.com'];

for (const email of emails) {
  const res = await fetch(`${url}/auth/v1/resend`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirect },
    }),
  });

  const body = await res.text();
  console.log('\nRESEND HTTP', email);
  console.log('  status:', res.status);
  console.log('  body:', body || '(vazio)');
}

console.log('\n--- SIGNUP probe (email descartável) ---');
const probeEmail = `rg-probe-${Date.now()}@mailinator.com`;
const signup = await sb.auth.signUp({
  email: probeEmail,
  password: 'ProbeTest123!',
  options: { emailRedirectTo: redirect },
});

console.log('  email:', probeEmail);
console.log('  error:', signup.error?.message || null);
console.log('  hasUser:', Boolean(signup.data.user));
console.log('  hasSession:', Boolean(signup.data.session));
console.log('  email_confirmed_at:', signup.data.user?.email_confirmed_at || '(null)');
console.log('  identities:', signup.data.user?.identities?.length ?? 'n/a');

if (signup.data.user && !signup.data.user.email_confirmed_at && !signup.data.session) {
  console.log('  => Confirm email ATIVO (espera e-mail de confirmação)');
} else if (signup.data.session) {
  console.log('  => Autoconfirm ATIVO (login imediato, sem e-mail)');
} else if (!signup.data.user) {
  console.log('  => user null (verificar config / duplicata / captcha)');
}
