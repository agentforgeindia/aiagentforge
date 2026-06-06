-- ============================================================
-- AgentForge credit safety hardening
-- Run this in Supabase SQL Editor.
-- ============================================================
-- BEFORE this change:
--   • Client called  supabase.from("profiles").update({credits: x})  directly.
--   • Two tabs could read 100, both subtract 75 → balance ends at 25
--     instead of -50, but the user still got 2 generations for 75 credits.
--   • DevTools could simply skip the deduction.
--
-- AFTER this change:
--   1. A trigger blocks any client-side UPDATE that touches credits/plan.
--   2. The server (using the service_role key) calls deduct_credits()
--      and refund_credits() — atomic, race-safe SQL functions.
--   3. EXECUTE on those functions is REVOKEd from PUBLIC and only the
--      service_role can call them — so a leaked anon key can't drain
--      anyone's balance.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Audit log of every credit movement (best-effort tracing)
-- ────────────────────────────────────────────────────────────
create table if not exists public.credit_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  delta       bigint not null,                       -- positive = refund/topup, negative = deduction
  reason      text   not null,                       -- e.g. 'jewellery_generate', 'refund:upload_failed'
  generation_id text,                                -- optional FK-ish link to generations.id
  balance_after bigint not null,
  created_at  timestamptz not null default now()
);

create index if not exists credit_tx_user_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;

-- Users can read their own audit trail.
drop policy if exists "credit_tx own read" on public.credit_transactions;
create policy "credit_tx own read"
  on public.credit_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Only service_role writes (functions below).
-- (No INSERT policy for authenticated → blocked by RLS default-deny.)

-- ────────────────────────────────────────────────────────────
-- 2.  Atomic deduct — returns new balance, or NULL if not enough
-- ────────────────────────────────────────────────────────────
-- One UPDATE statement does the read + write atomically, guarded by
-- `credits >= p_amount`. If the guard fails the UPDATE matches 0 rows
-- and RETURNING gives no row, so we return NULL → caller knows to
-- return 402 Payment Required.
--
-- Empire/Unlimited/Founder plans skip deduction entirely.
-- ────────────────────────────────────────────────────────────

create or replace function public.deduct_credits(
  p_user_id       uuid,
  p_amount        bigint,
  p_reason        text default 'generate',
  p_generation_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan      text;
  v_balance   bigint;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'deduct_credits: amount must be positive';
  end if;

  -- Read the plan (small, cheap select). We allow Unlimited plans
  -- to skip deduction so Empire/Founder never lose credits.
  select plan into v_plan
  from public.profiles
  where id = p_user_id
  for update;                       -- row lock for the duration of the txn

  if v_plan in ('Empire','Founder','Unlimited') then
    -- No deduction; still log a 0-delta row so the audit trail is complete.
    select credits into v_balance from public.profiles where id = p_user_id;
    insert into public.credit_transactions(user_id, delta, reason, generation_id, balance_after)
    values (p_user_id, 0, p_reason || ':unlimited', p_generation_id, v_balance);
    return v_balance;
  end if;

  -- Atomic guarded UPDATE — fails if insufficient.
  update public.profiles
     set credits = credits - p_amount,
         updated_at = now()
   where id = p_user_id
     and credits >= p_amount
   returning credits into v_balance;

  if v_balance is null then
    return null;                    -- caller maps to HTTP 402
  end if;

  insert into public.credit_transactions(user_id, delta, reason, generation_id, balance_after)
  values (p_user_id, -p_amount, p_reason, p_generation_id, v_balance);

  return v_balance;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 3.  Refund — happens when n8n fails, upload fails, etc.
-- ────────────────────────────────────────────────────────────
create or replace function public.refund_credits(
  p_user_id       uuid,
  p_amount        bigint,
  p_reason        text default 'refund',
  p_generation_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'refund_credits: amount must be positive';
  end if;

  update public.profiles
     set credits = credits + p_amount,
         updated_at = now()
   where id = p_user_id
   returning credits into v_balance;

  if v_balance is null then
    raise exception 'refund_credits: profile % not found', p_user_id;
  end if;

  insert into public.credit_transactions(user_id, delta, reason, generation_id, balance_after)
  values (p_user_id, p_amount, p_reason, p_generation_id, v_balance);

  return v_balance;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 4.  Lock down EXECUTE — only the server (service_role) can call.
-- ────────────────────────────────────────────────────────────
revoke all on function public.deduct_credits(uuid, bigint, text, text) from public;
revoke all on function public.refund_credits(uuid, bigint, text, text) from public;

grant execute on function public.deduct_credits(uuid, bigint, text, text) to service_role;
grant execute on function public.refund_credits(uuid, bigint, text, text) to service_role;

-- ────────────────────────────────────────────────────────────
-- 5.  Block client-side tampering with credits / plan columns
-- ────────────────────────────────────────────────────────────
-- Any UPDATE that changes credits or plan is rejected unless the
-- caller is service_role (server) or postgres (admin). All other
-- profile updates (full_name, avatar_url, settings…) still work.
-- ────────────────────────────────────────────────────────────

create or replace function public.profiles_block_credit_tampering()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    new.credits is distinct from old.credits
    or new.plan    is distinct from old.plan
  ) then
    if current_user not in ('service_role','postgres') then
      raise exception
        'credits/plan cannot be modified from the client. '
        'Use deduct_credits()/refund_credits() server-side instead.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_credit_tampering on public.profiles;
create trigger profiles_block_credit_tampering
  before update on public.profiles
  for each row execute function public.profiles_block_credit_tampering();

-- ────────────────────────────────────────────────────────────
-- 6.  Verification queries (run manually to confirm)
-- ────────────────────────────────────────────────────────────
--   -- Should succeed (server-side):
--   select public.deduct_credits('00000000-…', 10, 'test');
--
--   -- Should fail with the trigger message (client):
--   update public.profiles set credits = credits + 1000000 where id = auth.uid();
-- ============================================================
