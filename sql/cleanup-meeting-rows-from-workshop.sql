-- ============================================================
-- One-time cleanup — remove MEETING bookings that leaked into
-- workshop_registrations.
-- Run once in the Supabase SQL Editor (production).
-- ============================================================
-- WHY
-- ---
-- Before the webhook fix, every non-credit-plan Razorpay payment was
-- recorded into workshop_registrations — including the ₹99 meeting
-- bookings from /book-meeting. Those meetings are already stored in the
-- `meetings` table (shown at /admin/meetings), so the workshop rows are
-- duplicates that appear as "Unassigned — Payment Page (set slot manually)".
--
-- This deletes only the workshop_registrations rows whose payment id
-- matches a real meeting booking. Genuine workshop QR / Payment Page
-- registrations are untouched.
-- ============================================================

-- 1. PREVIEW — review what will be removed before deleting.
select wr.id, wr.email, wr.phone, wr.amount, wr.slot_id,
       wr.razorpay_payment_id, wr.created_at
from public.workshop_registrations wr
where wr.razorpay_payment_id in (
  select m.razorpay_payment_id
  from public.meetings m
  where m.razorpay_payment_id is not null
)
order by wr.created_at desc;

-- 2. DELETE — run after confirming the preview above.
-- delete from public.workshop_registrations wr
-- where wr.razorpay_payment_id in (
--   select m.razorpay_payment_id
--   from public.meetings m
--   where m.razorpay_payment_id is not null
-- );
