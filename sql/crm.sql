-- ============================================================
-- AgentForge CRM schema
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Four tables:
--   leads             — incoming prospects (IG/FB/WA/call/referral)
--   customer_notes    — per-user notes/tags (only paying users)
--   lead_activities   — calls/messages/emails against a lead or user
--   invoices          — auto-generated GST invoices on payment
--
-- All tables are admin-only (RLS uses public.is_admin() from posts.sql).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  LEADS  (manual entry from IG/FB/WhatsApp/call/etc.)
-- ────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),

  -- Contact identity
  name            text not null,
  email           text,
  phone           text,
  business_name   text,
  city            text,

  -- Channel
  source          text not null default 'other'
                  check (source in (
                    'instagram', 'facebook', 'whatsapp', 'google',
                    'call', 'referral', 'website', 'event', 'other'
                  )),
  source_detail   text,         -- e.g. "FB ad: textile mockups", "Referred by Bhavin"

  -- Pipeline stage
  status          text not null default 'new'
                  check (status in (
                    'new', 'contacted', 'qualified',
                    'demo', 'trial', 'converted', 'lost'
                  )),
  lost_reason     text,         -- only if status = lost

  -- Estimation
  expected_revenue numeric,     -- optional INR
  next_action_at  timestamptz,  -- follow-up reminder

  -- Free-form
  notes           text,
  tags            text[] not null default '{}',

  -- Conversion link (set if lead became a paying user)
  converted_user_id uuid references auth.users(id) on delete set null,

  -- Audit
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status, created_at desc);
create index if not exists leads_source_idx on public.leads (source, created_at desc);
create index if not exists leads_next_action_idx on public.leads (next_action_at)
  where next_action_at is not null;

-- ────────────────────────────────────────────────────────────
-- 2.  CUSTOMER_NOTES  (notes + tags against a signed-up user)
-- ────────────────────────────────────────────────────────────
create table if not exists public.customer_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  note        text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists customer_notes_user_idx
  on public.customer_notes (user_id, created_at desc);

-- ────────────────────────────────────────────────────────────
-- 3.  LEAD_ACTIVITIES  (call / WhatsApp / email log)
-- ────────────────────────────────────────────────────────────
-- Can attach to either a lead OR a customer (signed-up user).
create table if not exists public.lead_activities (
  id              uuid primary key default gen_random_uuid(),

  -- Owner — exactly one of these should be set
  lead_id            uuid references public.leads(id) on delete cascade,
  customer_user_id   uuid references auth.users(id) on delete cascade,

  type            text not null
                  check (type in ('call', 'whatsapp', 'email', 'meeting', 'dm', 'note')),
  direction       text check (direction in ('inbound', 'outbound')),

  summary         text not null,
  outcome         text,             -- e.g. "interested", "not interested", "callback later"
  duration_seconds int,             -- for calls only

  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),

  -- One-of constraint
  constraint lead_activities_owner_one_of
    check (
      (lead_id is not null and customer_user_id is null)
      or (lead_id is null and customer_user_id is not null)
    )
);

create index if not exists lead_activities_lead_idx
  on public.lead_activities (lead_id, created_at desc) where lead_id is not null;
create index if not exists lead_activities_customer_idx
  on public.lead_activities (customer_user_id, created_at desc) where customer_user_id is not null;

-- ────────────────────────────────────────────────────────────
-- 4.  INVOICES  (auto-generated on payment.captured)
-- ────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  invoice_number      text unique not null,           -- e.g. AFA/2026-27/0001
  fy                  text not null,                  -- e.g. "2026-27"

  user_id             uuid not null references auth.users(id) on delete restrict,
  payment_id          uuid references public.payments(id) on delete set null,
  razorpay_payment_id text,                           -- denormalised for traceability

  -- Buyer snapshot (frozen at invoice time)
  buyer_name          text not null,
  buyer_email         text,
  buyer_gstin         text,                           -- nullable for B2C
  buyer_address       text,

  -- Money (INR)
  plan                text not null,
  amount_subtotal     numeric(12,2) not null,         -- before tax
  gst_rate            numeric(5,2)  not null default 18,
  cgst_amount         numeric(12,2) not null default 0,
  sgst_amount         numeric(12,2) not null default 0,
  igst_amount         numeric(12,2) not null default 0,
  total_tax           numeric(12,2) not null default 0,
  amount_total        numeric(12,2) not null,         -- inclusive of tax (= paid amount)

  -- Delivery
  pdf_url             text,                           -- Supabase Storage public URL
  email_sent_at       timestamptz,
  email_to            text,

  created_at          timestamptz not null default now()
);

