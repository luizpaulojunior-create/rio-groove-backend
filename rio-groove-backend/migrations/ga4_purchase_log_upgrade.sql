-- Upgrade ga4_purchase_log (rodar no Supabase se a tabela já existir na versão simples)
alter table public.ga4_purchase_log add column if not exists provider text not null default 'ga4';
alter table public.ga4_purchase_log add column if not exists status text not null default 'sent';
alter table public.ga4_purchase_log add column if not exists attempts integer not null default 1;
alter table public.ga4_purchase_log add column if not exists event_id text;
alter table public.ga4_purchase_log add column if not exists analytics_consent boolean;
alter table public.ga4_purchase_log add column if not exists last_http_status integer;
alter table public.ga4_purchase_log add column if not exists last_response jsonb;
alter table public.ga4_purchase_log add column if not exists last_error text;
alter table public.ga4_purchase_log add column if not exists payload jsonb;
alter table public.ga4_purchase_log add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.ga4_purchase_log add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- sent_at pode ter sido NOT NULL na versão anterior; manter nullable para eventos ignorados
alter table public.ga4_purchase_log alter column sent_at drop not null;

create index if not exists idx_ga4_purchase_log_status on public.ga4_purchase_log(status);
