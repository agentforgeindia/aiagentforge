-- ════════════════════════════════════════════════════════════
--  CC / Influencer Flow Setup — AgentForge
--  Run this once in Supabase SQL editor
-- ════════════════════════════════════════════════════════════

-- 1. Demo video URL column on candidates
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS demo_video_url TEXT;

-- 2. Create Supabase Storage bucket for CC demo videos
--    (Run via Supabase Dashboard > Storage > New Bucket, OR uncomment below)
-- insert into storage.buckets (id, name, public) values ('cc-demo-videos', 'cc-demo-videos', false)
-- on conflict (id) do nothing;

-- Storage policy — allow service role to read/write
-- (Supabase Dashboard: Storage > cc-demo-videos > Policies > Add policy > service role full access)

-- 3. Five AgentForge knowledge questions for Content Creator assessment
INSERT INTO public.recruitment_questions
  (role_slug, section, difficulty, question, options, correct_option, explanation)
VALUES
  (
    'content-creator', 'agentforge', 'easy',
    'What is AgentForge AI primarily designed for?',
    '["Email marketing and newsletters","AI-powered visuals for textile, jewellery and product photography","Video editing and post-production","Social media scheduling tools"]',
    1,
    'AgentForge is India''s AI visual studio for textile prints-to-mockup, jewellery photography, and productography.'
  ),
  (
    'content-creator', 'agentforge', 'easy',
    'Which business categories does AgentForge AI specialize in?',
    '["Finance, Healthcare, and Education","Textile, Jewellery, and Productography","Real Estate, Automotive, and Agriculture","Food, Hospitality, and Entertainment"]',
    1,
    'AgentForge specializes in textile mockups, jewellery AI photography, and AI product photography.'
  ),
  (
    'content-creator', 'agentforge', 'easy',
    'What does the "Textile Prints to Mockup" AgentForge feature do?',
    '["Converts fabric orders to invoices","Transforms print designs into realistic apparel mockups using AI","Books fabric printing orders online","Tracks fabric delivery logistics"]',
    1,
    'The Textile Prints to Mockup agent uses AI to turn print designs into realistic fabric and apparel product mockups instantly.'
  ),
  (
    'content-creator', 'agentforge', 'easy',
    'How does AgentForge Jewellery AI benefit a jewellery business?',
    '["Manages jewellery inventory and GST billing","Creates professional AI-generated jewellery photographs without a studio shoot","Books diamond appraisal appointments","Provides jewellery loan EMI calculations"]',
    1,
    'AgentForge Jewellery AI generates professional studio-quality jewellery photos from basic product images using AI — saving thousands on photoshoots.'
  ),
  (
    'content-creator', 'agentforge', 'easy',
    'As an AgentForge Content Creator partner, what will you primarily promote to your audience?',
    '["AgentForge''s AI photography and mockup tools for Indian textile, jewellery and product businesses","AgentForge''s accounting and billing software","AgentForge''s HR management tools","AgentForge''s delivery and logistics platform"]',
    0,
    'Content Creator partners promote AgentForge''s AI visual tools — textile mockups, jewellery AI photography, and productography — to relevant business audiences.'
  )
ON CONFLICT DO NOTHING;

-- 4. View: Admin can see CC demo videos via candidates table
--    Query: SELECT id, name, mobile, role_slug, demo_video_url, created_at
--           FROM public.candidates
--           WHERE role_slug = 'content-creator' AND demo_video_url IS NOT NULL
--           ORDER BY created_at DESC;

-- 5. Optional: dedicated view for CC demo submissions
CREATE OR REPLACE VIEW public.v_cc_demo_submissions AS
SELECT
  c.id,
  c.name,
  c.email,
  c.mobile,
  c.stage,
  c.demo_video_url,
  c.created_at AS applied_at,
  css.instagram_url,
  css.youtube_url,
  css.facebook_url,
  css.followers_count,
  css.avg_views,
  css.niche,
  css.ai_score,
  css.referral_code
FROM public.candidates c
LEFT JOIN public.content_creator_social css ON css.candidate_id = c.id
WHERE c.role_slug = 'content-creator'
ORDER BY c.created_at DESC;
