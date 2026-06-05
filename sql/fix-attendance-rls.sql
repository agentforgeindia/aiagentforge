-- ============================================================
-- AgentForge — Fix "permission denied for table users" in RLS
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Cause: policies read auth.users (not allowed for authenticated).
-- Fix: use auth.jwt() ->> 'email' (no table read needed).
-- ============================================================

-- ── attendance_logs ──────────────────────────────────────────
drop policy if exists "attendance own" on public.attendance_logs;
create policy "attendance own"
  on public.attendance_logs for all to authenticated
  using (lower(member_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(member_email) = lower(auth.jwt() ->> 'email'));

-- ── caller_reports ───────────────────────────────────────────
drop policy if exists "cr own" on public.caller_reports;
create policy "cr own"
  on public.caller_reports for all to authenticated
  using (lower(caller_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(caller_email) = lower(auth.jwt() ->> 'email'));

-- ── attendance_breaks (only if table exists) ─────────────────
do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'attendance_breaks') then
    execute 'drop policy if exists "breaks own" on public.attendance_breaks';
    execute $p$create policy "breaks own" on public.attendance_breaks for all to authenticated
              using (lower(member_email) = lower(auth.jwt() ->> 'email'))
              with check (lower(member_email) = lower(auth.jwt() ->> 'email'))$p$;
  end if;
end $$;

-- ── whatsapp_contacts own-policies don't use auth.users, skip ─
