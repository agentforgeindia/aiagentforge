-- ============================================================
-- AgentForge — Generation Log (detailed per-generation view)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Reads public.generations with filters for the AI Operations
-- detail page. Joins agent_costs for per-gen cost + profiles for
-- the user email. Tolerant of column-name differences.
-- ============================================================

create or replace function public.generation_log(
  p_limit  int default 100,
  p_agent  text default null,
  p_status text default null
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_rate numeric;
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('ai_ops.view') or public.has_permission('*')) then
    raise exception 'generation_log: permission denied';
  end if;

  select coalesce(usd_to_inr_rate, 83.5) into v_rate from public.ai_cost_settings where id = 1;
  v_rate := coalesce(v_rate, 83.5);

  return (
    select coalesce(jsonb_agg(row), '[]'::jsonb)
    from (
      select jsonb_build_object(
        'id',          g.id,
        'agent',       coalesce(g.agent_type, g.agent_slug, g.agent),
        'user_id',     g.user_id,
        'email',       p.email,
        'status',      g.status,
        'created_at',  g.created_at,
        'cost_usd',    coalesce(c.cost_per_generation_usd, 0.04),
        'cost_inr',    round(coalesce(c.cost_per_generation_usd, 0.04) * v_rate, 2)
      ) as row
      from public.generations g
      left join public.agent_costs c on c.agent_slug = coalesce(g.agent_type, g.agent_slug, g.agent)
      left join public.profiles p on p.id = g.user_id
      where (p_agent  is null or coalesce(g.agent_type, g.agent_slug, g.agent) = p_agent)
        and (p_status is null or g.status = p_status)
      order by g.created_at desc
      limit greatest(p_limit, 1)
    ) sub
  );
exception when undefined_table or undefined_column then
  return '[]'::jsonb;
end;
$$;

revoke all on function public.generation_log(int, text, text) from public;
grant execute on function public.generation_log(int, text, text) to authenticated, service_role;
