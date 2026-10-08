-- ============================================================
-- ROLLBACK for sql/2026-10-07-p0-security.sql
-- (the changes that are ALREADY LIVE since 2026-10-07 ~11:10 UTC,
--  Supabase migrations p0_security_credits_profiles_generations and
--  p0_security_storage_policies)
-- ============================================================
-- Run a section only if that specific change has to be undone, and
-- undo as little as possible. Sections are independent of each other.
--
-- Run in the Supabase SQL editor (it asks for confirmation on the
-- statements that remove something). No customer data is changed by
-- any section.
-- ============================================================


-- ── 1. deduct_credits(): back to "no ledger row, no amount check" ──
-- Same JSON answer as before and after, so n8n is not affected either
-- way. Only undo this if the ledger insert itself is causing errors.
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

  update public.profiles
  set credits = credits - p_amount
  where id = p_user_id
  returning credits into new_credits;

  return jsonb_build_object('success', true, 'remaining_credits', new_credits);
end;
$function$;
-- NOTE: with the ledger insert gone, /api/credits/refund and the
-- sweeper can no longer see what n8n charged (Productography personal
-- generations) and will refund nothing for those.


-- ── 2. generations: let browsers insert rows again ────────────────
alter policy "generations insert: server only (was: users can insert own)" on public.generations
  rename to "Users can insert own generations";
alter policy "Users can insert own generations" on public.generations
  to public
  with check (auth.uid() = user_id);

alter policy "generations insert: server only (was: users insert own)" on public.generations
  rename to "Users insert own generations";
alter policy "Users insert own generations" on public.generations
  to authenticated
  with check (auth.uid() = user_id);


-- ── 3. profiles: old tamper trigger (credits + plan only) ─────────
create or replace function public.profiles_block_credit_tampering()
returns trigger
language plpgsql
set search_path = public
as $function$
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
$function$;

-- The INSERT guard did not exist before — switch it off (kept, not removed).
alter table public.profiles disable trigger profiles_guard_client_insert;
--   to switch it back on:  alter table public.profiles enable trigger profiles_guard_client_insert;


-- ── 4. feedback: allow several rows per user + generation again ───
drop index if exists public.feedback_user_generation_uniq;


-- ── 5. storage: the rules as they were before 2026-10-07 ──────────
alter policy "Allow uploads" on storage.objects
  to public
  with check (true);

alter policy "Public access pr0nlh_1" on storage.objects
  to public
  with check (bucket_id = 'designs');

alter policy "Public access pr0nlh_2" on storage.objects
  to public
  using (bucket_id = 'designs')
  with check (bucket_id = 'designs');

alter policy "Public access pr0nlh_3" on storage.objects
  to public;

alter policy "Allow all 1va6avm_1" on storage.objects to public;
alter policy "Allow all 1va6avm_2" on storage.objects to public;
alter policy "Allow all 1va6avm_3" on storage.objects to public;
alter policy "Give anon users access to JPG images in folder 1va6avm_1" on storage.objects to public;

alter policy "Public update generation images" on storage.objects
  to authenticated
  using (bucket_id = 'generation-uploads')
  with check (bucket_id = 'generation-uploads');
