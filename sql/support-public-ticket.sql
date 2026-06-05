-- ============================================================
-- AgentForge — Allow public users to raise a support ticket
-- Run this in Supabase SQL Editor.
-- ============================================================
-- The /support page form lets any visitor (logged-in or not)
-- create a ticket with status 'open'. Admins still manage them.
-- ============================================================

alter table public.support_tickets enable row level security;

drop policy if exists "support public submit" on public.support_tickets;
create policy "support public submit"
  on public.support_tickets for insert
  to authenticated, anon
  with check (status = 'open');
