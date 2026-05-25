# Rio Groove — Arquitetura (Fase 1)

> Documento de governança. **Não altera comportamento em runtime.**  
> Última revisão: maio/2026 — congelamento arquitetural Fase 1.

## Visão do ecossistema

```
┌─────────────────┐     REST (Bearer JWT*)     ┌──────────────────────┐
│  rio-groove-    │ ─────────────────────────► │  rio-groove-backend  │
│  admin          │                            │  (Express + Supabase │
│  (CMS/gestão)   │ ── Supabase Auth/CMS ────► │   service role)      │
└─────────────────┘                            └──────────┬───────────┘
                                                          │
┌─────────────────┐     Supabase (anon)                 │ Postgres +
│  rio-groove-    │ ◄─────────────────────────────────────┤ Storage
│  store-v2       │     POST /api/checkout ─────────────►│
│  (vitrine)      │                                      │
└─────────────────┘                            Mercado Pago / Stripe /
                                               Melhor Envio / Webhooks
```

\* Admin envia JWT Supabase no header, mas **o backend ainda não valida** esse token (ver Riscos).

### Papéis obrigatórios (regras Fase 1+)

| Projeto | Papel | Fonte de dados |
|---------|-------|----------------|
| **admin** | Única interface operacional de gerenciamento | Backend REST + Supabase (auth, CMS storefront, campanhas) |
| **backend** | Única fonte oficial de regras de negócio e escrita transacional | Supabase (service role) + gateways externos |
| **storefront** | Apenas renderização e checkout | Supabase (leitura direta hoje) + backend (checkout) |

## Este repositório: `rio-groove-backend`

**Stack:** Node ≥20, Express 4, Supabase JS, Mercado Pago, Stripe, Melhor Envio, Multer.

**Entry:** `server.js` → `src/server.js` → `src/app.js` → `src/routes/index.js`

### Camadas internas

```
routes/*.routes.js  →  controllers/*.controller.js  →  services/*.service.js  →  lib/supabase.js
```

| Camada | Responsabilidade |
|--------|------------------|
| `routes/` | Registro HTTP, multer, paths `/api/*` |
| `controllers/` | Parse request, status codes |
| `services/` | Regras de negócio, Supabase, integrações |
| `lib/supabase.js` | Cliente único (service role) — **exceção:** `stock.service.js` cria client próprio |
| `config/` | `env.js`, `storage.js` |

### Endpoints registrados

Ver [API_CONTRACTS.md](./API_CONTRACTS.md).

### Supabase — tabelas usadas em runtime

| Tabela | Serviço(s) |
|--------|------------|
| `orders`, `order_items` | checkout, orders, payments, webhooks |
| `products`, `product_images`, `product_variants` | products, checkout, payments |
| `collections` | collections |
| `stock_items` | stock |
| `inventory_movements` | checkout, payments |
| `webhook_events` | orders (dedup) |
| `oauth_tokens` | Melhor Envio OAuth |

### Storage

- Bucket padrão: `product-images` (`src/config/storage.js`)
- Upload: `POST /api/upload` e upload embutido em `POST/PUT /api/products`
- Paths: `storefront/*`, `campaigns`, `collections`, `products`

### Autenticação

- **Sem middleware JWT/API key** nas rotas admin/CRUD
- CORS allowlist em `src/app.js`
- Stripe webhook: verificação de assinatura
- Melhor Envio: OAuth em `/auth/melhor-envio/*`

### Deploy

- Render (`render.yaml`): `npm start`, health `/health`

## Fluxos de dados principais

### Checkout (storefront → backend)

1. Storefront `POST /api/checkout` com itens, cliente, frete
2. Backend valida estoque, reserva variantes, cria `orders` + `order_items`
3. Retorna URL Mercado Pago / Stripe
4. Webhook confirma pagamento → baixa estoque, notifica

### Produtos (admin → backend)

1. Admin `productsService` → `POST/PUT /api/products` (FormData + imagens)
2. Backend persiste em `products`, `product_images`, `product_variants`
3. Upload para Supabase Storage bucket `product-images`

### CMS Storefront (admin → Supabase direto)

1. Páginas `Storefront*.jsx` leem/escrevem `storefront_sections`, `landing_pages`
2. Uploads via `storageService` → bucket `product-images`
3. Storefront consome as mesmas tabelas via hooks (`useStorefront`, `useCampaigns`)

## Duplicações e legado identificados (não remover na Fase 1)

| Item | Local | Notas |
|------|-------|-------|
| Cliente Supabase duplicado | `src/services/stock.service.js` | Deveria usar `lib/supabase.js` |
| Rota debug | `GET /debug/test-melhor-envio-cart` | Temporária em `shipping.routes.js` |
| Scripts one-off | `migrate.js`, `import_images.js`, `create_buckets.js`, etc. | Fora do runtime |
| Schema parcial | `supabase.sql` | Não cobre `products`, `stock_items`, CMS |
| Bucket mismatch | `create_buckets.js` vs `config/storage.js` | Buckets `products` vs `product-images` |
| `pg` dependency | `package.json` | Não usado no código |

## Riscos arquiteturais (Fase 1)

1. **API admin exposta sem auth** — CRUD público se URL conhecida
2. **Contrato admin ↔ backend divergente** — rotas `/analytics/*` e várias `/shipping/*` do admin **não existem** no backend
3. **Storefront lê Supabase direto** — bypassa backend para catálogo/CMS (aceito hoje, consolidar na Fase 2+)
4. **Webhooks Mercado Pago** — secret configurado mas não verificado
5. **Dois caminhos de upload** — admin produtos via backend; CMS via Supabase direto

## Arquivos suspeitos de legado (backend)

- `README-deploy.md` — desatualizado
- `patch-router.js`, `fix-frontend.js` — patches HTML externos
- `admin_progress.txt` — notas
- `rio-groove-admin/` dentro deste repo — cópia separada, não é o admin ativo

## Impacto Fase 1

**Zero alteração de fluxo.** Apenas documentação e comentários técnicos.
