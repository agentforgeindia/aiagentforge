-- ============================================================
-- 2026-10-07 — P0 security fixes (credits, generations, storage)
-- ============================================================
-- Reference copy of the migration applied to the live project
-- (Supabase migration name: p0_security_credits_storage).
--
-- Every statement is safe to run again.
--
--   1. deduct_credits()  — same JSON answer as before (the n8n
--      workflows read `.success`), but every deduction is now
--      written to credit_transactions, and negative amounts are
--      rejected.
--   2. generations       — browsers can no longer INSERT rows
--      (the generate routes insert with the service role).
--   3. profiles          — the tamper trigger now also protects
--      is_unlimited, plan dates, referral fields; referred_by can
--      be set once; client INSERTs cannot start with extra credits.
--   4. feedback          — one feedback row per user + generation.
--   5. storage           — nobody can overwrite or delete other
--      people's files; the catch-all "upload to any bucket" policy
--      is narrowed to the one bucket that needs it.
-- ============================================================


-- ── 1. deduct_credits: keep the JSON contract, add the ledger ──
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount bigint,
  p_reason text,
  p_generation_id text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  current_credits bigint;
  new_credits     bigint;
begin
  if p_amount is null or p_amount < 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid credit amount');
  end if;

  select credits into current_credits
  from public.profiles
  where id = p_user_id
  for update;

  if current_credits is null then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if current_credits < p_amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient credits');
  end if;

  if p_amount = 0 then
    return jsonb_build_object('success', true, 'remaining_credits', current_credits);
  end if;

  update public.profiles
  set credits = credits - p_amount
  where id = p_user_id
  returning credits into new_credits;

  -- Audit trail: without this row nobody can answer "where did my
  -- credits go?", and the refund route cannot tell what was charged.
  insert into public.credit_transactions
    (user_id, type, amount, delta, reason, generation_id, balance_after)
  values
    (p_user_id, 'deduct', p_amount, -p_amount,
     coalesce(nullif(trim(p_reason), ''), 'deduct'), p_generation_id, new_credits);

  return jsonb_build_object('success', true, 'remaining_credits', new_credits);
end;
$function$;


-- ── 2. generations: only the server inserts rows ──────────────
-- The agent pages never insert into generations themselves. Leaving
-- the INSERT policies open let a signed-in user create a row with
-- status = 'failed' and then ask /api/credits/refund for credits.
-- The policies are re-pointed at the service role (which is what the
-- generate routes use) instead of being dropped.
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'generations'
             and policyname = 'Users can insert own generations') then
    alter policy "Users can insert own generations" on public.generations to service_role;
    alter policy "Users can insert own generations" on public.generations
      rename to "generations insert: server only (was: users can insert own)";
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'generations'
             and policyname = 'Users insert own generations') then
    alter policy "Users insert own generations" on public.generations to service_role;
    alter policy "Users insert own generations" on public.generations
      rename to "generations insert: server only (was: users insert own)";
  end if;
end $$;


-- ── 3. profiles: protect every server-owned column ────────────
create or replace function public.profiles_block_credit_tampering()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  -- Server code (service role) and SECURITY DEFINER functions may
  -- change anything.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if (
    new.credits is distinct from old.credits
    or new.plan is distinct from old.plan
  ) then
    raise exception
      'credits/plan cannot be modified from the client. '
      'Use deduct_credits()/refund_credits() server-side instead.';
  end if;

  if (
    new.id                         is distinct from old.id
    or new.is_unlimited            is distinct from old.is_unlimited
    or new.plan_expires_at         is distinct from old.plan_expires_at
    or new.plan_purchased_at       is distinct from old.plan_purchased_at
    or new.last_renewal_alert_at   is distinct from old.last_renewal_alert_at
    or new.referral_code           is distinct from old.referral_code
    or new.referral_credits_earned is distinct from old.referral_credits_earned
    or new.health_score            is distinct from old.health_score
    or new.health_status           is distinct from old.health_status
    or new.health_computed_at      is distinct from old.health_computed_at
    or new.created_at              is distinct from old.created_at
  ) then
    raise exception 'This profile field cannot be modified from the client.';
  end if;

  -- referred_by may be filled in once (referral attribution) but never
  -- changed or cleared afterwards — clearing it would let the referral
  -- bonus be claimed again.
  if old.referred_by is not null
     and new.referred_by is distinct from old.referred_by then
    raise exception 'referred_by can only be set once.';
  end if;

  return new;
