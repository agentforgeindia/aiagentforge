-- ============================================================
-- AgentForge — generation source (mobile app / mobile browser / desktop website)
-- Applied to the live database on 2026-10-06 (Supabase migrations
-- "generations_client_source" + "customer_timeline_generation_source").
-- Kept here for reference; safe to re-run.
-- ============================================================
-- generations.client_source is set by the server on every insert
-- (lib/clientSource.ts → detectClientSource(request)):
--   app        = AgentForge mobile app (user-agent carries "AgentForgeApp/<version>")
--   mobile_web = phone / tablet browser
--   web        = desktop / laptop browser
--   NULL       = generation made before tracking started
-- ============================================================

alter table public.generations add column if not exists client_source text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'generations_client_source_chk') then
    alter table public.generations
      add constraint generations_client_source_chk
      check (client_source is null or client_source in ('app', 'mobile_web', 'web'));
  end if;
end$$;

create index if not exists generations_client_source_created_idx
  on public.generations (client_source, created_at desc);

-- Generation Log with source + source filter ('app' | 'mobile_web' | 'web' | 'unknown').
-- The older 3-argument generation_log() is left in place.
create or replace function public.generation_log_v2(
  p_limit  integer default 100,
  p_agent  text    default null,
  p_status text    default null,
  p_source text    default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare v_rate numeric;
begin
  if not (coalesce(auth.jwt() ->> 'role', '') not in ('anon', 'authenticated') or public.has_permission('ai_ops.view') or public.has_permission('*')) then
    raise exception 'generation_log_v2: permission denied';
  end if;
  begin select coalesce(usd_to_inr_rate,83.5) into v_rate from public.ai_cost_settings where id=1; exception when undefined_table then v_rate:=83.5; end;
  v_rate := coalesce(v_rate, 83.5);

  return (
    select coalesce(jsonb_agg(row), '[]'::jsonb) from (
      select jsonb_build_object(
        'id', g.id, 'agent', coalesce(g.agent_type,'other'), 'user_id', g.user_id,
        'email', p.email, 'status', g.status, 'created_at', g.created_at,
        'source', g.client_source,
        'cost_usd', coalesce(c.cost_per_generation_usd, 0.04),
        'cost_inr', round(coalesce(c.cost_per_generation_usd, 0.04) * v_rate, 2)
      ) as row
      from public.generations g
      left join public.agent_costs c on c.agent_slug = g.agent_type
      left join public.profiles p on p.id = g.user_id
      where (p_agent is null or coalesce(g.agent_type,'other') = p_agent)
        and (p_status is null or g.status = p_status)
        and (p_source is null
             or (p_source = 'unknown' and g.client_source is null)
             or g.client_source = p_source)
      order by g.created_at desc limit greatest(p_limit,1)
    ) sub
  );
end;
$function$;

revoke all on function public.generation_log_v2(integer, text, text, text) from public, anon;
grant execute on function public.generation_log_v2(integer, text, text, text) to authenticated, service_role;

-- Counts per source — all users (p_user_id null) or one user; p_days null = all time.
create or replace function public.generation_source_stats(
  p_user_id uuid    default null,
  p_days    integer default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if not (coalesce(auth.jwt() ->> 'role', '') not in ('anon', 'authenticated')
          or public.has_permission('ai_ops.view')
          or public.has_permission('customers.view')
          or public.has_permission('*')) then
    raise exception 'generation_source_stats: permission denied';
  end if;

  return (
    select jsonb_build_object(
      'app',             count(*) filter (where g.client_source = 'app'),
      'mobile_web',      count(*) filter (where g.client_source = 'mobile_web'),
      'web',             count(*) filter (where g.client_source = 'web'),
      'unknown',         count(*) filter (where g.client_source is null),
      'total',           count(*),
      'last_app',        max(g.created_at) filter (where g.client_source = 'app'),
      'last_mobile_web', max(g.created_at) filter (where g.client_source = 'mobile_web'),
      'last_web',        max(g.created_at) filter (where g.client_source = 'web'),
      'tracked_since',   (select min(t.created_at) from public.generations t where t.client_source is not null)
    )
    from public.generations g
    where (p_user_id is null or g.user_id = p_user_id)
      and (p_days is null or g.created_at >= now() - make_interval(days => p_days))
  );
end;
$function$;

revoke all on function public.generation_source_stats(uuid, integer) from public, anon;
grant execute on function public.generation_source_stats(uuid, integer) to authenticated, service_role;

-- customer_timeline(): the generation line now ends with
-- " · Mobile app" / " · Mobile browser" / " · Desktop website".
-- (Full function body is in the Supabase migration "customer_timeline_generation_source".)
