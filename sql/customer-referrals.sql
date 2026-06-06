-- ============================================================
-- AgentForge — Customer Referral Rewards
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Refer a friend → they sign up with your code → YOU get 50
-- credits, and the new user gets a 25-credit welcome bonus
-- (double-sided referral converts much better).
-- ============================================================

-- 1. Columns on profiles
alter table public.profiles
  add column if not exists referral_code           text,
  add column if not exists referred_by             text,
  add column if not exists referral_credits_earned int not null default 0;

create unique index if not exists profiles_refcode_idx on public.profiles (referral_code);

-- Backfill codes for existing users
update public.profiles
   set referral_code = upper(substr(md5(id::text), 1, 8))
 where referral_code is null;

-- Auto-assign a code to every new profile
create or replace function public.set_referral_code()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.referral_code is null then
    new.referral_code := upper(substr(md5(new.id::text || clock_timestamp()::text), 1, 8));
  end if;
  return new;
end$$;

drop trigger if exists profiles_set_refcode on public.profiles;
create trigger profiles_set_refcode
  before insert on public.profiles
  for each row execute function public.set_referral_code();

-- 2. Referrals ledger (prevents double rewards)
create table if not exists public.referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references auth.users(id) on delete cascade,
  referred_id     uuid not null references auth.users(id) on delete cascade,
  credits_awarded int not null default 50,
  created_at      timestamptz not null default now(),
  unique (referred_id)            -- a user can only be referred once
);

alter table public.referrals enable row level security;
drop policy if exists "referrals own read" on public.referrals;
create policy "referrals own read" on public.referrals for select to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_id or public.is_admin());

-- 3. process_referral() — called after signup with the stored code
create or replace function public.process_referral(p_ref_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_new      uuid := auth.uid();
  v_referrer uuid;
  v_already  text;
begin
  if v_new is null then return jsonb_build_object('ok', false, 'error', 'not logged in'); end if;
  if p_ref_code is null or length(trim(p_ref_code)) = 0 then return jsonb_build_object('ok', false, 'error', 'no code'); end if;

  -- already referred?
  select referred_by into v_already from public.profiles where id = v_new;
  if v_already is not null then return jsonb_build_object('ok', false, 'error', 'already referred'); end if;

  -- find referrer (cannot refer yourself)
  select id into v_referrer from public.profiles where referral_code = upper(trim(p_ref_code)) and id <> v_new limit 1;
  if v_referrer is null then return jsonb_build_object('ok', false, 'error', 'invalid code'); end if;

  -- mark new user
  update public.profiles set referred_by = upper(trim(p_ref_code)) where id = v_new;

  -- reward referrer (50) + new user welcome bonus (25), via the blessed RPC
  perform public.refund_credits(p_user_id := v_referrer, p_amount := 50, p_reason := 'referral_reward',         p_generation_id := null);
  perform public.refund_credits(p_user_id := v_new,      p_amount := 25, p_reason := 'referral_signup_bonus',  p_generation_id := null);

  update public.profiles set referral_credits_earned = coalesce(referral_credits_earned,0) + 50 where id = v_referrer;
  insert into public.referrals(referrer_id, referred_id, credits_awarded) values (v_referrer, v_new, 50)
    on conflict (referred_id) do nothing;

  return jsonb_build_object('ok', true, 'referrer_reward', 50, 'your_bonus', 25);
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end$$;

revoke all on function public.process_referral(text) from public;
grant execute on function public.process_referral(text) to authenticated, service_role;

-- 4. get_my_referral() — for the /rewards page
create or replace function public.get_my_referral()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_id uuid := auth.uid(); v_code text; v_earned int; v_count int;
begin
  if v_id is null then return jsonb_build_object('error','not logged in'); end if;
  select referral_code, coalesce(referral_credits_earned,0) into v_code, v_earned from public.profiles where id = v_id;
  select count(*) into v_count from public.referrals where referrer_id = v_id;
  return jsonb_build_object(
    'code', v_code,
    'link', 'https://aiagentforge.in/?ref=' || coalesce(v_code,''),
    'referred_count', v_count,
    'credits_earned', v_earned
  );
end$$;

revoke all on function public.get_my_referral() from public;
grant execute on function public.get_my_referral() to authenticated, service_role;
