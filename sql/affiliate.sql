-- ============================================================
-- AgentForge — Affiliate / Partner System
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ── Affiliates ───────────────────────────────────────────────
create table if not exists public.affiliates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null unique,
  phone          text,
  ref_code       text not null unique,           -- shareable code
  commission_pct numeric(5,2) not null default 10,
  status         text not null default 'active' check (status in ('active','paused','banned')),
  total_earned   numeric(12,2) not null default 0,
  total_paid     numeric(12,2) not null default 0,
  notes          text,
  created_at     timestamptz not null default now()
);

-- ── Referrals (who they brought) ─────────────────────────────
create table if not exists public.affiliate_referrals (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null references public.affiliates(id) on delete cascade,
  referred_email text,
  referred_name  text,
  plan          text,
  amount_inr    numeric(12,2) not null default 0,
  commission_inr numeric(12,2) not null default 0,
  status        text not null default 'pending' check (status in ('pending','confirmed','paid','rejected')),
  created_at    timestamptz not null default now()
);

create index if not exists aff_ref_aff_idx on public.affiliate_referrals (affiliate_id, created_at desc);

-- ── Payouts ──────────────────────────────────────────────────
create table if not exists public.affiliate_payouts (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null references public.affiliates(id) on delete cascade,
  amount_inr    numeric(12,2) not null,
  method        text,                              -- 'upi','bank','cash'
  reference     text,
  paid_on       date not null default current_date,
  created_at    timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.affiliates           enable row level security;
alter table public.affiliate_referrals  enable row level security;
alter table public.affiliate_payouts    enable row level security;

drop policy if exists "aff read"  on public.affiliates;
drop policy if exists "aff write" on public.affiliates;
drop policy if exists "affref read"  on public.affiliate_referrals;
drop policy if exists "affref write" on public.affiliate_referrals;
drop policy if exists "affpay read"  on public.affiliate_payouts;
drop policy if exists "affpay write" on public.affiliate_payouts;

create policy "aff read"     on public.affiliates          for select to authenticated using (public.has_permission('affiliates.view') or public.has_permission('*'));
create policy "aff write"    on public.affiliates          for all    to authenticated using (public.has_permission('affiliates.manage') or public.has_permission('*')) with check (public.has_permission('affiliates.manage') or public.has_permission('*'));
create policy "affref read"  on public.affiliate_referrals for select to authenticated using (public.has_permission('affiliates.view') or public.has_permission('*'));
create policy "affref write" on public.affiliate_referrals for all    to authenticated using (public.has_permission('affiliates.manage') or public.has_permission('*')) with check (public.has_permission('affiliates.manage') or public.has_permission('*'));
create policy "affpay read"  on public.affiliate_payouts   for select to authenticated using (public.has_permission('affiliates.view') or public.has_permission('*'));
create policy "affpay write" on public.affiliate_payouts   for all    to authenticated using (public.has_permission('affiliates.manage') or public.has_permission('*')) with check (public.has_permission('affiliates.manage') or public.has_permission('*'));

-- ── Permissions ──────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['affiliates.view','affiliates.manage'])), updated_at = now()
 where id = 'founder';
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY['affiliates.view'])), updated_at = now()
 where id in ('admin','accounts');

-- ── affiliate_overview() ─────────────────────────────────────
create or replace function public.affiliate_overview()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (public.has_permission('affiliates.view') or public.has_permission('*')) then
    raise exception 'affiliate_overview: permission denied';
  end if;

  return jsonb_build_object(
    'totals', jsonb_build_object(
      'affiliates',    (select count(*) from public.affiliates),
      'active',        (select count(*) from public.affiliates where status='active'),
      'referrals',     (select count(*) from public.affiliate_referrals),
      'pending_payout',(select coalesce(sum(commission_inr),0) from public.affiliate_referrals where status='confirmed'),
      'total_earned',  (select coalesce(sum(commission_inr),0) from public.affiliate_referrals where status in ('confirmed','paid')),
      'total_paid',    (select coalesce(sum(amount_inr),0) from public.affiliate_payouts)
    ),
    'affiliates', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', a.name, 'email', a.email, 'ref_code', a.ref_code,
        'commission_pct', a.commission_pct, 'status', a.status,
        'referrals', (select count(*) from public.affiliate_referrals r where r.affiliate_id=a.id),
        'earned', (select coalesce(sum(commission_inr),0) from public.affiliate_referrals r where r.affiliate_id=a.id and r.status in ('confirmed','paid')),
        'paid',   (select coalesce(sum(amount_inr),0) from public.affiliate_payouts p where p.affiliate_id=a.id)
      ) order by a.created_at desc), '[]')
      from public.affiliates a
    )
  );
end;
$$;

revoke all on function public.affiliate_overview() from public;
grant execute on function public.affiliate_overview() to authenticated, service_role;