create index if not exists invoices_user_idx on public.invoices (user_id, created_at desc);
create unique index if not exists invoices_payment_unique
  on public.invoices (payment_id) where payment_id is not null;

-- Sequence per financial year (helper for invoice number generation)
create table if not exists public.invoice_counters (
  fy           text primary key,         -- "2026-27"
  last_number  int  not null default 0
);

-- ────────────────────────────────────────────────────────────
-- 5.  updated_at auto-touch on leads
-- ────────────────────────────────────────────────────────────
create or replace function public.leads_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.leads_touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- 6.  Helper — next invoice number for current FY
-- ────────────────────────────────────────────────────────────
-- Indian FY = April–March. Format: AFA/YYYY-YY/NNNN
create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fy        text;
  v_year_no   int;
  v_next      int;
begin
  -- Compute FY label like "2026-27"
  if extract(month from now()) >= 4 then
    v_year_no := extract(year from now())::int;
  else
    v_year_no := (extract(year from now()) - 1)::int;
  end if;
  v_fy := v_year_no || '-' || lpad(((v_year_no + 1) % 100)::text, 2, '0');

  -- Atomic bump
  insert into public.invoice_counters (fy, last_number)
    values (v_fy, 1)
    on conflict (fy) do update set last_number = invoice_counters.last_number + 1
    returning last_number into v_next;

  return 'AFA/' || v_fy || '/' || lpad(v_next::text, 4, '0');
end;
$$;

revoke all on function public.next_invoice_number() from public;
grant execute on function public.next_invoice_number() to service_role;

-- ────────────────────────────────────────────────────────────
-- 7.  Row Level Security — admin only
-- ────────────────────────────────────────────────────────────
-- Relies on public.is_admin() defined in sql/posts.sql.

alter table public.leads             enable row level security;
alter table public.customer_notes    enable row level security;
alter table public.lead_activities   enable row level security;
alter table public.invoices          enable row level security;
alter table public.invoice_counters  enable row level security;

-- Admins can do everything
drop policy if exists "leads admin all" on public.leads;
create policy "leads admin all" on public.leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customer_notes admin all" on public.customer_notes;
create policy "customer_notes admin all" on public.customer_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lead_activities admin all" on public.lead_activities;
create policy "lead_activities admin all" on public.lead_activities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Invoices: admins do anything, customers can read their own
drop policy if exists "invoices admin all" on public.invoices;
create policy "invoices admin all" on public.invoices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "invoices own read" on public.invoices;
create policy "invoices own read" on public.invoices
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "invoice_counters admin all" on public.invoice_counters;
create policy "invoice_counters admin all" on public.invoice_counters
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 8.  Admin-read on existing tables (profiles / payments / credit_tx)
-- ────────────────────────────────────────────────────────────
-- The CRM admin pages need to read ALL users' profiles, payments,
-- and credit transactions. The base policies only allow users to
-- read their own data. These add an admin override.
-- ────────────────────────────────────────────────────────────

drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "payments admin read" on public.payments;
create policy "payments admin read" on public.payments
  for select to authenticated using (public.is_admin());

drop policy if exists "credit_tx admin read" on public.credit_transactions;
create policy "credit_tx admin read" on public.credit_transactions
  for select to authenticated using (public.is_admin());

-- ============================================================
-- Done. Verification:
--   select * from public.leads limit 5;
--   select public.next_invoice_number();   -- generates AFA/2026-27/0001
--   -- As admin, both should return ALL rows (not just yours):
--   select count(*) from public.profiles;
--   select count(*) from public.payments;
-- ============================================================
