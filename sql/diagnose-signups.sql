-- ============================================================
-- DIAGNOSTIC — why don't website signups show in admin?
-- Run each query in Supabase SQL Editor and note the counts.
-- ============================================================

-- 1. How many auth users (actual website signups) exist?
select count(*) as auth_users from auth.users;

-- 2. How many profiles exist?
select count(*) as profiles from public.profiles;

-- 3. Auth users WITHOUT a profile (the broken ones).
--    If this is > 0, the handle_new_user trigger / backfill
--    has NOT been run yet → run fix-signup-profiles.sql.
select count(*) as users_missing_profile
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 4. Does the handle_new_user trigger exist?
--    Expect 1 row if fix-signup-profiles.sql was run.
select tgname
from pg_trigger
where tgname = 'on_auth_user_created';

-- 5. What does free_signups() actually return?
select count(*) as free_signup_count from public.free_signups(500, 90);

-- 6. Breakdown — why might profiles be excluded from free_signups?
--    (paid, already a lead, or plan not free, or older than 90 days)
select
  count(*) filter (where p.email is null)                                          as no_email,
  count(*) filter (where p.plan is not null and lower(p.plan) not in ('free','free trial')) as not_free_plan,
  count(*) filter (where p.created_at < now() - interval '90 days')                as older_than_90d,
  count(*) filter (where exists (select 1 from public.payments pay where pay.user_id = p.id and pay.status = 'paid')) as has_paid,
  count(*) filter (where exists (
      select 1 from public.leads l
      where l.converted_user_id = p.id
         or (l.email is not null and lower(l.email) = lower(p.email))
  )) as already_a_lead
from public.profiles p;

-- 7. Show the 10 most recent profiles (sanity check newest signups).
select id, email, full_name, plan, created_at
from public.profiles
order by created_at desc
limit 10;
