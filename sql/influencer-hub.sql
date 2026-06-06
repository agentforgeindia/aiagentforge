-- Influencer Hub additions
-- Run this in Supabase SQL Editor

-- Add profile columns to content_creator_social
ALTER TABLE public.content_creator_social
  ADD COLUMN IF NOT EXISTS bio               text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS twitter_url       text,
  ADD COLUMN IF NOT EXISTS tiktok_url        text,
  ADD COLUMN IF NOT EXISTS website_url       text;

-- Influencer hub comments (public)
CREATE TABLE IF NOT EXISTS public.influencer_hub_comments (
  id                    uuid primary key default gen_random_uuid(),
  influencer_candidate_id uuid references public.candidates(id) on delete cascade,
  commenter_name        text not null,
  comment_text          text not null check (char_length(comment_text) <= 500),
  created_at            timestamptz not null default now()
);

-- Public view for influencer hub
CREATE OR REPLACE VIEW public.v_influencer_hub AS
SELECT
  c.id                AS candidate_id,
  c.name,
  cs.niche,
  cs.bio,
  cs.profile_photo_url,
  cs.instagram_url,
  cs.youtube_url,
  cs.twitter_url,
  cs.tiktok_url,
  cs.website_url,
  cs.followers_count,
  cs.referral_code,
  c.created_at
FROM public.candidates c
JOIN public.content_creator_social cs ON cs.candidate_id = c.id
WHERE cs.referral_status = 'active'
  AND c.stage NOT IN ('withdrawn', 'rejected');

-- Enable RLS on comments
ALTER TABLE public.influencer_hub_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments
CREATE POLICY "comments_read_all" ON public.influencer_hub_comments
  FOR SELECT USING (true);

-- Allow anyone to insert (with rate limiting via app logic)
CREATE POLICY "comments_insert_all" ON public.influencer_hub_comments
  FOR INSERT WITH CHECK (true);
