-- ============================================================
-- AgentForge — Sales Resources (templates + links)
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.sales_resources (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('whatsapp','email','link','script')),
  title       text not null,
  content     text not null,         -- the message body or the URL
  how_to      text,                  -- when/how to use this
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);

alter table public.sales_resources enable row level security;
drop policy if exists "resources read"  on public.sales_resources;
drop policy if exists "resources write" on public.sales_resources;
create policy "resources read"  on public.sales_resources for select to authenticated using (public.has_permission('leads.view') or public.has_permission('kb.view') or public.has_permission('*'));
create policy "resources write" on public.sales_resources for all    to authenticated using (public.has_permission('hr.manage') or public.has_permission('*')) with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- ── Seed WhatsApp templates ──────────────────────────────────
insert into public.sales_resources (category, title, content, how_to, sort_order) values
('whatsapp','First Demo Message', $m$Hi Sir/Madam, thank you for your time. AgentForge AI helps textile, jewellery and product businesses create professional catalogue images aur photoshoot-style visuals using AI.
🎥 Demo: https://aiagentforge.in
🌐 Website: https://aiagentforge.in
Regards, Team AgentForge AI$m$, 'Pehli baar baat hone ke baad — general demo intro.', 10),

('whatsapp','Textile Demo', $m$Hi Sir, AgentForge AI se aap textile design upload karke model mockup aur catalogue images generate kar sakte hain.
🎥 Demo: https://aiagentforge.in/textileprints-to-mockup
🌐 https://aiagentforge.in
Regards, Team AgentForge AI$m$, 'Textile/saree/fabric/suit seller ke liye.', 20),

('whatsapp','Jewellery Demo', $m$Hi Sir/Madam, AgentForge Jewellery AI Studio se product photo se bridal shoot, catalogue aur premium campaign images banti hain.
🎥 Demo: https://aiagentforge.in/jewellery-ai
🌐 https://aiagentforge.in/jewellery-ai
Regards, Team AgentForge AI$m$, 'Jewellery showroom / Instagram jewellery seller ke liye.', 30),

('whatsapp','Productography Demo', $m$Hi Sir, AgentForge AI se normal product photo ko ecommerce image, Instagram creative aur catalogue visual mein convert kar sakte hain.
🎥 Demo: https://aiagentforge.in/productography-ai
🌐 https://aiagentforge.in
Regards, Team AgentForge AI$m$, 'Gift/toys/cosmetics/ecommerce seller ke liye.', 40),

('whatsapp','Pricing', $m$Hi Sir/Madam, AgentForge AI pricing:
💰 https://aiagentforge.in/pricing
Plans ₹1,999 se start hote hain. Business usage ke hisaab se suitable plan suggest karenge.
Regards, Team AgentForge AI$m$, 'Jab customer "price kya hai?" pooche.', 50),

('whatsapp','Tutorials', $m$Hi Sir, AgentForge use karna bilkul aasaan hai. Step-by-step tutorials:
🎓 https://aiagentforge.in/tutorials
📺 YouTube: https://youtube.com/@agentforge
Regards, Team AgentForge AI$m$, 'Customer ko "kaise use kare" samjhane ke liye.', 60),

('whatsapp','Follow-up', $m$Hi Sir/Madam, hope aapne AgentForge AI demo check kiya. Apne product/design pe try karna chahenge? Hum first generation guide kar denge.
Regards, Team AgentForge AI$m$, 'Demo bhejne ke 24-48 ghante baad.', 70),

('whatsapp','Hot Lead — Onboarding', $m$Hi Sir, thank you interest ke liye! Hamari team guide karegi:
1) Signup 2) First image 3) Plan selection 4) Payment support.
Suitable callback time bata dijiye.
Regards, Team AgentForge AI$m$, 'Jab customer trial/payment ready ho.', 80);

-- ── Seed important links ─────────────────────────────────────
insert into public.sales_resources (category, title, content, how_to, sort_order) values
('link','Website Home',        'https://aiagentforge.in',                          'Main website.', 100),
('link','Textile Page',        'https://aiagentforge.in/textileprints-to-mockup',  'Textile tool demo.', 101),
('link','Jewellery Page',      'https://aiagentforge.in/jewellery-ai',             'Jewellery studio.', 102),
('link','Productography Page', 'https://aiagentforge.in/productography-ai',        'Product shoot tool.', 103),
('link','Pricing',             'https://aiagentforge.in/pricing',                  'Plans & pricing.', 104),
('link','Tutorials',           'https://aiagentforge.in/tutorials',                'How-to guides.', 105),
('link','How It Works',        'https://aiagentforge.in/how-it-works',             'Process explainer.', 106),
('link','Gallery',             'https://aiagentforge.in/gallery',                  'Sample outputs.', 107),
('link','Support',             'https://aiagentforge.in/support',                  'Help & ticket.', 108),
('link','YouTube',             'https://youtube.com/@agentforge',                  'Video tutorials (UPDATE link).', 110),
('link','Instagram',           'https://instagram.com/agentforge.ai',              'Social proof (UPDATE link).', 111),
('link','Facebook',            'https://facebook.com/agentforge',                  'Social (UPDATE link).', 112)
on conflict do nothing;
