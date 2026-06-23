import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const storeRoot = path.resolve(backendRoot, '../../rio-groove-store-v2');

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
loadEnv(path.join(storeRoot, '.env'));
loadEnv(path.resolve(backendRoot, '../../rio-groove-admin/.env'));

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SECRET_KEY
  || process.env.SB_SECRET_KEY;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY
  || process.env.SUPABASE_ANON_KEY;
const email = (process.argv[2] || 'kellylunaa@icloud.com').toLowerCase();

if (!url || !serviceKey) {
  console.log('AVISO: sem service role — pulando consulta admin');
} else {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.log('ERRO listUsers:', listError.message);
  } else {
    const user = listData.users.find((u) => (u.email || '').toLowerCase() === email);

    if (!user) {
      console.log(`USUARIO: nao encontrado (${email})`);
    } else {
      console.log('USUARIO: encontrado');
      console.log('  id:', user.id);
      console.log('  email:', user.email);
      console.log('  created_at:', user.created_at);
      console.log('  updated_at:', user.updated_at);
      console.log('  email_confirmed_at:', user.email_confirmed_at || '(nao confirmado)');
      console.log('  confirmed_at:', user.confirmed_at || '(nao confirmado)');
      console.log('  last_sign_in_at:', user.last_sign_in_at || '(nunca logou)');
    }
  }
}

if (!anonKey) {
  console.log('REENVIO: nao testado (publishable/anon key ausente)');
  process.exit(0);
}

const publicClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const redirect = 'https://store.riogroovemovimentos.com.br/auth/callback';
const { error: resendError } = await publicClient.auth.resend({
  type: 'signup',
  email,
  options: { emailRedirectTo: redirect },
});

if (resendError) {
  console.log('REENVIO:', 'falhou');
  console.log('  message:', resendError.message);
  if ('status' in resendError) console.log('  status:', resendError.status);
} else {
  console.log('REENVIO:', 'ok — Supabase aceitou o pedido');
  console.log('  redirect:', redirect);
  console.log('  observacao: verifique a caixa de entrada/spam do iCloud');
}