end;
$function$;

-- A browser may create its own profile row (fallback when the signup
-- trigger did not), but only as a plain free account.
create or replace function public.profiles_guard_client_insert()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  new.credits := least(greatest(coalesce(new.credits, 0), 0), 100);
  if lower(coalesce(new.plan, 'free')) <> 'free' then
    new.plan := 'free';
  end if;
  new.is_unlimited            := false;
  new.plan_expires_at         := null;
  new.plan_purchased_at       := null;
  new.referral_code           := null;   -- profiles_set_refcode generates it
  new.referral_credits_earned := 0;
  return new;
end;
$function$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'profiles_guard_client_insert') then
    create trigger profiles_guard_client_insert
      before insert on public.profiles
      for each row execute function public.profiles_guard_client_insert();
  end if;
end $$;


-- ── 4. feedback: one row per user + generation ────────────────
create unique index if not exists feedback_user_generation_uniq
  on public.feedback (user_id, generation_id)
  where generation_id is not null;


-- ── 5. storage: no public overwrite / delete ──────────────────
-- Before: anyone (even logged out) could INSERT into any bucket, and
-- UPDATE or DELETE any file in `designs` — i.e. overwrite or delete
-- other customers' designs and outputs.
--
-- After:
--   • `designs`         anyone may ADD a file (the agent pages upload
--                       before sign-up); only the owner may replace
--                       their own file; nobody may remove files from the
--                       browser.
--   • `cc-demo-videos`  careers applicants may add their demo video.
--   • `uploads`         unused bucket — service role only.
--   • `generation-uploads` owner may replace their own file.
-- Uploads done by the server / n8n use the service role and are not
-- affected. Policies are altered in place, not dropped. They keep their
-- old auto-generated names because only the storage owner role may
-- rename them:
--   "Allow uploads"                → add files to cc-demo-videos only
--   "Public access pr0nlh_1"       → add files to designs
--   "Public access pr0nlh_2"       → owner may replace own designs file
--   "Public access pr0nlh_3"       → service role only
--   "Allow all 1va6avm_1/2/3"      → service role only (unused bucket)
--   "Public update generation images" → owner may replace own file
do $$
declare
  has boolean;
begin
  -- "Allow uploads": INSERT into ANY bucket for anyone → applicants' videos only.
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Allow uploads') into has;
  if has then
    alter policy "Allow uploads" on storage.objects to anon, authenticated
      with check (bucket_id = 'cc-demo-videos');
  end if;

  -- designs INSERT: unchanged behaviour, clearer name.
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Public access pr0nlh_1') into has;
  if has then
    alter policy "Public access pr0nlh_1" on storage.objects to anon, authenticated
      with check (bucket_id = 'designs');
  end if;

  -- designs UPDATE: anyone → only the file's owner.
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Public access pr0nlh_2') into has;
  if has then
    alter policy "Public access pr0nlh_2" on storage.objects to authenticated
      using (bucket_id = 'designs' and owner = auth.uid())
      with check (bucket_id = 'designs' and owner = auth.uid());
  end if;

  -- designs DELETE: anyone → service role only.
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Public access pr0nlh_3') into has;
  if has then
    alter policy "Public access pr0nlh_3" on storage.objects to service_role;
  end if;

  -- Unused `uploads` bucket: everything → service role only.
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Allow all 1va6avm_1') into has;
  if has then
    alter policy "Allow all 1va6avm_1" on storage.objects to service_role;
  end if;
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Allow all 1va6avm_2') into has;
  if has then
    alter policy "Allow all 1va6avm_2" on storage.objects to service_role;
  end if;
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Allow all 1va6avm_3') into has;
  if has then
    alter policy "Allow all 1va6avm_3" on storage.objects to service_role;
  end if;
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Give anon users access to JPG images in folder 1va6avm_1') into has;
  if has then
    alter policy "Give anon users access to JPG images in folder 1va6avm_1" on storage.objects to service_role;
  end if;

  -- generation-uploads UPDATE: any signed-in user → only the file's owner.
  select exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Public update generation images') into has;
  if has then
    alter policy "Public update generation images" on storage.objects to authenticated
      using (bucket_id = 'generation-uploads' and owner = auth.uid())
      with check (bucket_id = 'generation-uploads' and owner = auth.uid());
  end if;
end $$;
