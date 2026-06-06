-- Influencer Hub: Social Feed Tables
-- Run in Supabase SQL Editor

-- Video reactions (like/love/fire/wow per user per video)
CREATE TABLE IF NOT EXISTS public.influencer_video_reactions (
  id              uuid primary key default gen_random_uuid(),
  video_id        uuid references public.influencer_video_submissions(id) on delete cascade,
  user_key        text not null,  -- localStorage fingerprint (anonymous)
  reaction_type   text not null check (reaction_type in ('like','love','fire','wow')),
  created_at      timestamptz not null default now(),
  unique(video_id, user_key)      -- one reaction per user per video
);

-- Video comments (separate from influencer-profile comments)
CREATE TABLE IF NOT EXISTS public.influencer_video_comments (
  id              uuid primary key default gen_random_uuid(),
  video_id        uuid references public.influencer_video_submissions(id) on delete cascade,
  commenter_name  text not null,
  comment_text    text not null check (char_length(comment_text) <= 500),
  created_at      timestamptz not null default now()
);

-- RLS
ALTER TABLE public.influencer_video_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_video_comments  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_read"   ON public.influencer_video_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON public.influencer_video_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "reactions_delete" ON public.influencer_video_reactions FOR DELETE USING (true);

CREATE POLICY "vcomments_read"   ON public.influencer_video_comments FOR SELECT USING (true);
CREATE POLICY "vcomments_insert" ON public.influencer_video_comments FOR INSERT WITH CHECK (true);

-- Feed view: approved videos with influencer info
CREATE OR REPLACE VIEW public.v_influencer_feed AS
SELECT
  vs.id                 AS video_id,
  vs.candidate_id,
  vs.video_url,
  vs.platform,
  vs.caption,
  vs.created_at,
  c.name                AS influencer_name,
  cs.niche,
  cs.bio,
  cs.profile_photo_url,
  cs.instagram_url,
  cs.youtube_url,
  cs.twitter_url,
  cs.tiktok_url,
  cs.website_url,
  cs.referral_code
FROM public.influencer_video_submissions vs
JOIN public.candidates c ON c.id = vs.candidate_id
JOIN public.content_creator_social cs ON cs.candidate_id = vs.candidate_id
WHERE vs.status = 'approved'
ORDER BY vs.created_at DESC;
