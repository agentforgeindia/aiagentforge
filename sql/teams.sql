-- ============================================================
-- AgentForge Team Access
-- Run in Supabase SQL Editor (in this order, once).
-- ============================================================
-- Model: one owner creates a team, invites members by email.
-- Credits live in a shared pool (teams.credits).
-- Owner tops up the pool; members consume from it.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Core tables
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits          BIGINT NOT NULL DEFAULT 0,
  plan             TEXT NOT NULL DEFAULT 'free',
  plan_expires_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  invited_by  UUID REFERENCES auth.users(id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  role        TEXT NOT NULL DEFAULT 'member',
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log for team credit movements
CREATE TABLE IF NOT EXISTS public.team_credit_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),  -- who triggered it
  delta         BIGINT NOT NULL,                  -- negative = used, positive = topup/refund
  reason        TEXT NOT NULL,
  generation_id TEXT,
  balance_after BIGINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. Indexes
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS team_members_user_idx  ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS team_members_team_idx  ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS team_invites_email_idx ON public.team_invites (email);
CREATE INDEX IF NOT EXISTS team_invites_token_idx ON public.team_invites (token);
CREATE INDEX IF NOT EXISTS team_credit_tx_team_idx ON public.team_credit_transactions (team_id, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 3. Row-Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.teams                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_credit_transactions ENABLE ROW LEVEL SECURITY;

-- teams: members can read their own team
DROP POLICY IF EXISTS "teams_member_read" ON public.teams;
CREATE POLICY "teams_member_read" ON public.teams
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- team_members: members can see their team's member list
DROP POLICY IF EXISTS "team_members_read" ON public.team_members;
CREATE POLICY "team_members_read" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- team_invites: owner/admin can read invites for their team
DROP POLICY IF EXISTS "team_invites_read" ON public.team_invites;
CREATE POLICY "team_invites_read" ON public.team_invites
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- team_credit_transactions: members can read their own team's log
DROP POLICY IF EXISTS "team_credit_tx_read" ON public.team_credit_transactions;
CREATE POLICY "team_credit_tx_read" ON public.team_credit_transactions
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- All writes go through service_role (functions below), no client INSERT policies.

-- ────────────────────────────────────────────────────────────
-- 4. Atomic team credit deduction
-- Returns new balance, or NULL if insufficient.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.deduct_team_credits(
  p_team_id       UUID,
  p_actor_id      UUID,
  p_amount        BIGINT,
  p_reason        TEXT DEFAULT 'generate',
  p_generation_id TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan    TEXT;
  v_balance BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'deduct_team_credits: amount must be positive';
  END IF;

  SELECT plan INTO v_plan FROM public.teams WHERE id = p_team_id FOR UPDATE;

  IF v_plan IN ('Empire', 'Founder', 'Unlimited') THEN
    SELECT credits INTO v_balance FROM public.teams WHERE id = p_team_id;
    INSERT INTO public.team_credit_transactions (team_id, actor_user_id, delta, reason, generation_id, balance_after)
    VALUES (p_team_id, p_actor_id, 0, p_reason || ':unlimited', p_generation_id, v_balance);
    RETURN v_balance;
  END IF;

  UPDATE public.teams
     SET credits    = credits - p_amount,
         updated_at = NOW()
   WHERE id = p_team_id
     AND credits >= p_amount
  RETURNING credits INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN NULL; -- caller maps to HTTP 402
  END IF;

  INSERT INTO public.team_credit_transactions (team_id, actor_user_id, delta, reason, generation_id, balance_after)
  VALUES (p_team_id, p_actor_id, -p_amount, p_reason, p_generation_id, v_balance);

  RETURN v_balance;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 5. Team credit refund
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refund_team_credits(
  p_team_id       UUID,
  p_actor_id      UUID,
  p_amount        BIGINT,
  p_reason        TEXT DEFAULT 'refund',
  p_generation_id TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'refund_team_credits: amount must be positive';
  END IF;

  UPDATE public.teams
     SET credits    = credits + p_amount,
         updated_at = NOW()
   WHERE id = p_team_id
  RETURNING credits INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'refund_team_credits: team % not found', p_team_id;
  END IF;

  INSERT INTO public.team_credit_transactions (team_id, actor_user_id, delta, reason, generation_id, balance_after)
  VALUES (p_team_id, p_actor_id, p_amount, p_reason, p_generation_id, v_balance);

  RETURN v_balance;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 6. Add credits to team pool (owner tops up)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.topup_team_credits(
  p_team_id  UUID,
  p_actor_id UUID,
  p_amount   BIGINT,
  p_reason   TEXT DEFAULT 'topup'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'topup_team_credits: amount must be positive';
  END IF;

  UPDATE public.teams
     SET credits    = credits + p_amount,
         updated_at = NOW()
   WHERE id = p_team_id
  RETURNING credits INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'topup_team_credits: team % not found', p_team_id;
  END IF;

  INSERT INTO public.team_credit_transactions (team_id, actor_user_id, delta, reason, generation_id, balance_after)
  VALUES (p_team_id, p_actor_id, p_amount, p_reason, NULL, v_balance);

  RETURN v_balance;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 7. Lock down EXECUTE to service_role only
-- ────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.deduct_team_credits(UUID, UUID, BIGINT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_team_credits(UUID, UUID, BIGINT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.topup_team_credits(UUID, UUID, BIGINT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.deduct_team_credits(UUID, UUID, BIGINT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_team_credits(UUID, UUID, BIGINT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.topup_team_credits(UUID, UUID, BIGINT, TEXT) TO service_role;

-- ────────────────────────────────────────────────────────────
-- 8. Add team_id to generations table (nullable — personal gens unaffected)
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

CREATE INDEX IF NOT EXISTS generations_team_idx ON public.generations (team_id);
