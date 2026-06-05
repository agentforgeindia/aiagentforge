-- ============================================================
-- AgentForge — WhatsApp CRM: per-contact tags + assignment
-- Run this in Supabase SQL Editor.
-- ============================================================
-- A contact record per phone number for tagging + assigning
-- conversations (Textile / Jewellery / Hot Lead / Enterprise...).
-- ============================================================

create table if not exists public.whatsapp_contacts (
  wa_from      text primary key,
  wa_name      text,
  tags         text[] not null default '{}',
  assigned_to  text,
  notes        text,
  updated_at   timestamptz not null default now()
);

alter table public.whatsapp_contacts enable row level security;
drop policy if exists "wac read"  on public.whatsapp_contacts;
drop policy if exists "wac write" on public.whatsapp_contacts;
create policy "wac read"  on public.whatsapp_contacts for select to authenticated using (public.has_permission('support.view') or public.has_permission('*'));
create policy "wac write" on public.whatsapp_contacts for all    to authenticated using (public.has_permission('support.manage') or public.has_permission('*')) with check (public.has_permission('support.manage') or public.has_permission('*'));
