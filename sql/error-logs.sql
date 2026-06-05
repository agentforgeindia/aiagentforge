-- ============================================================
-- AgentForge — Error Logs / System Health
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Central place for failures: generation, API, webhook, payment.
-- Server code logs here via log_error(); founder/admin review them.
-- ============================================================

create table if not exists public.error_logs (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in (
                'generation','api','webhook','payment','email','whatsapp','other'
              )),
  source      text,                              -- e.g. 'fal','razorpay','meta-lead'
  message     text not null,
  details     jsonb,
  user_id     uuid,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists error_logs_cat_idx     on public.error_logs (category, created_at desc);
create index if not exists error_logs_created_idx on public.error_logs (created_at desc);

alter table public.error_logs enable row level security;
drop policy if exists "errors read"  on public.error_logs;
drop policy if exists "errors write" on public.error_logs;
create policy "errors read"  on public.error_logs for select to authenticated using (public.has_permission('audit.view') or public.has_permission('*'));
create policy "errors write" on public.error_logs for all    to authenticated using (public.has_permission('*')) with check (public.has_permission('*'));

-- Service-role logger used by API routes.
create or replace function public.log_error(
  p_category text,
  p_source   text,
  p_message  text,
  p_details  jsonb default null,
  p_user_id  uuid default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.error_logs(category, source, message, details, user_id)
    values (p_category, p_source, p_message, p_details, p_user_id)
    returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.log_error(text, text, text, jsonb, uuid) from public;
grant execute on function public.log_error(text, text, text, jsonb, uuid) to authenticated, service_role;

-- Summary for the dashboard.
create or replace function public.error_log_summary(p_limit int default 100)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (public.has_permission('audit.view') or public.has_permission('*')) then
    raise exception 'error_log_summary: permission denied';
  end if;
  return jsonb_build_object(
    'counts', jsonb_build_object(
      'total',        (select count(*) from public.error_logs),
      'unresolved',   (select count(*) from public.error_logs where not resolved),
      'today',        (select count(*) from public.error_logs where created_at::date = current_date),
      'payment',      (select count(*) from public.error_logs where category='payment' and not resolved),
      'webhook',      (select count(*) from public.error_logs where category='webhook' and not resolved),
      'generation',   (select count(*) from public.error_logs where category='generation' and not resolved)
    ),
    'recent', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'category', category, 'source', source,
        'message', message, 'resolved', resolved, 'created_at', created_at
      ) order by created_at desc), '[]')
      from (select * from public.error_logs order by created_at desc limit p_limit) x
    )
  );
end;
$$;

revoke all on function public.error_log_summary(int) from public;
grant execute on function public.error_log_summary(int) to authenticated, service_role;
