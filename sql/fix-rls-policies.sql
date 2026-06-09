-- ============================================================
-- AgentForge — RLS policies for candidate_stage_log + candidate_notifications
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- Both tables had RLS enabled but NO policy → authenticated users were
-- fully blocked. candidate_stage_log is read by the admin Candidates page
-- with the signed-in (authenticated) client, so the stage timeline was
-- silently coming back empty. These policies grant access to admins and
-- clear the "RLS Enabled No Policy" suggestions.
-- (service_role always bypasses RLS, so the APIs keep working.)
-- ============================================================

-- ── candidate_stage_log — admins can read + write ───────────────
alter table public.candidate_stage_log enable row level security;

drop policy if exists "csl_admin_read"  on public.candidate_stage_log;
create policy "csl_admin_read" on public.candidate_stage_log
  for select to authenticated
  using (public.has_permission('hr.view') or public.has_permission('*'));

drop policy if exists "csl_admin_write" on public.candidate_stage_log;
create policy "csl_admin_write" on public.candidate_stage_log
  for insert to authenticated
  with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- ── candidate_notifications — admins can read ───────────────────
-- (writes happen via service-role APIs, which bypass RLS)
alter table public.candidate_notifications enable row level security;

drop policy if exists "cn_admin_read" on public.candidate_notifications;
create policy "cn_admin_read" on public.candidate_notifications
  for select to authenticated
  using (public.has_permission('hr.view') or public.has_permission('*'));
-- ============================================================
