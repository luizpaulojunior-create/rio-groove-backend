# Rio Groove — Contratos de API (Fase 1)

> Inventário dos endpoints **implementados no backend** e dos **consumidores conhecidos**.  
> Base URL produção: `https://rio-groove-backend.onrender.com`

## Convenções

- Prefixo: rotas expõem `/api/...` no path (sem mount adicional no router)
- Content-Type JSON, exceto upload (`multipart/form-data`)
- Admin usa Axios com `baseURL = VITE_API_URL` (já inclui `/api`)
- Storefront checkout usa `VITE_API_URL + '/api/checkout'` (URL completa)

---

## Health & Config

| Método | Path | Consumidor | Resposta |
|--------|------|------------|----------|
| GET | `/health` | Render, monitoramento | `{ ok, service, environment, timestamp }` |
| GET | `/api/health` | Idem | Idem |
| GET | `/` | Info | Metadados do serviço |
| GET | `/api/config/public` | Storefront (potencial) | Config pública da loja |

---

## Checkout & Pagamentos

| Método | Path | Consumidor | Body / Notas |
|--------|------|------------|--------------|
| POST | `/api/checkout` | **storefront** `payments/index.ts` | `{ provider, items, customer, shipping, coupon? }` → `{ checkoutUrl, sessionId?, totals }` |
| POST | `/api/webhooks/mercadopago` | Mercado Pago | Raw body |
| POST | `/api/webhooks/stripe` | Stripe | Raw body + assinatura |

---

## Pedidos

| Método | Path | Consumidor | Notas |
|--------|------|------------|-------|
| GET | `/api/orders` | **admin** `orders.js` | Query: `limit`, `offset` |
| POST | `/api/orders` | admin (manual) | Criação manual |
| GET | `/api/orders/:reference` | admin | UUID, `external_reference` ou `order_number` — **Bearer JWT admin** |
| GET | `/api/orders/:reference/public-status?email=` | **storefront** `orders/index.ts` | Exige e-mail do pedido; retorna status sem PII extra |
| PUT | `/api/orders/:id/status` | **admin** `orders.js` | Atualiza status — **Bearer JWT admin** |

---

## Produtos

| Método | Path | Consumidor | Notas |
|--------|------|------------|-------|
| GET | `/api/products` | **admin** `products.js` | Query: `active` |
| GET | `/api/products/:slug` | admin | Slug ou UUID |
| POST | `/api/products` | **admin** | `multipart`: field `images[]`, JSON metadata |
| PUT | `/api/products/:id` | **admin** | Idem |
| DELETE | `/api/products/:id` | **admin** | |

**Storefront:** lê `products` via Supabase direto (`productsService`), **não** usa estes endpoints hoje.

---

## Coleções

| Método | Path | Consumidor |
|--------|------|------------|
| GET | `/api/collections` | admin |
| GET | `/api/collections/:slug` | admin |
| POST | `/api/collections` | admin |
| PUT | `/api/collections/:id` | admin |
| DELETE | `/api/collections/:id` | admin |

**Storefront:** Supabase direto via `collectionsService`.

---

## Estoque

| Método | Path | Consumidor |
|--------|------|------------|
| GET | `/api/stock` | **admin** `stock.js` |
| GET | `/api/stock/:id` | admin |
| POST | `/api/stock` | admin |
| PUT | `/api/stock/:id` | admin |
| DELETE | `/api/stock/:id` | admin |
| POST | `/api/stock/:id/adjust` | admin |
| POST | `/api/stock/seed` | admin |

**Storefront:** lê `stock_items` via Supabase em `ProductDetails.tsx` (bypass).

---

## Upload

| Método | Path | Consumidor | Body |
|--------|------|------------|------|
| POST | `/api/upload` | admin (potencial) | `file` + opcional `bucket`, `path` → `{ url }` |

Produtos usam upload embutido em `POST/PUT /api/products`.

---

## Frete (Melhor Envio)

| Método | Path | Implementado | Consumidor admin espera |
|--------|------|--------------|-------------------------|
| POST | `/api/shipping/quote` | ✅ | `calculateQuote` → `/shipping/quote` ✅ |
| POST | `/api/shipping/purchase` | ✅ | — |
| POST | `/api/shipping/label` | ✅ | `generateLabel` → `/shipping/label/:orderId` ❌ path diferente |
| GET | `/api/shipping/tracking/:id` | ✅ | `trackShipment` → `/shipping/track/:code` ❌ path diferente |
| GET | `/auth/melhor-envio/login` | ✅ | `getOAuthUrl` → `/shipping/oauth-url` ❌ |
| GET | `/auth/melhor-envio/callback` | ✅ | OAuth callback Melhor Envio |

### Rotas chamadas pelo admin mas **NÃO implementadas** no backend

| Admin service path | Status |
|--------------------|--------|
| `GET /shipping/shipments` | ❌ 404 |
| `GET /shipping/shipments/:id` | ❌ 404 |
| `POST /shipping/label/print` | ❌ 404 |
| `POST /shipping/label/:id/cancel` | ❌ 404 |
| `GET /shipping/oauth-url` | ❌ 404 |
| `POST /shipping/oauth-callback` | ❌ 404 |
| `GET /shipping/status` | ❌ 404 |

---

## Analytics

| Admin service path | Status no backend |
|--------------------|-------------------|
| `GET /analytics/dashboard` | ❌ **Não implementado** |
| `GET /analytics/sales?period=` | ❌ **Não implementado** |
| `GET /analytics/top-products` | ❌ **Não implementado** |

Dashboard/Stats do admin dependem destes endpoints — **contrato pendente**.

---

## Autenticação HTTP

| Mecanismo | Onde |
|-----------|------|
| Admin envia `Authorization: Bearer <supabase_jwt>` | `admin/src/lib/api.js` |
| Backend valida JWT | ❌ **Não implementado** |
| CORS | `src/app.js` |
| Stripe webhook signature | `payments.service.js` |

---

## Supabase direto (fora desta API)

Consumido por admin e storefront sem passar pelo backend:

| Tabela | Admin | Storefront |
|--------|-------|------------|
| `storefront_sections` | Storefront*.jsx (escrita) | `useStorefront` (leitura) |
| `landing_pages` | StorefrontLandingPages | — |
| `campaigns` | Campaigns.jsx | `useCampaigns` |
| `admins` | AuthContext | — |
| `inventory_movements`, `product_variants` | ProductDetail.jsx | — |
| `coupons` | — | `couponService` |
| `orders`, `order_items` | — | account/orders pages |

> **Regra futura:** consolidar leituras da storefront via backend ou services padronizados.

---

## Payloads de referência

Schemas de validação em `src/utils/validation.js`:

- `validateCheckoutPayload`
- `validateShippingQuotePayload`
- `validateOrderReferencePayload`

Schema SQL parcial: `supabase.sql`
