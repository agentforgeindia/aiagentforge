-- ============================================================
-- AgentForge posts — add thumbnail jsonb column
-- Run this in Supabase SQL Editor.
-- ============================================================
-- WHY
-- ---
-- Static posts in app/blog/posts.ts have a `thumbnail` config
-- (gradient + headline + badge) that renders as a designed card
-- on the list and detail pages. DB-backed posts could only use
-- hero_image_url (a real photo). This migration adds the same
-- thumbnail support to DB posts.
--
-- After this migration:
--   • If posts.thumbnail is set → renders as the gradient card.
--   • Else if posts.hero_image_url is set → renders the photo.
--   • Else → falls back to hero_emoji.
-- ============================================================

alter table public.posts
  add column if not exists thumbnail jsonb;

-- Expected JSON shape (matches BlogThumbnailConfig in app/blog/posts.ts):
-- {
--   "headline":     "Why We Built",
--   "subline":      "AgentForge AI",
--   "badge":        "Origin Story",
--   "gradientFrom": "#1e3a5f",
--   "gradientTo":   "#0ea5e9",
--   "icon":         "✍️",
--   "statsRow":     ["The Vision", "The Problem", "The Mission"]
-- }

-- ============================================================
-- Backfill the 3 announcement posts that currently show a
-- photo banner. They get the same gradient-card treatment as
-- the static announcement posts (founder's letter, vision, etc).
-- ============================================================

-- 1. "Why We Built AgentForge AI: From Agency Struggles ..."
update public.posts
   set thumbnail = jsonb_build_object(
     'headline',     'Why We Built',
     'subline',      'AgentForge AI',
     'badge',        'Origin Story',
     'gradientFrom', '#1e3a5f',
     'gradientTo',   '#0ea5e9',
     'icon',         '✍️',
     'statsRow',     jsonb_build_array('The Vision', 'The Problem', 'The Mission')
   )
 where slug = 'why-we-built-agentforge-ai';

-- 2. "AgentForge AI Launches Productography AI ..."
--    Adjust the slug below if it's different in your DB.
update public.posts
   set thumbnail = jsonb_build_object(
     'headline',     'Productography AI',
     'subline',      'Now Live',
     'badge',        'New Launch',
     'gradientFrom', '#7c3aed',
     'gradientTo',   '#db2777',
     'icon',         '📸',
     'statsRow',     jsonb_build_array('AI Powered', '60 Seconds', 'Pro Quality')
   )
 where title ilike 'AgentForge AI Launches Productography%';

-- 3. "AgentForge AI Platform Update: Faster, Smarter & Better"
update public.posts
   set thumbnail = jsonb_build_object(
     'headline',     'Faster.',
     'subline',      'Smarter. Better.',
     'badge',        'Platform Update',
     'gradientFrom', '#6d28d9',
     'gradientTo',   '#db2777',
     'icon',         '⚡',
     'statsRow',     jsonb_build_array('2x Speed', 'Better AI', 'More Reliable')
   )
 where title ilike 'AgentForge AI Platform Update%';

-- ============================================================
-- Verification
-- ============================================================
-- select slug, title, thumbnail is not null as has_thumb
-- from public.posts
-- where thumbnail is not null;
-- ============================================================
