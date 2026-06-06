-- Add pin + view_count to influencer video submissions
ALTER TABLE public.influencer_video_submissions
  ADD COLUMN IF NOT EXISTS is_pinned   boolean not null default false,
  ADD COLUMN IF NOT EXISTS view_count  int     not null default 0;
