-- Rollback for sql/pending/08-testimonial-consent.sql
-- Puts the four review rules back as migration 06 left them and
-- removes the consent columns. Roll back BEFORE 07 and 06.
-- Run in the Supabase SQL editor (one transaction; it asks for
-- confirmation because columns are removed).

begin;

alter policy "testimonials: select (visitors)" on public."testimonials"
  using ((status = 'approved'::text));

alter policy "testimonials: select (signed-in)" on public."testimonials"
  using (((status = 'approved'::text)) OR (private.is_admin()));

alter policy "testimonials: insert (visitors)" on public."testimonials"
  with check ((((( SELECT auth.uid()) = user_id) OR (user_id IS NULL))) OR ((status = 'pending'::text)));

alter policy "testimonials: insert (signed-in)" on public."testimonials"
  with check ((((( SELECT auth.uid()) = user_id) OR (user_id IS NULL))) OR (private.is_admin()) OR ((status = 'pending'::text)));

alter table public.testimonials
  drop column if exists consent_source,
  drop column if exists consent_at,
  drop column if exists consent;

commit;
