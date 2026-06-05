-- ============================================================
-- AgentForge — Refund & Dispute Center
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.refund_requests (
  id            uuid primary key default gen_random_uuid(),
  customer_email text,
  customer_name  text,
  payment_id     text,                            -- razorpay/payment ref
  amount_inr     numeric(12,2) not null default 0,
  reason         text not null,
  type           text not null default 'refund' check (type in ('refund','dispute','chargeback')),
  status         text not null default 'open' check (status in ('open','approved','rejected','processed')),
  requested_by   text,
  approved_by    text,
  resolution     text,
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists refund_req_status_idx on public.refund_requests (status, created_at desc);

alter table public.refund_requests enable row level security;
drop policy if exists "refundreq read"  on public.refund_requests;
drop policy if exists "refundreq write" on public.refund_requests;
create policy "refundreq read"  on public.refund_requests for select to authenticated using (public.has_permission('invoices.refund') or public.has_permission('support.view') or public.has_permission('*'));
create policy "refundreq write" on public.refund_requests for all    to authenticated using (public.has_permission('invoices.refund') or public.has_permission('support.manage') or public.has_permission('*')) with check (public.has_permission('invoices.refund') or public.has_permission('support.manage') or public.has_permission('*'));
