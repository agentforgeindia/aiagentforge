-- ============================================================
-- 01 — One meeting per payment          (NOT applied yet)
-- ============================================================
-- /api/meetings/book now refuses to book twice with the same
-- Razorpay payment, but two requests arriving in the same instant
-- could both pass that check. These unique indexes make the
-- database the final judge: the second insert fails and the route
-- returns the first booking.
--
-- Checked on 2026-10-07: no duplicate payment / order ids exist in
-- public.meetings (9 rows, 1 paid), so the indexes can be created
-- as they are.
--
-- Deploy order: after the new code is live (the code works with or
-- without the indexes).
-- Rollback: sql/rollback/01-meetings-one-booking-per-payment.rollback.sql
-- ============================================================

create unique index if not exists meetings_razorpay_payment_id_uniq
  on public.meetings (razorpay_payment_id)
  where razorpay_payment_id is not null;

create unique index if not exists meetings_razorpay_order_id_uniq
  on public.meetings (razorpay_order_id)
  where razorpay_order_id is not null;
