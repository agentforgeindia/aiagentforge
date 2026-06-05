-- ============================================================
-- AgentForge — Testimonials submit fix (RLS insert policy)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Ensures in-app / website users CAN submit a review (status must
-- be 'pending' so they can't self-approve). Admins read + manage.
-- ============================================================

alter table public.testimonials enable row level security;

-- Anyone (logged-in or anon) may submit a PENDING review.
drop policy if exists "testimonials public submit" on public.testimonials;
create policy "testimonials public submit"
  on public.testimonials for insert
  to authenticated, anon
  with check (status = 'pending');

-- Approved testimonials are publicly readable (for the slider).
drop policy if exists "testimonials public read approved" on public.testimonials;
create policy "testimonials public read approved"
  on public.testimonials for select
  to authenticated, anon
  using (status = 'approved');

-- Admins can read ALL (pending included) + update/delete.
drop policy if exists "testimonials admin read" on public.testimonials;
create policy "testimonials admin read"
  on public.testimonials for select
  to authenticated
  using (public.is_admin());

drop policy if exists "testimonials admin manage" on public.testimonials;
create policy "testimonials admin manage"
  on public.testimonials for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Storage: allow uploads to testimonial-screenshots bucket ──
-- (Run only if the bucket exists. Makes it public-readable + lets
--  users upload their screenshots.)
-- Note: bucket itself must be created in Storage UI as 'public'.
do $$
begin
  -- Public read of screenshots
  if not exists (select 1 from pg_policies where policyname = 'tscreens public read') then
    create policy "tscreens public read" on storage.objects for select
      to public using (bucket_id = 'testimonial-screenshots');
  end if;
  -- Anyone can upload a screenshot
  if not exists (select 1 from pg_policies where policyname = 'tscreens upload') then
    create policy "tscreens upload" on storage.objects for insert
      to authenticated, anon with check (bucket_id = 'testimonial-screenshots');
  end if;
exception when others then
  -- storage.objects may differ; ignore if not permitted.
  null;
end $$;
