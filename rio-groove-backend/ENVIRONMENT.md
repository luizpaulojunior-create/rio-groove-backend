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

**Aliases aceitos** (mesmo valor da secret key): `SUPABASE_SECRET_KEY`, `SB_SECRET_KEY`.

### Chaves novas vs legacy (2026)

O upgrade para **Pro** não troca as chaves — é o mesmo projeto.

No painel Supabase as chaves JWT (`eyJ…`) podem **continuar iguais** às de sempre. Em alguns projetos o Supabase já bloqueia esse formato na API REST (`Legacy API keys are disabled`), enquanto **produção no Render** segue com a variável configurada lá (que pode ser diferente do `.env` na sua máquina).

| Onde | O que importa |
|------|----------------|
| **Render / Cloudflare** | Chaves que estão no painel de deploy — se `/api/health` retorna 200, está OK |
| **`.env` local** | Só para `npm run dev` e scripts; pode estar desatualizado em relação ao Render |

Para sincronizar dev local com produção: copie `SUPABASE_SERVICE_ROLE_KEY` do **Render → Environment** para o `.env` local (não precisa mudar nada em produção se já funciona).

Formato novo (`sb_publishable_` / `sb_secret_`), se aparecer no dashboard, também funciona — use o que o Supabase mostrar em **Settings → API**.

### Auditoria periódica

```powershell
cd c:\Users\luizp\Downloads\rio-groove-backend-final\rio-groove-backend
npm run audit:prod
# Só .env local:
node scripts/audit-production.mjs --local-only
# JSON (CI/monitoramento):
node scripts/audit-production.mjs --json
```

Verifica: `/api/health`, catálogo, imagem Supabase, pedido de referência, loja, admin, bundle de pedidos e (se `.env` existir) formato das chaves + query no Postgres.

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

## Google Analytics 4 (opcional — funil no admin)

| Variável | Descrição |
|----------|-----------|
| `GA4_PROPERTY_ID` | ID numérico da propriedade (ex: `539502234`) |
| `GA4_MEASUREMENT_ID` | ID de medição da loja (ex: `G-2J23RT1MN3`) |
| `GA4_SERVICE_ACCOUNT_JSON` | JSON da conta de serviço (texto ou base64) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Alternativa: caminho local ao arquivo JSON |

**Setup Google Cloud**

1. Criar projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Ativar **Google Analytics Data API**
3. Criar **conta de serviço** → baixar JSON
4. No GA4: **Admin → Gerenciamento de acesso à propriedade** → adicionar e-mail da conta de serviço com papel **Viewer**
5. No Render: `GA4_PROPERTY_ID=539502234` e colar o JSON em `GA4_SERVICE_ACCOUNT_JSON` (recomendado em base64 no painel)

Relatório local:

```powershell
cd c:\Users\luizp\Downloads\rio-groove-backend-final\rio-groove-backend
node scripts/ga4-funnel-report.mjs 7d
```

Endpoint admin (autenticado): `GET /api/analytics/ga4/conversion?period=7d|30d|90d`

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
