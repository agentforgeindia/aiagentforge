-- ============================================================
-- 08 — Customer reviews are shown only with consent
--                                               (NOT applied yet)
-- ============================================================
-- Product rule of 2026-10-08: a customer's review is shown on the
-- website only when (a) the customer agreed to that and (b) the team
-- approved it.
--
-- What was wrong:
--   • Text typed in the "rate your image" popup was copied into
--     `testimonials` and published straight away for 4-5 stars —
--     with the customer's name and profile photo — without asking.
--   • The rules let a visitor insert a row that is already
--     "approved" (the old rules were "status = pending" OR "user_id
--     is null"; either one was enough).
--
-- What this does:
--   1. Adds consent / consent_at / consent_source to `testimonials`.
--   2. Existing rows: reviews sent through the "Share your story"
--      form (source 'in-app' — the form says the review will go
--      live) are marked as consented ('legacy_form'). Rows copied
--      from the rating popup keep consent = false: they stay in the
--      table and in Admin → Testimonials, but are no longer public
--      until someone confirms the customer agreed.
--      Checked on 2026-10-08: 17 approved rows — 4 from the form,
--      13 copied from the rating popup.
--   3. The public may read a review only when it is approved AND
--      consented. A browser may only add a PENDING review, for
--      itself or anonymously.
--
-- Deploy order: after 06 and 07 (it changes the rules 06 created, and
-- names is_admin() where 07 put it: schema "private").
-- The new code works before this runs: the review slider is simply
-- empty until the columns exist.
-- Rollback: sql/rollback/08-testimonial-consent.rollback.sql
-- ============================================================

begin;

alter table public.testimonials
  add column if not exists consent boolean not null default false,
  add column if not exists consent_at timestamptz,
  add column if not exists consent_source text;

comment on column public.testimonials.consent is
  'The customer agreed that this review may be shown on the website.';
comment on column public.testimonials.consent_source is
  'review_form | rating_form | admin_confirmed | legacy_form';

update public.testimonials
   set consent = true,
       consent_at = created_at,
       consent_source = 'legacy_form'
 where source = 'in-app'
   and consent = false;

alter policy "testimonials: select (visitors)" on public."testimonials"
  using ((status = 'approved'::text) AND consent);

alter policy "testimonials: select (signed-in)" on public."testimonials"
  using (((status = 'approved'::text) AND consent) OR (private.is_admin()));

alter policy "testimonials: insert (visitors)" on public."testimonials"
  with check ((status = 'pending'::text) AND (user_id IS NULL));

alter policy "testimonials: insert (signed-in)" on public."testimonials"
  with check (
    ((status = 'pending'::text) AND ((user_id IS NULL) OR (( SELECT auth.uid()) = user_id)))
    OR (private.is_admin())
  );

commit;
