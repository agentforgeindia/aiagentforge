-- ============================================================
-- Workshop — capture Razorpay PAYMENT PAGE registrations
-- Run this once in the Supabase SQL Editor (production).
-- ============================================================
-- WHY
-- ---
-- Payments made through a hosted Razorpay Payment Page (a "pl_..."
-- link, e.g. "AgentForge Workshop Registration Day 02") bypass the
-- in-app checkout, so their order carries no { type:'workshop', slot }
-- notes. The upgraded /api/razorpay/webhook now still records these,
-- deriving the slot from the page title ("Day 0N"). When the slot
-- cannot be determined it falls back to this 'unassigned' row, so the
-- paying customer is NEVER dropped and always appears in the admin
-- (where the slot can be corrected manually).
--
-- is_open = false  -> never offered in the public booking flow.
-- huge max_seats    -> 'unassigned' never blocks or shows as "full".
-- ============================================================

insert into public.workshop_slots (slot_id, label, max_seats, is_open)
values (
  'unassigned',
  'Unassigned — Payment Page (set slot manually)',
  1000000,
  false
)
on conflict (slot_id) do update
  set label     = excluded.label,
      is_open   = excluded.is_open,
      max_seats = excluded.max_seats;

-- Verify:
-- SELECT slot_id, label, seats_filled, max_seats, is_open
--   FROM public.workshop_slots ORDER BY slot_id;
