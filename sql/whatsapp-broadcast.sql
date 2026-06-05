-- ============================================================
-- AgentForge — WhatsApp Broadcast campaigns
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.whatsapp_broadcasts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  message      text not null,
  audience     text not null default 'leads' check (audience in ('leads','customers','custom')),
  recipients   text[] not null default '{}',     -- resolved phone list
  total        int not null default 0,
  sent_count   int not null default 0,
  failed_count int not null default 0,
  status       text not null default 'draft' check (status in ('draft','sending','done','failed')),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

create index if not exists wa_bcast_idx on public.whatsapp_broadcasts (created_at desc);

alter table public.whatsapp_broadcasts enable row level security;
drop policy if exists "wabc read"  on public.whatsapp_broadcasts;
drop policy if exists "wabc write" on public.whatsapp_broadcasts;
create policy "wabc read"  on public.whatsapp_broadcasts for select to authenticated using (public.has_permission('marketing.view') or public.has_permission('support.view') or public.has_permission('*'));
create policy "wabc write" on public.whatsapp_broadcasts for all    to authenticated using (public.has_permission('support.manage') or public.has_permission('*')) with check (public.has_permission('support.manage') or public.has_permission('*'));
