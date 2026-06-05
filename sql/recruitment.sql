-- ============================================================
-- AgentForge — Hiring OS (Recruitment) · Phase 1 backbone
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Tables:
--   recruitment_roles      — open positions to apply for
--   candidates             — applicants (no-resume model)
--   recruitment_questions  — MCQ question bank (role-wise)
--   assessment_attempts    — test attempts + section scores
--   interviews             — interview records + ratings
--   offers                 — generated offers + salary
-- ============================================================

-- ── 1. Roles candidates can apply for ────────────────────────
create table if not exists public.recruitment_roles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  is_open     boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.recruitment_roles (title, slug) values
  ('Telecaller','telecaller'),
  ('Sales Executive','sales-executive'),
  ('Support Executive','support-executive'),
  ('Marketing Executive','marketing-executive'),
  ('Content Creator','content-creator'),
  ('AI Operator','ai-operator'),
  ('Designer','designer'),
  ('Developer','developer')
on conflict (slug) do nothing;

-- ── 2. Candidates ────────────────────────────────────────────
create table if not exists public.candidates (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  mobile           text not null,
  email            text,
  city             text,
  state            text,
  linkedin         text,
  portfolio        text,
  role_slug        text,                          -- applied for
  -- pipeline stage
  stage            text not null default 'applied' check (stage in (
                     'applied','training_started','training_completed',
                     'assessment_started','assessment_completed','passed',
                     'interview_eligible','interview_scheduled','selected',
                     'offer_sent','offer_accepted','hired','rejected','talent_pool'
                   )),
  -- scores (0-100)
  knowledge_score  int,
  product_score    int,
  crm_score        int,
  sales_score      int,
  trust_score      int,
  final_score      int,
  -- AI recommendation
  ai_recommendation text check (ai_recommendation in ('hire','hold','reject')),
  -- salary
  current_salary   numeric(10,2),
  expected_salary  numeric(10,2),
  min_salary       numeric(10,2),
  offered_salary   numeric(10,2),
  -- talent pool tag
  pool_tag         text,                          -- 'future','high_potential','rehire'
  source           text default 'portal',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists candidates_stage_idx on public.candidates (stage, created_at desc);
create index if not exists candidates_role_idx  on public.candidates (role_slug);
create unique index if not exists candidates_mobile_idx on public.candidates (mobile);

-- ── 3. Question bank ─────────────────────────────────────────
create table if not exists public.recruitment_questions (
  id           uuid primary key default gen_random_uuid(),
  role_slug    text,                              -- null = common
  section      text not null check (section in ('basic','product','crm','sales','aptitude')),
  difficulty   text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  question     text not null,
  options      text[] not null,                   -- 4 options
  correct_idx  int not null,                      -- 0-3
  created_at   timestamptz not null default now()
);

create index if not exists rq_section_idx on public.recruitment_questions (role_slug, section);

-- ── 4. Assessment attempts ───────────────────────────────────
create table if not exists public.assessment_attempts (
  id             uuid primary key default gen_random_uuid(),
  candidate_id   uuid references public.candidates(id) on delete cascade,
  attempt_no     int not null default 1,
  section_scores jsonb,                            -- {basic: 80, product: 60, ...}
  total_score    int,
  passed         boolean,
  cheat_flags    int not null default 0,
  duration_secs  int,
  created_at     timestamptz not null default now()
);

-- ── 5. Interviews ────────────────────────────────────────────
create table if not exists public.interviews (
  id             uuid primary key default gen_random_uuid(),
  candidate_id   uuid references public.candidates(id) on delete cascade,
  scheduled_at   timestamptz,
  interviewer    text,
  comm_rating    int,                              -- 1-10
  confidence     int,
  product_rating int,
  culture_fit    int,
  notes          text,
  result         text check (result in ('selected','hold','rejected')),
  created_at     timestamptz not null default now()
);

-- ── 6. Offers ────────────────────────────────────────────────
create table if not exists public.recruitment_offers (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.candidates(id) on delete cascade,
  offer_type    text not null default 'full_time' check (offer_type in (
                  'full_time','part_time','wfh','remote','hybrid','internship','freelance','contract'
                )),
  fixed_salary  numeric(10,2),
  joining_bonus numeric(10,2),
  incentive_plan text,
  status        text not null default 'draft' check (status in ('draft','sent','accepted','declined')),
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.recruitment_roles     enable row level security;
alter table public.candidates            enable row level security;
alter table public.recruitment_questions enable row level security;
alter table public.assessment_attempts   enable row level security;
alter table public.interviews            enable row level security;
alter table public.recruitment_offers    enable row level security;

-- roles list is public-readable (candidate portal); rest admin-only.
drop policy if exists "rec_roles read" on public.recruitment_roles;
create policy "rec_roles read" on public.recruitment_roles for select using (true);
drop policy if exists "rec_roles write" on public.recruitment_roles;
create policy "rec_roles write" on public.recruitment_roles for all to authenticated
  using (public.has_permission('hr.manage') or public.has_permission('*'))
  with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- candidates: admins with hr.view read; hr.manage write. Public insert (portal apply).
drop policy if exists "cand read"   on public.candidates;
drop policy if exists "cand write"  on public.candidates;
drop policy if exists "cand apply"  on public.candidates;
create policy "cand read"  on public.candidates for select to authenticated using (public.has_permission('hr.view') or public.has_permission('*'));
create policy "cand write" on public.candidates for all    to authenticated using (public.has_permission('hr.manage') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));
create policy "cand apply" on public.candidates for insert to anon with check (true);

-- helper to gate the rest
do $$ begin end $$;

drop policy if exists "rq read"  on public.recruitment_questions;
drop policy if exists "rq write" on public.recruitment_questions;
create policy "rq read"  on public.recruitment_questions for select to authenticated using (public.has_permission('hr.view') or public.has_permission('*'));
create policy "rq write" on public.recruitment_questions for all    to authenticated using (public.has_permission('hr.manage') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

drop policy if exists "aa rw" on public.assessment_attempts;
create policy "aa rw" on public.assessment_attempts for all to authenticated using (public.has_permission('hr.view') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

drop policy if exists "iv rw" on public.interviews;
create policy "iv rw" on public.interviews for all to authenticated using (public.has_permission('hr.view') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

drop policy if exists "ro rw" on public.recruitment_offers;
create policy "ro rw" on public.recruitment_offers for all to authenticated using (public.has_permission('hr.view') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- ── Permissions (reuse hr.view / hr.manage) ──────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['hr.view','hr.manage'])), updated_at = now()
 where id = 'founder';

-- ── recruitment_overview() — dashboard funnel + analytics ────
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
      'applied',             (select count(*) from public.candidates),
      'training_started',    (select count(*) from public.candidates where stage in ('training_started','training_completed','assessment_started','assessment_completed','passed','interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'training_completed',  (select count(*) from public.candidates where stage in ('training_completed','assessment_started','assessment_completed','passed','interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'passed',              (select count(*) from public.candidates where stage in ('passed','interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'interview_eligible',  (select count(*) from public.candidates where stage in ('interview_eligible','interview_scheduled','selected','offer_sent','offer_accepted','hired')),
      'selected',            (select count(*) from public.candidates where stage in ('selected','offer_sent','offer_accepted','hired')),
      'offers_sent',         (select count(*) from public.candidates where stage in ('offer_sent','offer_accepted','hired')),
      'offers_accepted',     (select count(*) from public.candidates where stage in ('offer_accepted','hired')),
      'hired',               (select count(*) from public.candidates where stage = 'hired'),
      'rejected',            (select count(*) from public.candidates where stage = 'rejected'),
      'talent_pool',         (select count(*) from public.candidates where stage = 'talent_pool')
    ),
    'by_role', (
      select coalesce(jsonb_agg(jsonb_build_object('role', coalesce(role_slug,'unknown'), 'count', c) order by c desc), '[]')
      from (select role_slug, count(*)::int as c from public.candidates group by role_slug) x
    ),
    'leaderboard', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', name, 'role', role_slug, 'final', final_score, 'stage', stage
      ) order by final_score desc nulls last), '[]')
      from (select name, role_slug, final_score, stage from public.candidates where final_score is not null order by final_score desc limit 10) x
    ),
    'rates', jsonb_build_object(
      'selection_rate', case when (select count(*) from public.candidates) > 0
                        then round((select count(*) from public.candidates where stage in ('selected','offer_sent','offer_accepted','hired'))::numeric * 100 / (select count(*) from public.candidates), 1) else 0 end,
      'joining_rate',   case when (select count(*) from public.candidates where stage in ('offer_sent','offer_accepted','hired')) > 0
                        then round((select count(*) from public.candidates where stage='hired')::numeric * 100 / (select count(*) from public.candidates where stage in ('offer_sent','offer_accepted','hired')), 1) else 0 end
    )
  );
end;
$$;

revoke all on function public.recruitment_overview() from public;
grant execute on function public.recruitment_overview() to authenticated, service_role, anon;
