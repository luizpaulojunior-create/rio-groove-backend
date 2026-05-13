const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
  backendUrl: (process.env.BACKEND_URL || '').replace(/\/$/, ''),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  mercadoPagoPublicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  mercadoPagoWebhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || '',
  statementDescriptor: process.env.STATEMENT_DESCRIPTOR || 'RIO GROOVE',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'BRL'
};

const required = [
  ['FRONTEND_URL', env.frontendUrl],
  ['BACKEND_URL', env.backendUrl],
  ['SUPABASE_URL', env.supabaseUrl],
  ['SUPABASE_SERVICE_ROLE_KEY', env.supabaseServiceRoleKey],
  ['MERCADO_PAGO_PUBLIC_KEY', env.mercadoPagoPublicKey],
  ['MERCADO_PAGO_ACCESS_TOKEN', env.mercadoPagoAccessToken]
];

const missing = required.filter(([, value]) => !value).map(([key]) => key);

if (missing.length) {
  throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(', ')}`);
}

module.exports = env;
