-- ============================================================
-- AgentForge — Recruitment fixes
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
-- 1. Hiring OS counts content-creator (influencer) applicants — they
--    are managed separately in the Influencer Hub. Exclude them from
--    the recruitment_overview funnel / rates / by_role / leaderboard.
-- 2. Candidate delete fails / candidate reappears because two foreign
--    keys (referral_earnings, recruitment_notifications) lack ON DELETE
--    CASCADE, so deleting a candidate raises an FK violation. Add cascade.
-- ============================================================

-- ── 1. FK cascade so a candidate can be hard-deleted cleanly ─────
do $$
begin
  alter table public.referral_earnings drop constraint if exists referral_earnings_candidate_id_fkey;
  alter table public.referral_earnings
    add constraint referral_earnings_candidate_id_fkey
    foreign key (candidate_id) references public.candidates(id) on delete cascade;
exception when others then null;
end$$;

do $$
begin
  alter table public.recruitment_notifications drop constraint if exists recruitment_notifications_candidate_id_fkey;
  alter table public.recruitment_notifications
    add constraint recruitment_notifications_candidate_id_fkey
    foreign key (candidate_id) references public.candidates(id) on delete cascade;
exception when others then null;
end$$;

-- ── 2. recruitment_overview — exclude content-creator everywhere ──
create or replace function public.recruitment_overview()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (public.has_permission('hr.view') or public.has_permission('*')) then
    raise exception 'recruitment_overview: permission denied';
  end if;

  return jsonb_build_object(
    'funnel', jsonb_build_object(
      'applied',             (select count(*) from public.candidates where role_slug is distinct from 'content-creator'),
      'training_started',    (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('training_started','training_completed','assessment_started','assessment_completed','passed','interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'training_completed',  (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('training_completed','assessment_started','assessment_completed','passed','interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'passed',              (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('passed','interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'interview_eligible',  (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'selected',            (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('selected','offer_sent','offer_accepted','hired')),
      'offers_sent',         (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('offer_sent','offer_accepted','hired')),
      'offers_accepted',     (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('offer_accepted','hired')),
      'hired',               (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage = 'hired'),
      'rejected',            (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage = 'rejected'),
      'talent_pool',         (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage = 'talent_pool')
    ),
    'by_role', (
      select coalesce(jsonb_agg(jsonb_build_object('role', coalesce(role_slug,'unknown'), 'count', c) order by c desc), '[]')
      from (select role_slug, count(*)::int as c from public.candidates where role_slug is distinct from 'content-creator' group by role_slug) x
    ),
    'leaderboard', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', name, 'role', role_slug, 'final', final_score, 'stage', stage
      ) order by final_score desc nulls last), '[]')
      from (select name, role_slug, final_score, stage from public.candidates where role_slug is distinct from 'content-creator' and final_score is not null order by final_score desc limit 10) x
    ),
    'rates', jsonb_build_object(
      'selection_rate', case when (select count(*) from public.candidates where role_slug is distinct from 'content-creator') > 0
                        then round((select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('selected','offer_sent','offer_accepted','hired'))::numeric * 100 / (select count(*) from public.candidates where role_slug is distinct from 'content-creator'), 1) else 0 end,
      'joining_rate',   case when (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('offer_sent','offer_accepted','hired')) > 0
                        then round((select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage='hired')::numeric * 100 / (select count(*) from public.candidates where role_slug is distinct from 'content-creator' and stage in ('offer_sent','offer_accepted','hired')), 1) else 0 end
    )
  );
end;
$$;

revoke all on function public.recruitment_overview() from public, anon;
grant execute on function public.recruitment_overview() to authenticated, service_role;
-- ============================================================
