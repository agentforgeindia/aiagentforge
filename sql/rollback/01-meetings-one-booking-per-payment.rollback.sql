-- Rollback for sql/pending/01-meetings-one-booking-per-payment.sql
-- (Run in the Supabase SQL editor — it asks for confirmation because
--  it removes two indexes. No data is touched.)
drop index if exists public.meetings_razorpay_payment_id_uniq;
drop index if exists public.meetings_razorpay_order_id_uniq;
