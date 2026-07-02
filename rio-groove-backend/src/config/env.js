const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
  backendUrl: (process.env.BACKEND_URL || '').replace(/\/$/, ''),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || '',
  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SB_SECRET_KEY
    || '',
  mercadoPagoPublicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  mercadoPagoWebhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@riogroovemovimentos.com.br',
  resendApiKey: process.env.RESEND_API_KEY || '',
  whatsappZapiUrl: process.env.WHATSAPP_API_URL || process.env.WHATSAPP_ZAPI_URL || '',
  whatsappZapiToken: process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ZAPI_TOKEN || '',
  whatsappInstanceId: process.env.WHATSAPP_INSTANCE_ID || '',
  whatsappDefaultCountry: process.env.WHATSAPP_DEFAULT_COUNTRY || '55',
  statementDescriptor: process.env.STATEMENT_DESCRIPTOR || 'RIO GROOVE',
  melhorEnvioToken: process.env.MELHOR_ENVIO_TOKEN || '',
  melhorEnvioSandbox: process.env.MELHOR_ENVIO_SANDBOX === 'true',
  melhorEnvioOriginCep: process.env.MELHOR_ENVIO_ORIGIN_CEP || '22723019',
  melhorEnvioClientId: process.env.MELHOR_ENVIO_CLIENT_ID || '',
  melhorEnvioClientSecret: process.env.MELHOR_ENVIO_CLIENT_SECRET || '',
  melhorEnvioRedirectUri: process.env.MELHOR_ENVIO_REDIRECT_URI || '',
  melhorEnvioInvoiceKey: String(process.env.MELHOR_ENVIO_INVOICE_KEY || '').replace(/\D/g, ''),
  melhorEnvioMinInsuranceValue: Number(process.env.MELHOR_ENVIO_MIN_INSURANCE_VALUE || 5),
  melhorEnvioRequireInvoiceForCnpj: process.env.MELHOR_ENVIO_REQUIRE_INVOICE_FOR_CNPJ === 'true',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'riogroovemovimentos@gmail.com',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'BRL',
  storeName: process.env.STORE_NAME || 'Rio Groove Store',
  storePhone: process.env.STORE_PHONE || '21999999999',
  storeEmail: process.env.STORE_EMAIL || 'contato@riogroovemovimentos.com.br',
  storeDocument: process.env.STORE_DOCUMENT || '00000000000',
  storeCompanyDocument: process.env.STORE_COMPANY_DOCUMENT || '00000000000000',
  storeStateRegister: process.env.STORE_STATE_REGISTER || 'ISENTO',
  storeAddress: process.env.STORE_ADDRESS || 'Endereço da Loja',
  storeComplement: process.env.STORE_COMPLEMENT || '',
  storeNumber: process.env.STORE_NUMBER || 'S/N',
  storeDistrict: process.env.STORE_DISTRICT || 'Bairro',
  storeCity: process.env.STORE_CITY || 'Rio de Janeiro',
  storeStateAbbr: process.env.STORE_STATE_ABBR || 'RJ',
  storePostalCode: process.env.STORE_POSTAL_CODE || process.env.MELHOR_ENVIO_ORIGIN_CEP || '22723019',
  oauthStateSecret: process.env.OAUTH_STATE_SECRET || '',
  ga4MeasurementId: process.env.GA4_MEASUREMENT_ID || '',
  ga4ApiSecret: process.env.GA4_API_SECRET || '',
  ga4PropertyId: process.env.GA4_PROPERTY_ID || '',
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
