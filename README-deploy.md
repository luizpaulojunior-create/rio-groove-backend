# Rio Groove Store Backend

Estrutura final pronta para deploy no Render com:
- Node.js + Express
- Supabase Postgres
- Mercado Pago Checkout Pro
- webhook Mercado Pago
- persistência de pedidos
- integração com o frontend atual da Rio Groove Store

## Estrutura

```txt
rio-groove-backend/
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
├── server.js
├── supabase.sql
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    │   └── env.js
    ├── controllers/
    │   ├── checkout.controller.js
    │   ├── config.controller.js
    │   ├── health.controller.js
    │   ├── orders.controller.js
    │   └── webhook.controller.js
    ├── lib/
    │   ├── mercadopago.js
    │   └── supabase.js
    ├── middlewares/
    │   └── error-handler.js
    ├── routes/
    │   ├── checkout.routes.js
    │   ├── config.routes.js
    │   ├── health.routes.js
    │   ├── index.js
    │   ├── orders.routes.js
    │   └── webhooks.routes.js
    ├── services/
    │   ├── checkout.service.js
    │   ├── orders.service.js
    │   └── payments.service.js
    └── utils/
        ├── asyncHandler.js
        ├── money.js
        ├── order.js
        └── validation.js
```

## Variáveis de ambiente

Copie `.env.example` para `.env`.

Obrigatórias no Render:
- `FRONTEND_URL=https://proud-breeze-a824.luizpaulojunior.workers.dev`
- `BACKEND_URL=https://SEU-SERVICO.onrender.com`
- `SUPABASE_URL=https://cvpobvvkhcqasumhfwps.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `MERCADO_PAGO_PUBLIC_KEY=APP_USR-9bbcd335-9f64-4212-8226-1c039fd7b68d`
- `MERCADO_PAGO_ACCESS_TOKEN=...`

## Banco de dados no Supabase

1. Abra o SQL Editor do Supabase.
2. Execute o conteúdo de `supabase.sql`.
3. As tabelas criadas serão:
   - `orders`
   - `order_items`
   - `webhook_events`

## Instalação local

```bash
npm install
npm run dev
```

## Rotas disponíveis

- `GET /health`
- `GET /api/health`
- `GET /api/config/public`
- `POST /api/checkout`
- `POST /api/orders`
- `GET /api/orders/:reference`
- `POST /api/webhooks/mercadopago`

## Payload esperado em `POST /api/checkout`

```json
{
  "items": [
    {
      "name": "Zé Pilintra",
      "price": 129.9,
      "quantity": 1,
      "color": "Off White",
      "size": "G",
      "image": "./images/hero-ze-pilintra-off-white.jpg"
    }
  ],
  "customer": {
    "name": "Luiz Paulo",
    "email": "contato@exemplo.com",
    "phone": "21999999999",
    "cpf": "12345678909",
    "newsletter": true
  },
  "address": {
    "cep": "20040002",
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 202",
    "neighborhood": "Centro",
    "city": "Rio de Janeiro",
    "state": "RJ"
  },
  "shipping": {
    "label": "SEDEX",
    "price": 29.9,
    "deadline": "2 a 4 dias úteis"
  },
  "notes": "Entregar em horário comercial"
}
```

## Resposta de `POST /api/checkout`

```json
{
  "message": "Checkout criado com sucesso.",
  "orderId": "uuid",
  "orderNumber": "RG-2026-12345678",
  "externalReference": "RG-2026-12345678-ABC123",
  "preferenceId": "123456789-xxxx",
  "initPoint": "https://www.mercadopago.com.br/checkout/v1/redirect?...",
  "sandboxInitPoint": null,
  "publicKey": "APP_USR-...",
  "totals": {
    "subtotal": 129.9,
    "shipping": 29.9,
    "total": 159.8
  }
}
```

## Integração com o frontend atual da Rio Groove Store

No HTML atual, o checkout já coleta:
- nome
- email
- telefone / WhatsApp
- CPF
- CEP
- rua
- número
- complemento
- bairro
- cidade
- estado
- observações

A integração recomendada é:

1. montar o carrinho em um array `items`
2. enviar os dados do formulário para `POST /api/checkout`
3. receber `initPoint`
4. redirecionar o usuário para o Mercado Pago

Exemplo:

```html
<script>
  const API_BASE = 'https://SEU-BACKEND.onrender.com';

  async function iniciarCheckout(payload) {
    const response = await fetch(`${API_BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro no checkout');

    window.location.href = data.initPoint;
  }
</script>
```

## Configuração do webhook no Mercado Pago

No painel do Mercado Pago, configure a URL:

```txt
https://SEU-BACKEND.onrender.com/api/webhooks/mercadopago
```

## Deploy no Render

1. Suba esta pasta para um repositório Git.
2. Crie um novo serviço Web no Render.
3. Conecte o repositório.
4. O Render pode usar o `render.yaml` automaticamente.
5. Preencha as variáveis sensíveis:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MERCADO_PAGO_ACCESS_TOKEN`
   - `BACKEND_URL`
6. Após o deploy, teste:
   - `/health`
   - `/api/config/public`
   - `/api/checkout`

## Observações finais

- `SUPABASE_ANON_KEY` não é obrigatória no backend, mas foi mantida no `.env.example` por consistência com o projeto.
- O backend usa apenas a `SERVICE_ROLE_KEY` para persistir pedidos.
- O frontend da Rio Groove deve consumir apenas as rotas públicas da API.
