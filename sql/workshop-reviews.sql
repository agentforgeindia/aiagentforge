-- ============================================================
-- AgentForge — Workshop reviews / testimonials
-- Run in the Supabase SQL Editor.
-- ============================================================
-- Past attendees submit a review (rating + checkbox feedback +
-- suggestions + name/email + optional logo/photo + consent). It
-- lands as 'pending'; an admin approves it; approved reviews show
-- on the public /workshop page.
--
-- Logo/photo uploads reuse the existing public 'testimonial-screenshots'
-- bucket (policies already allow anon upload + public read).
-- ============================================================

create table if not exists public.workshop_reviews (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  rating          int  not null check (rating between 1 and 5),
  feedback_points text[] not null default '{}',     -- checkbox selections
  suggestions     text,
  logo_url        text,
  photo_url       text,
  consent         boolean not null default false,   -- may use logo/photo publicly
  status          text not null default 'pending',  -- pending | approved | rejected
  created_at      timestamptz not null default now(),
  approved_at     timestamptz
);

create index if not exists workshop_reviews_status_idx
  on public.workshop_reviews (status, created_at desc);

alter table public.workshop_reviews enable row level security;

-- Anyone (logged-in or anon) may submit a PENDING review.
drop policy if exists "wreviews public submit" on public.workshop_reviews;
create policy "wreviews public submit"
  on public.workshop_reviews for insert
  to authenticated, anon
  with check (status = 'pending');

-- Approved reviews are publicly readable (for the workshop page).
drop policy if exists "wreviews public read approved" on public.workshop_reviews;
create policy "wreviews public read approved"
  on public.workshop_reviews for select
  to authenticated, anon
  using (status = 'approved');

-- Admins read ALL (pending included) + update/delete.
drop policy if exists "wreviews admin read" on public.workshop_reviews;
create policy "wreviews admin read"
  on public.workshop_reviews for select
  to authenticated
  using (public.is_admin());

drop policy if exists "wreviews admin manage" on public.workshop_reviews;
create policy "wreviews admin manage"
  on public.workshop_reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Verify:
-- SELECT name, rating, status, created_at FROM public.workshop_reviews
--   ORDER BY created_at DESC;
-- ============================================================
