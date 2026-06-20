-- ============================================================
-- AgentForge Workshop — slot seat tracking + atomic registration
-- Run this in Supabase SQL Editor (production).
-- ============================================================
-- WHAT THIS DOES
-- --------------
-- Tracks paid registrations per workshop date and caps each slot
-- at max_seats (default 100). One atomic, idempotent RPC
-- (register_workshop_seat) inserts the registration and bumps
-- the per-slot counter in a single transaction, so the same
-- Razorpay order replayed (verify route + webhook both fire) is
-- a safe no-op and never double-counts.
--
-- Seat cap is "soft": the create-order API refuses new orders
-- once a slot is full, so payments stop at ~100. A rare race
-- (many orders created just under the cap, all paid) can push a
-- slot a seat or two over — visible in the admin and easy to
-- refund manually.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Slots table — one row per workshop date
-- ────────────────────────────────────────────────────────────
create table if not exists public.workshop_slots (
  slot_id      text primary key,
  label        text not null,
  max_seats    int  not null default 100,
  seats_filled int  not null default 0,
  is_open      boolean not null default true,
  updated_at   timestamptz not null default now()
);

-- Seed / keep the four June 2026 dates in sync.
insert into public.workshop_slots (slot_id, label, max_seats) values
  ('20-june', '20 June 2026 (Saturday, 7:00 PM)', 100),
  ('21-june', '21 June 2026 (Sunday, 3:00 PM)',   100),
  ('27-june', '27 June 2026 (Saturday, 7:00 PM)', 100),
  ('28-june', '28 June 2026 (Sunday, 3:00 PM)',   100),
  ('4-july',  '4 July 2026 (Saturday, 7:00 PM)',  100)
on conflict (slot_id) do update
  set label = excluded.label;

-- ────────────────────────────────────────────────────────────
-- 2. Registrations table — one row per paid seat
-- ────────────────────────────────────────────────────────────
create table if not exists public.workshop_registrations (
  id                   uuid primary key default gen_random_uuid(),
  slot_id              text not null references public.workshop_slots(slot_id),
  name                 text,
  email                text,
  phone                text,
  amount               numeric,
  status               text not null default 'paid',
  razorpay_order_id    text not null unique,   -- drives idempotency
  razorpay_payment_id  text,
  created_at           timestamptz not null default now()
);

create index if not exists workshop_registrations_slot_idx
  on public.workshop_registrations (slot_id);

-- RLS on; only the server (service_role) touches these tables.
alter table public.workshop_slots          enable row level security;
alter table public.workshop_registrations  enable row level security;

-- ────────────────────────────────────────────────────────────
-- 3. Atomic, idempotent seat registration
-- ────────────────────────────────────────────────────────────
-- Behavior:
--   • Locks the slot row (FOR UPDATE) so concurrent payers can't
--     both read the same count.
--   • Inserts a registration (ON CONFLICT on razorpay_order_id
--     DO NOTHING). If the insert hit a conflict (same order
--     replayed) → returns already=true, makes no change.
--   • If a new row was written → increments seats_filled.
-- Returns jsonb: { registered, already, seats_filled, max_seats, full }
-- ────────────────────────────────────────────────────────────
create or replace function public.register_workshop_seat(
  p_slot_id     text,
  p_order_id    text,
  p_payment_id  text,
  p_amount      numeric,
  p_name        text,
  p_email       text,
  p_phone       text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_id uuid;
  v_filled      int;
  v_max         int;
begin
  if p_slot_id is null then
    raise exception 'register_workshop_seat: slot_id is required';
  end if;
  if p_order_id is null or length(p_order_id) = 0 then
    raise exception 'register_workshop_seat: order_id is required';
  end if;

  -- Lock the slot row for the duration of this transaction.
  select max_seats, seats_filled
    into v_max, v_filled
    from public.workshop_slots
   where slot_id = p_slot_id
   for update;

  if not found then
    raise exception 'register_workshop_seat: unknown slot %', p_slot_id;
  end if;

  -- Idempotent insert keyed on the Razorpay order id.
  insert into public.workshop_registrations (
    slot_id, name, email, phone, amount, status,
    razorpay_order_id, razorpay_payment_id
  ) values (
    p_slot_id, p_name, p_email, p_phone, p_amount, 'paid',
    p_order_id, p_payment_id
  )
  on conflict (razorpay_order_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    -- Same order already recorded (verify + webhook race). No-op.
    return jsonb_build_object(
      'registered',   true,
      'already',      true,
      'seats_filled', v_filled,
      'max_seats',    v_max,
      'full',         v_filled >= v_max
    );
  end if;

  update public.workshop_slots
     set seats_filled = seats_filled + 1,
         updated_at   = now()
   where slot_id = p_slot_id
   returning seats_filled into v_filled;

  return jsonb_build_object(
    'registered',   true,
    'already',      false,
    'seats_filled', v_filled,
    'max_seats',    v_max,
    'full',         v_filled >= v_max
  );
end;
$$;

revoke all on function public.register_workshop_seat(
  text, text, text, numeric, text, text, text
) from public;

grant execute on function public.register_workshop_seat(
  text, text, text, numeric, text, text, text
) to service_role;

-- ────────────────────────────────────────────────────────────
-- 4. Verification queries (run manually)
-- ────────────────────────────────────────────────────────────
-- SELECT slot_id, seats_filled, max_seats, is_open FROM public.workshop_slots ORDER BY slot_id;
-- SELECT slot_id, count(*) FROM public.workshop_registrations GROUP BY slot_id;
-- ============================================================
