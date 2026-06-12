-- ============================================================
-- FIX: Welcome notification was NOT firing for new users.
-- ============================================================
-- Diagnosis: the standalone `on_auth_user_welcome` trigger in
-- sql/user-notifications.sql was never applied (or fails silently),
-- so only 1 of 103 signups ever got a welcome notification.
--
-- Fix strategy: fold the welcome notification into the PROVEN
-- `handle_new_user()` trigger (which reliably creates the profile
-- + 100 credits on every signup), drop the broken standalone
-- trigger, and backfill every existing user that never got one.
--
-- Safe to re-run (idempotent — one welcome per user max).
-- Run this WHOLE file in Supabase SQL Editor.
-- ============================================================

-- 1. handle_new_user now ALSO creates the welcome notification.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, credits, plan, referral_code)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    100,
    'free',
    upper(substr(md5(new.id::text || clock_timestamp()::text), 1, 8))
  )
  on conflict (id) do nothing;

  -- Welcome notification — idempotent (only if the user has none yet).
  insert into public.user_notifications (user_id, title, body, link)
  select
    new.id,
    'Welcome to AgentForge! 🎉',
    'Your account is ready with 100 free credits. Try our Textile, Jewellery & Productography AI studios — now with Ultra HD Enhanced results!',
    '/textileprints-to-mockup'
  where not exists (
    select 1 from public.user_notifications
    where user_id = new.id and title like 'Welcome to AgentForge%'
  );

  return new;
exception when others then
  -- Never block auth signup if anything hiccups.
  return new;
end;
$$;

-- Make sure the trigger is attached (no-op if already present).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Remove the old standalone welcome trigger to avoid double-fires.
drop trigger if exists on_auth_user_welcome on auth.users;

-- 3. Backfill: every existing user who never received a welcome.
insert into public.user_notifications (user_id, title, body, link)
select
  p.id,
  'Welcome to AgentForge! 🎉',
  'Your account is ready with 100 free credits. Try our Textile, Jewellery & Productography AI studios — now with Ultra HD Enhanced results!',
  '/textileprints-to-mockup'
from public.profiles p
where not exists (
  select 1 from public.user_notifications n
  where n.user_id = p.id and n.title like 'Welcome to AgentForge%'
);

-- 4. Verify (should now roughly equal your signup count):
--   select count(*) from public.user_notifications where title like 'Welcome%';
--   select count(*) from public.profiles;
-- ============================================================
