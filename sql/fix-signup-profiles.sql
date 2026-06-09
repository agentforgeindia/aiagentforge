-- ============================================================
-- AgentForge — Fix: New signups not appearing in admin backend
-- Run this in Supabase SQL Editor. Safe to re-run any number of times.
-- ============================================================
-- Root cause: No handle_new_user trigger existed, so profile creation
-- depended entirely on the client-side ensureUserProfile() call. When
-- Supabase email-confirmation is ON, there is no active session at
-- signup time → auth.uid() = null → RLS blocks INSERT → profile never
-- created → admin (Customers + Leads/Free-signups) sees nothing.
--
-- This version is SELF-CONTAINED — it does NOT assume customer-referrals.sql
-- was run first. It creates the referral_code column if missing, so the
-- whole script can't error/rollback partway and skip the backfill.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Make sure the columns the trigger/backfill rely on exist.
--    (If customer-referrals.sql was never run, referral_code is missing
--     and the original script rolled back, leaving profiles empty.)
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists referral_code           text,
  add column if not exists referred_by             text,
  add column if not exists referral_credits_earned int not null default 0;

create unique index if not exists profiles_refcode_idx
  on public.profiles (referral_code);

-- ────────────────────────────────────────────────────────────
-- 1. BACKFILL FIRST — create profile rows for every auth user that
--    has no profile yet. Done before anything that could error, so
--    even on a partial failure the signups are already visible.
-- ────────────────────────────────────────────────────────────
insert into public.profiles (id, email, full_name, credits, plan)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  100,
  'free'
from auth.users u
where u.email is not null
  and not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Give every profile a referral code if it doesn't have one.
update public.profiles
set referral_code = upper(substr(md5(id::text), 1, 8))
where referral_code is null;

-- ────────────────────────────────────────────────────────────
-- 2. handle_new_user — runs as service role, bypasses RLS.
--    Guarantees a profile row the instant someone registers, even
--    when email confirmation is ON (no session yet).
-- ────────────────────────────────────────────────────────────
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
  on conflict (id) do nothing;   -- safe if client already inserted
  return new;
exception when others then
  -- Never block auth signup if profile insert hiccups — log & continue.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 3. Profiles INSERT RLS — authenticated user inserting own row.
-- ────────────────────────────────────────────────────────────
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 4. VERIFY — run these after the script. The first two should
--    match (or be very close), and the third should be 0.
-- ────────────────────────────────────────────────────────────
select
  (select count(*) from auth.users)        as auth_users,
  (select count(*) from public.profiles)   as profiles,
  (select count(*) from auth.users u
     where not exists (select 1 from public.profiles p where p.id = u.id)
  )                                         as users_missing_profile,
  (select count(*) from public.free_signups(500, 90)) as free_signups_shown;
-- ============================================================
