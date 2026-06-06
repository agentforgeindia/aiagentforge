-- ============================================================
-- AgentForge unified Posts schema  (Blog + News + Updates)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- One row = one publishable post.
--   type      → editorial bucket (blog | news | update | case-study)
--   category  → topical bucket  (textile | jewellery | productography | guide | announcement)
--   body      → ordered array of sections (h2/h3/p/ul/quote/image)
--   status    → draft | published   (only published is publicly readable)
-- ============================================================

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),

  -- URL + identity
  slug            text not null unique,
  type            text not null default 'blog'
                  check (type in ('blog', 'news', 'update', 'case-study')),
  category        text not null default 'guide'
                  check (category in ('textile','jewellery','productography','guide','announcement')),

  -- Header
  title           text not null,
  description     text,             -- SEO meta description
  excerpt         text,             -- card preview
  author          text not null default 'AgentForge Team',
  hero_image_url  text,             -- Supabase Storage public URL
  hero_emoji      text default '📝',
  read_minutes    int not null default 5,

  -- Optional CTA shown at end of post
  cta_label       text,
  cta_href        text,

  -- SEO
  keywords        text[] not null default '{}',

  -- Body content — JSON array of sections.
  -- Each section: {type:'h2'|'h3'|'p'|'ul'|'quote'|'image', text?, items?, src?, alt?}
  body            jsonb not null default '[]'::jsonb,

  -- Lifecycle
  status          text not null default 'draft'
                  check (status in ('draft','published')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Audit
  created_by      uuid references auth.users(id) on delete set null
);

-- ============================================================
-- Indexes — public listing queries are the hot path.
-- ============================================================
create index if not exists posts_published_idx
  on public.posts (published_at desc nulls last)
  where status = 'published';

create index if not exists posts_type_published_idx
  on public.posts (type, published_at desc nulls last)
  where status = 'published';

create index if not exists posts_category_published_idx
  on public.posts (category, published_at desc nulls last)
  where status = 'published';

-- ============================================================
-- updated_at auto-touch
-- ============================================================
create or replace function public.posts_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.posts_touch_updated_at();

-- ============================================================
-- Admin allowlist — single source of truth for admin gating.
-- Mirrors the ADMIN_EMAILS array in app/admin/* pages.
-- Add new admins by inserting an email row here.
-- ============================================================
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Seed initial admins (matches ADMIN_EMAILS in app/admin/testimonials/page.tsx)
insert into public.admin_users (email) values
  ('info@aiagentforge.in'),
  ('info.agentforge@gmail.com')
on conflict (email) do nothing;

-- Helper: is the calling user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.posts enable row level security;

-- Anyone (anon + authenticated) can read published posts.
drop policy if exists "posts public read published" on public.posts;
create policy "posts public read published"
  on public.posts
  for select
  to anon, authenticated
  using (status = 'published');

-- Admins can read every post (including drafts).
drop policy if exists "posts admin read all" on public.posts;
create policy "posts admin read all"
  on public.posts
  for select
  to authenticated
  using (public.is_admin());

-- Admins can insert / update / delete.
drop policy if exists "posts admin write" on public.posts;
create policy "posts admin write"
  on public.posts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- admin_users locked down — only admins read, only DB superusers write.
alter table public.admin_users enable row level security;
drop policy if exists "admin_users admin read" on public.admin_users;
create policy "admin_users admin read"
  on public.admin_users
  for select
  to authenticated
  using (public.is_admin());

-- ============================================================
-- STORAGE bucket for hero + in-body images
-- ============================================================
-- Run this manually in Supabase Studio → Storage → New bucket
-- (SQL block kept here for reference; storage.buckets writes
-- require the storage extension permissions).
--
-- Bucket id   : post-images
-- Public      : true
-- File size limit : 5 MB
-- Allowed MIME: image/jpeg, image/png, image/webp, image/avif
--
-- Storage policies:
--   • SELECT: anyone (public bucket already covers this)
--   • INSERT/UPDATE/DELETE: only admins (uses public.is_admin())
--
-- The SQL below assumes the bucket already exists.
-- ============================================================

-- Public read on post-images bucket (idempotent)
do $$
begin
  if exists (select 1 from storage.buckets where id = 'post-images') then
    -- Public read
    if not exists (
      select 1 from pg_policies
      where schemaname='storage' and tablename='objects'
        and policyname='post-images public read'
    ) then
      create policy "post-images public read"
        on storage.objects for select
        to anon, authenticated
        using (bucket_id = 'post-images');
    end if;

    -- Admin write
    if not exists (
      select 1 from pg_policies
      where schemaname='storage' and tablename='objects'
        and policyname='post-images admin write'
    ) then
      create policy "post-images admin write"
        on storage.objects for all
        to authenticated
        using (bucket_id = 'post-images' and public.is_admin())
        with check (bucket_id = 'post-images' and public.is_admin());
    end if;
  end if;
end$$;

-- ============================================================
-- Done. Verification queries:
--   select * from public.posts limit 5;
--   select public.is_admin();
-- ============================================================
