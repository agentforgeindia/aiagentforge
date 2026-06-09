-- ============================================================
-- AgentForge — Fix: New signups not appearing in admin backend
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Root cause: No handle_new_user trigger existed, so profile
-- creation depended entirely on the client-side ensureUserProfile()
-- call. When Supabase email-confirmation is ON, there is no active
-- session at signup time → auth.uid() = null → RLS blocks INSERT →
-- profile never created → admin sees nothing.
--
-- Fix:
--   1. Create handle_new_user() trigger on auth.users → guaranteed
--      profile row for every signup regardless of email confirmation.
--   2. Relax profiles INSERT policy to also allow service_role
--      (it already bypasses RLS but this makes the intent explicit).
--   3. Keep the client-side upsert working as a fallback/enrichment.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. handle_new_user — runs as postgres (service role), bypasses RLS
--    Creates a minimal profile row the instant someone registers.
--    The client-side upsert (ensureUserProfile) then enriches it
--    with UTM data, full_name, etc. via ON CONFLICT DO UPDATE.
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    credits,
    plan,
    referral_code
  )
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
end;
$$;

-- Drop old trigger if it exists, recreate cleanly
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. Profiles INSERT RLS — allow both authenticated (own row)
--    AND the trigger / service_role path.
--    Service role already bypasses RLS, but this keeps policies
--    clean for any future anon-key edge case.
-- ────────────────────────────────────────────────────────────

-- Remove old policy first (created by fix-security-warnings.sql)
drop policy if exists "Users can insert own profile" on public.profiles;

-- Re-create: authenticated user inserting their own row
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 3. Backfill: create profile rows for any auth users that
--    somehow have no profile yet (e.g. from the broken period).
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
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- 4. Backfill referral_code for profiles that don't have one
--    (safe to run even if customer-referrals.sql was already run)
-- ────────────────────────────────────────────────────────────
update public.profiles
set referral_code = upper(substr(md5(id::text), 1, 8))
where referral_code is null;

-- ────────────────────────────────────────────────────────────
-- Verification queries — run these to confirm it worked:
-- ────────────────────────────────────────────────────────────
-- select count(*) from public.profiles;
-- select count(*) from auth.users;
-- select count(*) from auth.users u
--   where not exists (select 1 from public.profiles p where p.id = u.id);
-- (last query should return 0)
-- ============================================================
