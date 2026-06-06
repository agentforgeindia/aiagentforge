-- ============================================================
-- AgentForge — Careers v2 Extended Tables
-- Run this in Supabase SQL Editor AFTER recruitment.sql
-- ============================================================

-- ── 1. Update recruitment_roles schema ───────────────────────
alter table public.recruitment_roles
  add column if not exists salary_display    text,
  add column if not exists salary_base       numeric(10,2),
  add column if not exists salary_incentive  text,
  add column if not exists is_referral_based boolean default false,
  add column if not exists job_type          text default 'wfh'; -- wfh | office

-- Add Office Executive role
insert into public.recruitment_roles (title, slug, description, is_open, openings, work_type, location, salary_display, salary_base, salary_incentive, job_type)
values ('Office Executive', 'office-executive', 'Back-office coordination, admin support, data entry, client follow-ups.', true, 3, 'office', 'Office (Pan India)', '₹8,000 + Incentive', 8000, 'Performance-based', 'office')
on conflict (slug) do nothing;

-- Update salary info for each role
update public.recruitment_roles set salary_display='₹5,000 + Incentive',   salary_base=5000,  salary_incentive='Performance-based', job_type='wfh'    where slug='telecaller';
update public.recruitment_roles set salary_display='₹8,000 + Incentive',   salary_base=8000,  salary_incentive='Performance-based', job_type='wfh'    where slug='support-executive';
update public.recruitment_roles set salary_display='₹10,000 + Incentive',  salary_base=10000, salary_incentive='Performance-based', job_type='wfh'    where slug='marketing-executive';
update public.recruitment_roles set salary_display='Referral Commission',   is_referral_based=true,  job_type='wfh'                                     where slug='content-creator';
update public.recruitment_roles set salary_display='₹10,000 + Incentive',  salary_base=10000, salary_incentive='Performance-based', openings=5, job_type='wfh' where slug='hr-executive';
update public.recruitment_roles set salary_display='₹8,000 + Incentive',   salary_base=8000,  salary_incentive='Performance-based', job_type='office'  where slug='office-executive';

-- Close Designer, AI Operator, Developer, Sales Executive
update public.recruitment_roles set is_open=false, openings=0 where slug in ('designer','ai-operator','developer','sales-executive');

