-- ============================================================
-- AgentForge — Lead Scoring System
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Add score columns to leads table
alter table public.leads
  add column if not exists score         int     not null default 0,
  add column if not exists score_reasons text[]  not null default '{}',
  add column if not exists last_scored_at timestamptz;

-- ── score_lead() — calculate score for one lead ──────────────
create or replace function public.score_lead(p_lead_id uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_lead   record;
  v_score  int := 0;
  v_reasons text[] := '{}';
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then return 0; end if;

  -- Source scoring
  if v_lead.source in ('google', 'facebook', 'instagram') then
    v_score := v_score + 20;
    v_reasons := array_append(v_reasons, 'Paid ad lead (+20)');
  elsif v_lead.source = 'referral' then
    v_score := v_score + 30;
    v_reasons := array_append(v_reasons, 'Referral lead (+30)');
  elsif v_lead.source = 'website' then
    v_score := v_score + 15;
    v_reasons := array_append(v_reasons, 'Website inquiry (+15)');
  else
    v_score := v_score + 5;
    v_reasons := array_append(v_reasons, 'Other source (+5)');
  end if;

  -- Status scoring
  case v_lead.status
    when 'qualified' then v_score := v_score + 20; v_reasons := array_append(v_reasons, 'Qualified (+20)');
    when 'demo'      then v_score := v_score + 30; v_reasons := array_append(v_reasons, 'Demo scheduled (+30)');
    when 'trial'     then v_score := v_score + 40; v_reasons := array_append(v_reasons, 'Demo done (+40)');
    when 'contacted' then v_score := v_score + 10; v_reasons := array_append(v_reasons, 'Contacted (+10)');
    else null;
  end case;

  -- Has phone
  if v_lead.phone is not null then
    v_score := v_score + 10;
    v_reasons := array_append(v_reasons, 'Has phone (+10)');
  end if;

  -- Has email
  if v_lead.email is not null then
    v_score := v_score + 10;
    v_reasons := array_append(v_reasons, 'Has email (+10)');
  end if;

  -- Has business name
  if v_lead.business_name is not null then
    v_score := v_score + 10;
    v_reasons := array_append(v_reasons, 'Has business (+10)');
  end if;

  -- Recency — newer leads score higher
  if v_lead.created_at >= now() - interval '3 days' then
    v_score := v_score + 15;
    v_reasons := array_append(v_reasons, 'Fresh lead 3d (+15)');
  elsif v_lead.created_at >= now() - interval '7 days' then
    v_score := v_score + 8;
    v_reasons := array_append(v_reasons, 'Recent lead 7d (+8)');
  elsif v_lead.created_at < now() - interval '30 days' then
    v_score := v_score - 15;
    v_reasons := array_append(v_reasons, 'Old lead 30d+ (-15)');
  end if;

  -- Tags — high-intent keywords
  if v_lead.tags && ARRAY['urgent','hot','interested','price asked'] then
    v_score := v_score + 20;
    v_reasons := array_append(v_reasons, 'Hot tag (+20)');
  end if;

  -- Cap at 100
  v_score := least(greatest(v_score, 0), 100);

  -- Persist
  update public.leads
     set score = v_score, score_reasons = v_reasons, last_scored_at = now()
   where id = p_lead_id;

  return v_score;
end;
$$;

-- ── score_all_leads() — batch score ──────────────────────────
create or replace function public.score_all_leads()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_lead_id uuid;
  v_count   int := 0;
begin
  for v_lead_id in
    select id from public.leads where status not in ('converted','lost')
  loop
    perform public.score_lead(v_lead_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Trigger: auto-score on insert/update
create or replace function public.trigger_score_lead()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.score_lead(new.id);
  return new;
end;
$$;

drop trigger if exists leads_auto_score on public.leads;
create trigger leads_auto_score
  after insert or update of status, source, phone, email, business_name, tags
  on public.leads
  for each row execute function public.trigger_score_lead();

revoke all on function public.score_lead(uuid)    from public;
revoke all on function public.score_all_leads()   from public;
grant execute on function public.score_lead(uuid)  to authenticated, service_role;
grant execute on function public.score_all_leads() to authenticated, service_role;

-- Score all existing leads
select public.score_all_leads();
