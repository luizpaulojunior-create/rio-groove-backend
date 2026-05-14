create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  external_reference text not null unique,
  status text not null default 'created' check (status in (
    'created',
    'awaiting_payment',
    'awaiting_capture',
    'paid',
    'payment_failed',
    'cancelled',
    'refunded',
    'fulfilled'
  )),
  payment_status text not null default 'pending' check (payment_status in (
    'pending',
    'authorized',
    'paid',
    'failed',
    'refunded'
  )),
  payment_provider text not null default 'mercado_pago',
  currency text not null default 'BRL',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_cpf text,
  accepts_marketing boolean not null default false,
  shipping_method text not null default 'Entrega padrão',
  shipping_amount numeric(10,2) not null default 0,
  shipping_deadline text,
  shipping_cep text,
  shipping_street text,
  shipping_number text,
  shipping_complement text,
  shipping_neighborhood text,
  shipping_city text,
  shipping_state text,
  notes text,
  items_count integer not null default 0,
  subtotal_amount numeric(10,2) not null,
  total_amount numeric(10,2) not null,
  mercado_pago_preference_id text,
  mercado_pago_payment_id text,
  mercado_pago_merchant_order_id text,
  mercado_pago_status text,
  mercado_pago_status_detail text,
  payment_init_point text,
  payment_sandbox_init_point text,
  paid_at timestamptz,
  raw_checkout_payload jsonb,
  payment_payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_name text not null,
  product_slug text,
  image_url text,
  color text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  metadata_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  topic text not null,
  action text,
  resource_id text not null,
  payload jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(provider, topic, resource_id)
);

create index if not exists idx_orders_external_reference on public.orders(external_reference);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_webhook_events_resource_id on public.webhook_events(resource_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.webhook_events enable row level security;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();
