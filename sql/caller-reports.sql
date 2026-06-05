-- ============================================================
-- AgentForge — Daily Caller Report
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.caller_reports (
  id              uuid primary key default gen_random_uuid(),
  caller_email    text not null,
  caller_name     text,
  report_date     date not null default current_date,
  total_calls     int not null default 0,
  connected       int not null default 0,
  demos_sent      int not null default 0,
  pricing_sent    int not null default 0,
  interested      int not null default 0,
  hot_leads       int not null default 0,
  callbacks       int not null default 0,
  not_interested  int not null default 0,
  wrong_numbers   int not null default 0,
  paid_conversions int not null default 0,
  remarks         text,
  created_at      timestamptz not null default now(),
  unique (caller_email, report_date)
);

create index if not exists caller_reports_date_idx on public.caller_reports (report_date desc);

alter table public.caller_reports enable row level security;

-- Caller manages own rows; supervisors (team.view) read all.
drop policy if exists "cr own"   on public.caller_reports;
drop policy if exists "cr admin" on public.caller_reports;

create policy "cr own"
  on public.caller_reports for all to authenticated
  using (lower(caller_email) = lower((select email from auth.users where id = auth.uid())))
  with check (lower(caller_email) = lower((select email from auth.users where id = auth.uid())));

create policy "cr admin"
  on public.caller_reports for select to authenticated
  using (public.has_permission('team.view') or public.has_permission('*'));

-- ── caller_report_summary() — team totals for a date ─────────
create or replace function public.caller_report_summary(p_date date default current_date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (public.has_permission('team.view') or public.has_permission('*')) then
    raise exception 'caller_report_summary: permission denied';
  end if;

  return jsonb_build_object(
    'date', p_date,
    'totals', (
      select jsonb_build_object(
        'callers',         count(*),
        'total_calls',     coalesce(sum(total_calls),0),
        'connected',       coalesce(sum(connected),0),
        'demos_sent',      coalesce(sum(demos_sent),0),
        'interested',      coalesce(sum(interested),0),
        'hot_leads',       coalesce(sum(hot_leads),0),
        'paid',            coalesce(sum(paid_conversions),0)
      ) from public.caller_reports where report_date = p_date
    ),
    'rows', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'caller_email', caller_email, 'caller_name', caller_name,
        'total_calls', total_calls, 'connected', connected,
        'demos_sent', demos_sent, 'interested', interested,
        'hot_leads', hot_leads, 'paid', paid_conversions, 'remarks', remarks
      ) order by hot_leads desc, total_calls desc), '[]')
      from public.caller_reports where report_date = p_date
    )
  );
end;
$$;

revoke all on function public.caller_report_summary(date) from public;
grant execute on function public.caller_report_summary(date) to authenticated, service_role;
