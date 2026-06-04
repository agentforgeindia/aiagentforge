-- ============================================================
-- AgentForge — Agent Management (Phase 3+)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Add columns to existing agent_costs table
alter table public.agent_costs
  add column if not exists enabled            boolean not null default true,
  add column if not exists credits_per_gen    int     not null default 15,
  add column if not exists display_name       text,
  add column if not exists prompt_version     text    default 'v1',
  add column if not exists description        text;

-- Fill display names for existing rows
update public.agent_costs set display_name = 'Jewellery AI',       description = 'AI model shoots for jewellery brands'         where agent_slug = 'jewellery';
update public.agent_costs set display_name = 'Textile AI',         description = 'Textile patterns into fashion mockups'         where agent_slug = 'textile';
update public.agent_costs set display_name = 'Productography AI',  description = 'Product images into catalogue visuals'         where agent_slug = 'productography';
update public.agent_costs set display_name = 'UGC Forge',          description = 'User generated content creator'               where agent_slug = 'ugc';
update public.agent_costs set display_name = 'Social Ads',         description = 'Social media ad creatives'                    where agent_slug = 'social-ads';
update public.agent_costs set display_name = 'TrendForge',         description = 'Trend analysis and content ideas'             where agent_slug = 'trendforge';
update public.agent_costs set display_name = 'Election Campaign',  description = 'Political campaign creatives'                 where agent_slug = 'election-campaign';

-- ── Permissions ─────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'agents.view', 'agents.manage'
   ])), updated_at = now()
 where id in ('founder', 'admin');

-- ── agent_configs_list() ─────────────────────────────────────
create or replace function public.agent_configs_list()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (
    current_user in ('service_role', 'postgres')
    or public.has_permission('agents.view')
    or public.has_permission('*')
  ) then
    raise exception 'agent_configs_list: permission denied';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'agent_slug',         agent_slug,
      'display_name',       coalesce(display_name, agent_slug),
      'description',        description,
      'enabled',            enabled,
      'credits_per_gen',    credits_per_gen,
      'cost_per_gen_usd',   cost_per_generation_usd,
      'prompt_version',     prompt_version,
      'notes',              notes,
      'updated_at',         updated_at
    ) order by agent_slug), '[]'::jsonb)
    from public.agent_costs
  );
end;
$$;

revoke all on function public.agent_configs_list() from public;
grant execute on function public.agent_configs_list() to authenticated, service_role;
