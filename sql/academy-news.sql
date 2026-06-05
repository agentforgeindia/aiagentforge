-- ============================================================
-- AgentForge Academy — News Posts
-- Run in Supabase SQL Editor
-- ============================================================

INSERT INTO public.posts (
  slug, type, category, title, description, excerpt,
  author, hero_emoji, read_minutes, cta_label, cta_href,
  keywords, body, thumbnail, status, published_at
) VALUES

-- News 1: Academy Launch
(
  'agentforge-academy-launch-2026',
  'news',
  'announcement',
  'AgentForge Academy Launches — WFH Jobs Open Across India',
  'AgentForge AI officially launches its Learn & Earn Academy with 5 work-from-home job categories open to candidates across India. Free training, ₹5,000 basic salary, and performance incentives.',
  'AgentForge Academy is now open. 100% WFH. Free training. ₹5,000 basic + incentives. Candidates from across India can apply today.',
  'AgentForge Team',
  '🎓',
  3,
  'Apply Now — Free',
  '/careers',
  ARRAY['AgentForge Academy launch', 'WFH jobs India 2026', 'work from home hiring India', 'AI company hiring India'],
  '[
    {"type":"p","text":"AgentForge AI today officially launches the Learn & Earn Academy — a free online training and remote hiring program open to candidates across India. The Academy aims to onboard 100 work-from-home members by the end of 2026."},
    {"type":"h2","text":"What is being launched"},
    {"type":"ul","items":["5 WFH job roles: Telecaller, Lead Research Executive, Social Media Executive, AI Operator, Customer Support","Free 6-module online training portal","30-minute online MCQ assessment (auto-scored)","₹5,000 basic salary + performance incentives for all selected candidates","Candidate learning portal accessible from any device"]},
    {"type":"h2","text":"Who can apply"},
    {"type":"p","text":"Any individual in India with a smartphone and basic internet — fresher or experienced, any city or town. Minimum qualification: 10th pass. Minimum availability: 4 hours per day."},
    {"type":"h2","text":"How to apply"},
    {"type":"p","text":"Visit aiagentforge.in/careers. Select your preferred role. Complete the free training modules. Take the 30-minute assessment. Scoring 50% or above qualifies you for an interview call from the AgentForge team within 48 hours."},
    {"type":"quote","text":"We are building India largest remote AI sales team. Every city, every town — talent is everywhere. AgentForge Academy is how we find it."}
  ]'::jsonb,
  '{"headline":"Academy Launch","subline":"WFH Jobs Open","badge":"Breaking News","gradientFrom":"#06b6d4","gradientTo":"#7c3aed","icon":"🎓","statsRow":["100 Seats","₹5K Basic","Free Training"]}'::jsonb,
  'published',
  '2026-06-05T08:00:00.000Z'
),