-- ── 2. candidate_payments table ──────────────────────────────
create table if not exists public.candidate_payments (
  id                    uuid primary key default gen_random_uuid(),
  candidate_id          uuid references public.candidates(id) on delete cascade,
  razorpay_order_id     text,
  razorpay_payment_id   text,
  amount                numeric(10,2) not null default 500,
  status                text not null default 'pending' check (status in ('pending','paid','failed')),
  login_email           text,
  login_password        text,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists cp_candidate_idx on public.candidate_payments (candidate_id);

-- ── 3. content_creator_social table ─────────────────────────
create table if not exists public.content_creator_social (
  id                uuid primary key default gen_random_uuid(),
  candidate_id      uuid references public.candidates(id) on delete cascade,
  instagram_url     text,
  youtube_url       text,
  facebook_url      text,
  other_url         text,
  followers_count   text,
  avg_views         text,
  niche             text,
  ai_score          int default 0,
  ai_verdict        text default 'pending' check (ai_verdict in ('pending','strong_influencer','moderate','not_fit')),
  referral_code     text unique,
  referral_status   text default 'pending' check (referral_status in ('pending','offered','accepted','declined','active')),
  candidate_response text, -- 'yes' | 'no'
  social_manager_reviewed boolean default false,
  created_at        timestamptz not null default now()
);

-- ── 4. referral_earnings table ───────────────────────────────
create table if not exists public.referral_earnings (
  id                uuid primary key default gen_random_uuid(),
  referral_code     text not null,
  candidate_id      uuid references public.candidates(id),
  order_id          text,
  purchase_amount   numeric(10,2),
  commission_pct    numeric(5,2) default 10,
  commission_amount numeric(10,2),
  status            text not null default 'pending' check (status in ('pending','cleared','paid')),
  cleared_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists re_code_idx on public.referral_earnings (referral_code);

-- ── 5. recruitment_notifications (high command alerts) ───────
create table if not exists public.recruitment_notifications (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid references public.candidates(id),
  candidate_name  text,
  role_slug       text,
  event_type      text not null, -- 'passed_test' | 'payment_done' | 'content_creator_applied'
  total_score     int,
  details         jsonb,
  is_read         boolean default false,
  created_at      timestamptz not null default now()
);

-- ── 6. RLS ───────────────────────────────────────────────────
alter table public.candidate_payments          enable row level security;
alter table public.content_creator_social      enable row level security;
alter table public.referral_earnings           enable row level security;
alter table public.recruitment_notifications   enable row level security;

-- candidate_payments
drop policy if exists "cp_anon_insert" on public.candidate_payments;
create policy "cp_anon_insert" on public.candidate_payments for insert to anon with check (true);
drop policy if exists "cp_auth_read"  on public.candidate_payments;
create policy "cp_auth_read"  on public.candidate_payments for select to authenticated using (public.has_permission('hr.view') or public.has_permission('*'));
drop policy if exists "cp_auth_write" on public.candidate_payments;
create policy "cp_auth_write" on public.candidate_payments for update to authenticated using (public.has_permission('hr.manage') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- content_creator_social
drop policy if exists "ccs_anon_insert" on public.content_creator_social;
create policy "ccs_anon_insert" on public.content_creator_social for insert to anon with check (true);
drop policy if exists "ccs_anon_update" on public.content_creator_social;
create policy "ccs_anon_update" on public.content_creator_social for update to anon using (true) with check (true);
drop policy if exists "ccs_auth_read"   on public.content_creator_social;
create policy "ccs_auth_read"   on public.content_creator_social for select to authenticated using (public.has_permission('hr.view') or public.has_permission('*'));
drop policy if exists "ccs_auth_write"  on public.content_creator_social;
create policy "ccs_auth_write"  on public.content_creator_social for update to authenticated using (public.has_permission('hr.manage') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- referral_earnings — public read (for referral tracking page)
drop policy if exists "re_public_read" on public.referral_earnings;
create policy "re_public_read"  on public.referral_earnings for select using (true);
drop policy if exists "re_auth_write"  on public.referral_earnings;
create policy "re_auth_write"   on public.referral_earnings for all to authenticated using (public.has_permission('hr.manage') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- recruitment_notifications — anon insert, auth read/update
drop policy if exists "rn_anon_insert" on public.recruitment_notifications;
create policy "rn_anon_insert" on public.recruitment_notifications for insert to anon with check (true);
drop policy if exists "rn_auth_read"   on public.recruitment_notifications;
create policy "rn_auth_read"   on public.recruitment_notifications for select to authenticated using (public.has_permission('hr.view') or public.has_permission('*'));
drop policy if exists "rn_auth_update" on public.recruitment_notifications;
create policy "rn_auth_update" on public.recruitment_notifications for update to authenticated using (public.has_permission('hr.view') or public.has_permission('*')) with check (public.has_permission('hr.view') or public.has_permission('*'));

-- ── 7. Extend candidates stage ───────────────────────────────
alter table public.candidates drop constraint if exists candidates_stage_check;
alter table public.candidates add constraint candidates_stage_check check (stage in (
  'applied','training_started','training_completed',
  'assessment_started','assessment_completed','passed',
  'interview_eligible','interview_scheduled','selected',
  'offer_sent','offer_accepted','security_paid','hired',
  'rejected','talent_pool'
));

alter table public.candidates
  add column if not exists address           text,
  add column if not exists locality          text,
  add column if not exists landmark          text,
  add column if not exists latitude          double precision,
  add column if not exists longitude         double precision,
  add column if not exists distance_km       numeric(8,2),
  add column if not exists details_completed boolean default false;
