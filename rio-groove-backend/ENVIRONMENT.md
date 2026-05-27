# Rio Groove — Variáveis de Ambiente (Backend)

> Referência Fase 1. Exemplo completo: [.env.example](./.env.example)

## Obrigatórias (startup falha se ausentes)

| Variável | Uso |
|----------|-----|
| `FRONTEND_URL` | CORS, redirects checkout |
| `BACKEND_URL` | URLs de callback, webhooks |
| `SUPABASE_URL` | Cliente Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso Postgres + Storage (bypass RLS) |
| `MERCADO_PAGO_PUBLIC_KEY` | Checkout |
| `MERCADO_PAGO_ACCESS_TOKEN` | Checkout + webhooks |

## Servidor

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | `3000` | Porta HTTP |
| `NODE_ENV` | — | `production` / `development` |

## URLs multi-app

| Variável | Descrição |
|----------|-----------|
| `STORE_URL` | Storefront (CORS) |
| `ADMIN_URL` | Admin panel (CORS) |
| `ADDITIONAL_ALLOWED_ORIGINS` | Origins extras, separados por vírgula |

## Supabase

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `SUPABASE_URL` | Sim | Projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Backend only — **nunca expor no frontend** |
| `SUPABASE_ANON_KEY` | Não | Carregada em `env.js`, uso limitado |

## Pagamentos

| Variável | Descrição |
|----------|-----------|
| `MERCADO_PAGO_PUBLIC_KEY` | Checkout Pro |
| `MERCADO_PAGO_ACCESS_TOKEN` | API Mercado Pago |
| `MERCADO_PAGO_WEBHOOK_SECRET` | **Obrigatório em produção** — verifica `x-signature` nos webhooks MP |
| `SENTRY_DSN` | Observabilidade opcional (Sentry) |
| `STRIPE_SECRET_KEY` | Checkout Stripe (opcional) |
| `STRIPE_WEBHOOK_SECRET` | Verificação de webhook Stripe |

## Melhor Envio

| Variável | Descrição |
|----------|-----------|
| `MELHOR_ENVIO_TOKEN` | Token API |
| `MELHOR_ENVIO_SANDBOX` | `true`/`false` |
| `MELHOR_ENVIO_ORIGIN_CEP` | CEP origem |
| `MELHOR_ENVIO_CLIENT_ID` | OAuth |
| `MELHOR_ENVIO_CLIENT_SECRET` | OAuth |
| `MELHOR_ENVIO_REDIRECT_URI` | OAuth callback |

## Notificações

| Variável | Descrição |
|----------|-----------|
| `SMTP_*` | Email transacional |
| `RESEND_API_KEY` | Alternativa Resend |
| `WHATSAPP_*` | Z-API WhatsApp |
| `ADMIN_NOTIFICATION_EMAIL` | Alertas admin |

## Loja (checkout / NF)

| Variável | Descrição |
|----------|-----------|
| `STATEMENT_DESCRIPTOR` | Descritor fatura |
| `DEFAULT_CURRENCY` | Ex: `BRL` |
| `STORE_NAME`, `STORE_PHONE`, `STORE_EMAIL` | Dados da loja |
| `STORE_DOCUMENT`, `STORE_ADDRESS`, etc. | Endereço fiscal |

---

## Comandos PowerShell — desenvolvimento local

```powershell
cd c:\Users\luizp\Downloads\rio-groove-backend-final\rio-groove-backend
Copy-Item .env.example .env
# Editar .env com valores reais
npm install
npm run dev
```

Health check:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

## Comandos PowerShell — deploy (Render)

Deploy é automático via Git push para branch conectada ao Render.

```powershell
# Validar build local antes do push
cd c:\Users\luizp\Downloads\rio-groove-backend-final\rio-groove-backend
npm install
npm start
# Em outro terminal:
Invoke-RestMethod http://localhost:3000/api/health
```

Configuração: `render.yaml` (`buildCommand: npm install`, `startCommand: npm start`, `healthCheckPath: /health`).

## Projetos relacionados

| Projeto | Variáveis principais |
|---------|---------------------|
| **admin** | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **storefront** | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GA_*`, `VITE_META_*` |

Todos compartilham o **mesmo projeto Supabase**.

## Storage (Fase 3 — documentação, sem migração)

| Bucket | Uso |
|--------|-----|
| `product-images` | **Oficial** — novos uploads via backend e admin CMS (`src/config/storage.js`) |
| `products` | **Legado** — URLs antigas em `product_images`; preservar até migração futura |

Não alterar URLs existentes nesta fase.
