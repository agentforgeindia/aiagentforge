-- ============================================================
-- AgentForge — Support Center (Phase 2)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── 1. Support tickets table ─────────────────────────────────
create table if not exists public.support_tickets (
  id            uuid primary key default gen_random_uuid(),
  ticket_number serial unique,
  user_id       uuid references auth.users(id) on delete set null,
  user_email    text,
  user_name     text,
  category      text not null check (category in (
                  'billing', 'generation', 'refund', 'account', 'general'
                )),
  subject       text not null,
  description   text,
  status        text not null default 'open' check (status in (
                  'open', 'in_progress', 'resolved', 'closed'
                )),
  priority      text not null default 'normal' check (priority in (
                  'low', 'normal', 'high', 'urgent'
                )),
  assigned_to   text,
  resolution    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);
create index if not exists support_tickets_user_idx   on public.support_tickets (user_id, created_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets admin" on public.support_tickets;
create policy "support_tickets admin"
  on public.support_tickets for all to authenticated
  using (public.has_permission('support.view'))
  with check (public.has_permission('support.manage'));

-- ── 2. Permissions ───────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'support.view', 'support.manage'
   ])), updated_at = now()
 where id in ('founder', 'admin');

-- ── 3. support_metrics() ────────────────────────────────────
create or replace function public.support_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today   date := current_date;
  v_w_start date := current_date - 6;
  v_result  jsonb;
begin
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('support.view')
    or public.has_permission('*')
  ) then
    raise exception 'support_metrics: permission denied';
  end if;

  with counts as (
    select
      count(*)::int                                                        as total,
      count(*) filter (where status = 'open')::int                        as open_count,
      count(*) filter (where status = 'in_progress')::int                 as in_progress_count,
      count(*) filter (where status = 'resolved')::int                    as resolved_count,
      count(*) filter (where status = 'closed')::int                      as closed_count,
      count(*) filter (where priority = 'urgent')::int                    as urgent_count,
      count(*) filter (where created_at::date = v_today)::int             as opened_today,
      count(*) filter (where created_at::date >= v_w_start)::int          as opened_week,
      count(*) filter (where category = 'billing')::int                   as billing_issues,
      count(*) filter (where category = 'generation')::int                as generation_issues,
      count(*) filter (where category = 'refund')::int                    as refund_requests,
      count(*) filter (where category = 'account')::int                   as account_issues,
      count(*) filter (where category = 'general')::int                   as general_issues
    from public.support_tickets
  ),
  recent as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',            t.id,
      'ticket_number', t.ticket_number,
      'user_email',    t.user_email,
      'user_name',     t.user_name,
      'category',      t.category,
      'subject',       t.subject,
      'status',        t.status,
      'priority',      t.priority,
      'assigned_to',   t.assigned_to,
      'created_at',    t.created_at,
      'updated_at',    t.updated_at
    ) order by
      case t.priority when 'urgent' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,
      t.created_at desc
    ), '[]'::jsonb) as data
    from public.support_tickets t
    where t.status in ('open', 'in_progress')
    limit 50
  )
  select jsonb_build_object(
    'counts',  row_to_json(c)::jsonb,
    'recent',  r.data
  ) into v_result
  from counts c, recent r;

  return v_result;
exception
  when undefined_table or undefined_column then
    return jsonb_build_object('error', 'support_tickets table missing');
end;
$$;

revoke all on function public.support_metrics() from public;
grant execute on function public.support_metrics() to authenticated, service_role;
