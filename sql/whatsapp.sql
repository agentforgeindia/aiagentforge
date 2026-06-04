-- ============================================================
-- AgentForge — WhatsApp Inbox (Business Cloud API)
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.whatsapp_messages (
  id            uuid primary key default gen_random_uuid(),
  wa_from       text not null,              -- customer phone (E.164)
  wa_name       text,                       -- WhatsApp profile name
  direction     text not null check (direction in ('in','out')),
  body          text not null,
  ai_reply      text,                       -- AI-drafted reply (for inbound)
  reply_sent    boolean not null default false,
  auto_sent     boolean not null default false,
  wa_message_id text,                        -- provider message id
  created_at    timestamptz not null default now()
);

create index if not exists wa_msgs_from_idx    on public.whatsapp_messages (wa_from, created_at desc);
create index if not exists wa_msgs_created_idx  on public.whatsapp_messages (created_at desc);

alter table public.whatsapp_messages enable row level security;

drop policy if exists "wa read"  on public.whatsapp_messages;
drop policy if exists "wa write" on public.whatsapp_messages;
create policy "wa read"  on public.whatsapp_messages for select to authenticated using (public.has_permission('support.view') or public.has_permission('*'));
create policy "wa write" on public.whatsapp_messages for all    to authenticated using (public.has_permission('support.manage') or public.has_permission('*')) with check (public.has_permission('support.manage') or public.has_permission('*'));

-- Helper view: latest message per conversation
create or replace view public.whatsapp_threads as
select distinct on (wa_from)
  wa_from, wa_name, body as last_body, direction as last_direction,
  reply_sent, created_at as last_at
from public.whatsapp_messages
order by wa_from, created_at desc;
