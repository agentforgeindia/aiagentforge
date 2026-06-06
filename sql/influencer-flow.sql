-- ============================================================
-- AgentForge — Influencer (Content Creator) Flow Tables
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Influencer Scripts (admin uploads scripts for influencers) ──
create table if not exists public.influencer_scripts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  script_text text not null,
  video_ref   text,           -- optional reference video URL
  status      text not null default 'active' check (status in ('active','archived')),
  created_by  text,           -- admin email
  created_at  timestamptz not null default now()
);

alter table public.influencer_scripts enable row level security;
create policy "Admins manage influencer_scripts"
  on public.influencer_scripts for all using (true) with check (true);

-- ── 2. Influencer Video Submissions ───────────────────────────
create table if not exists public.influencer_video_submissions (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.candidates(id) on delete cascade,
  script_id     uuid references public.influencer_scripts(id) on delete set null,
  video_url     text not null,
  platform      text,               -- instagram | youtube | facebook | other
  caption       text,
  status        text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  admin_note    text,
  reviewed_by   text,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.influencer_video_submissions enable row level security;
create policy "Admins manage influencer_video_submissions"
  on public.influencer_video_submissions for all using (true) with check (true);

create index if not exists ivs_candidate_idx on public.influencer_video_submissions (candidate_id);

-- ── 3. Add earnings columns to content_creator_social if missing ──
alter table public.content_creator_social
  add column if not exists total_signups   int default 0,
  add column if not exists total_purchases int default 0,
  add column if not exists total_earnings  numeric(12,2) default 0;

-- ── 4. View: influencer dashboard data ────────────────────────
create or replace view public.v_influencer_dashboard as
select
  c.id                        as candidate_id,
  c.name,
  c.email,
  c.mobile,
  c.stage,
  c.demo_video_url,
  css.referral_code,
  css.referral_status,
  css.instagram_url,
  css.youtube_url,
  css.facebook_url,
  css.niche,
  css.total_signups,
  css.total_purchases,
  css.total_earnings,
  -- count signups via this referral code
  (select count(*) from public.profiles p where p.referred_by = css.referral_code) as live_signups,
  -- sum earnings from referral_earnings table
  (select coalesce(sum(commission_amount),0)
     from public.referral_earnings re
    where re.referral_code = css.referral_code) as live_earnings,
  (select count(*) from public.referral_earnings re
    where re.referral_code = css.referral_code) as live_purchases,
  c.created_at as applied_at
from public.candidates c
join public.content_creator_social css on css.candidate_id = c.id
where c.role_slug = 'content-creator';

-- ── 5. View: referral purchases detail for influencer ─────────
create or replace view public.v_influencer_referral_detail as
select
  re.referral_code,
  re.commission_amount,
  re.purchase_amount,
  re.status,
  re.created_at,
  re.order_id,
  p.full_name     as buyer_name,
  p.email         as buyer_email,
  'purchase'      as event_type
from public.referral_earnings re
left join public.profiles p on p.referred_by = re.referral_code
union all
select
  p.referred_by   as referral_code,
  null            as commission_amount,
  null            as purchase_amount,
  'signup'        as status,
  p.created_at,
  null            as order_id,
  p.full_name     as buyer_name,
  p.email         as buyer_email,
  'signup'        as event_type
from public.profiles p
where p.referred_by is not null;

-- ── 6. Admin view: all influencers with aggregated stats ───────
create or replace view public.v_admin_influencers as
select
  c.id                        as candidate_id,
  c.name,
  c.email,
  c.mobile,
  c.stage,
  c.created_at,
  css.referral_code,
  css.referral_status,
  css.instagram_url,
  css.youtube_url,
  css.followers_count,
  css.avg_views,
  css.niche,
  css.ai_score,
  (select count(*) from public.profiles p where p.referred_by = css.referral_code) as total_signups,
  (select count(*) from public.referral_earnings re where re.referral_code = css.referral_code) as total_purchases,
  (select coalesce(sum(commission_amount),0) from public.referral_earnings re where re.referral_code = css.referral_code) as total_earnings,
  (select count(*) from public.influencer_video_submissions ivs where ivs.candidate_id = c.id) as videos_submitted,
  (select count(*) from public.influencer_video_submissions ivs where ivs.candidate_id = c.id and ivs.status = 'approved') as videos_approved
from public.candidates c
join public.content_creator_social css on css.candidate_id = c.id
where c.role_slug = 'content-creator'
order by c.created_at desc;