-- News 2: Academy Training Portal Live
(
  'agentforge-academy-training-portal-live',
  'news',
  'announcement',
  'Academy Training Portal Is Live — 6 Modules, Self-Paced Learning',
  'AgentForge Academy''s online learning portal is now live with 6 training modules covering AI product knowledge, communication, CRM, sales basics, lead handling and company overview.',
  'The Academy training portal is live. 6 modules. Read at your own pace. Complete all modules before taking the assessment for best results.',
  'AgentForge Team',
  '📚',
  2,
  'Start Learning',
  '/careers/learn',
  ARRAY['AgentForge Academy training', 'online training portal India', 'AI sales training India', 'free training WFH India'],
  '[
    {"type":"p","text":"The AgentForge Academy online learning portal is now live and accessible to all registered candidates at aiagentforge.in/careers/learn."},
    {"type":"h2","text":"What the training covers"},
    {"type":"ul","items":["Module 1 — AgentForge Introduction: company history, products (TextilePrints to Mockup AI, Jewellery AI Studio, Productography AI), pricing plans and mission","Module 2 — Communication Training: WhatsApp business etiquette, professional email writing, calling confidence and active listening","Module 3 — Lead Handling: what is a lead, BANT qualification framework, CRM status updates, follow-up cadence","Module 4 — AI Product Training: how each AI agent works, how to run a live demo, before-after comparison, handling objections","Module 5 — CRM Training: lead status pipeline, daily update discipline, next follow-up scheduling","Module 6 — Sales Basics: objection handling scripts, pricing discussion framework, demo booking techniques, closing methods"]},
    {"type":"h2","text":"How to access"},
    {"type":"p","text":"Go to aiagentforge.in/careers, click your preferred role, and the training modules load automatically. Progress is saved as you read each module. After completing all 6, the assessment becomes available."},
    {"type":"quote","text":"Training se test aasaan hoga. Test se interview aasaaan hoga. Interview se job milegi. Pehle training padho."}
  ]'::jsonb,
  '{"headline":"Training Portal","subline":"6 Modules Live","badge":"Platform Update","gradientFrom":"#8b5cf6","gradientTo":"#06b6d4","icon":"📚","statsRow":["6 Modules","Self-Paced","Free Access"]}'::jsonb,
  'published',
  '2026-06-04T10:00:00.000Z'
),

-- News 3: Academy First Batch
(
  'agentforge-academy-first-batch-hiring',
  'news',
  'announcement',
  'Academy First Batch: 20 Candidates Selected Across 8 Cities',
  'AgentForge Academy''s first batch of candidates has been selected — 20 work-from-home members across 8 Indian cities begin their first week of remote work assignments.',
  'First 20 Academy members selected from Mumbai, Delhi, Surat, Jaipur, Lucknow, Hyderabad, Pune and Indore. Applications for the second batch are now open.',
  'AgentForge Team',
  '🎉',
  3,
  'Apply for Second Batch',
  '/careers',
  ARRAY['AgentForge Academy batch', 'WFH hiring India', 'remote team India', 'AI company remote jobs'],
  '[
    {"type":"p","text":"AgentForge Academy has completed its first hiring cycle. 20 candidates across 8 Indian cities have been selected for the first batch of remote work-from-home assignments. Applications for the second batch are now open."},
    {"type":"h2","text":"First batch breakdown"},
    {"type":"ul","items":["Mumbai — 4 members (Telecaller x2, Social Media x1, Support x1)","Delhi — 3 members (Telecaller x2, AI Operator x1)","Surat — 3 members (Lead Research x2, Telecaller x1)","Jaipur — 2 members (Telecaller x1, AI Operator x1)","Lucknow — 2 members (Support x1, Social Media x1)","Hyderabad — 2 members (Telecaller x1, Lead Research x1)","Pune — 2 members (AI Operator x1, Social Media x1)","Indore — 2 members (Support x1, Telecaller x1)"]},
    {"type":"h2","text":"What the first batch is working on"},
    {"type":"p","text":"Selected telecallers have been assigned a lead list and are conducting outbound calls to textile manufacturers, jewellery brands and D2C sellers. Lead research members are building target lists of businesses in identified sectors. Social media members are managing content scheduling and engagement."},
    {"type":"h2","text":"Apply for the second batch"},
    {"type":"p","text":"The second batch intake is now open. Visit aiagentforge.in/careers to register and begin training. The assessment window for the second batch closes in 14 days."},
    {"type":"quote","text":"Pehla batch shuru ho gaya. Second batch ke liye abhi apply karo — seats limited hain."}
  ]'::jsonb,
  '{"headline":"First Batch","subline":"20 Members Selected","badge":"Milestone","gradientFrom":"#10b981","gradientTo":"#0891b2","icon":"🎉","statsRow":["20 Members","8 Cities","Batch 2 Open"]}'::jsonb,
  'published',
  '2026-06-03T09:00:00.000Z'
)

ON CONFLICT (slug) DO NOTHING;
