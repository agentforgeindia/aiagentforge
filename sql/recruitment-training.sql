-- ============================================================
-- AgentForge — Candidate Training Modules (public Academy)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Public-readable training content shown on /careers/learn BEFORE
-- a candidate applies. Role-wise modules.
-- ============================================================

create table if not exists public.recruitment_training (
  id            uuid primary key default gen_random_uuid(),
  role_slug     text,                          -- null = common (all roles)
  module_order  int not null default 1,
  title         text not null,
  content       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists rec_training_idx on public.recruitment_training (role_slug, module_order);

alter table public.recruitment_training enable row level security;

-- Public read (candidates), admin write.
drop policy if exists "training read"  on public.recruitment_training;
drop policy if exists "training write" on public.recruitment_training;
create policy "training read"  on public.recruitment_training for select using (true);
create policy "training write" on public.recruitment_training for all to authenticated
  using (public.has_permission('hr.manage') or public.has_permission('*'))
  with check (public.has_permission('hr.manage') or public.has_permission('*'));

-- ── Common modules (every role) ──────────────────────────────
insert into public.recruitment_training (role_slug, module_order, title, content) values
(null, 1, 'Welcome to AgentForge', $md$AgentForge AI ek AI visual creation platform hai. Businesses apne product/design ki photo upload karte hain, style select karte hain, aur AI professional catalogue images, photoshoot-style visuals aur marketing creatives generate kar deta hai — bina photographer, model ya studio ke.

**3 AI Agents:**
- 🧵 Textile AI — fabric/design se model mockup + catalogue
- 💎 Jewellery AI — product photo se bridal/luxury shoot
- 📸 Productography AI — product photo se ecommerce/Instagram creative

**Plans:** Starter ₹1,999 · Pro ₹9,999 · Empire ₹39,999. New signup = 100 free credits. 15 credits = 1 HD image.$md$),

(null, 2, 'How AgentForge Helps Businesses', $md$Customers ka problem: photoshoot mehenga, model arrange karna mushkil, har naye design/product ka shoot possible nahi, daily social media creatives chahiye.

AgentForge solution: photo upload → style select → professional image ready in ~60 seconds. Catalogue updates, social media, ads, ecommerce listings — sab.

**One-line:** "Business owners apne products ke professional photoshoot-style images bina photographer, model aur studio ke generate kar sakte hain."$md$),

(null, 3, 'Work Ethics & Professionalism', $md$- Polite aur respectful raho — customer/colleague sabse.
- Honest raho — fake reports ya overpromise mat karo.
- Customer data confidential rakho.
- Daily report time pe bharo.
- Seekhne ke liye ready raho — feedback ko positively lo.
- Team ke saath coordinate karo.$md$);

-- ── Telecaller modules ───────────────────────────────────────
insert into public.recruitment_training (role_slug, module_order, title, content) values
('telecaller', 1, 'Telecaller — Your Role', $md$Telecaller ka main target direct sale nahi hai. Target hai:
1. Sahi business owner tak pahunchna
2. AgentForge AI ka simple demo explain karna
3. WhatsApp par demo/pricing bhejna
4. Interested leads ko hot lead mark karna
5. Follow-up karke trial/signup tak push karna

**Flow:** Call → Interest → WhatsApp Demo → Follow-up → Trial → Paid.$md$),

('telecaller', 2, 'Calling Flow (7 Steps)', $md$1. **Greeting:** "Hello Sir, main ___ AgentForge AI se bol raha hoon."
2. **Business identify:** "Aapka business textile, jewellery ya product selling mein hai?"
3. **Problem connect:** "Photoshoot aur catalogue mein time aur cost lagti hai."
4. **Solution:** "Photo upload karke professional image generate kar sakte hain."
5. **Demo offer:** "2 minute ka demo WhatsApp kar deta hoon."
6. **WhatsApp confirm:** "Yehi number WhatsApp ke liye sahi hai?"
7. **CRM update:** status mark karo (Demo Sent / Interested / Hot Lead...).$md$),

('telecaller', 3, 'Objection Handling', $md$**"Need nahi hai"** → "Bilkul Sir, demo bhej deta hoon, future mein useful rahega."
**"Already photographer hai"** → "Photographer premium ke liye best hai, AgentForge daily catalogue/social creatives ke liye useful hai."
**"AI quality?"** → "Isliye pehle demo + trial suggest karte hain."
**"Price?"** → "Plans ₹1,999 se start, pehle demo dekhiye."
**"Time nahi"** → "Demo WhatsApp kar deta hoon, convenient time par dekhiye."$md$);

-- ── Sales Executive modules ──────────────────────────────────
insert into public.recruitment_training (role_slug, module_order, title, content) values
('sales-executive', 1, 'Sales Executive — Your Role', $md$Aap leads ko customers mein convert karte ho. Lead handling, demo, follow-up, negotiation aur closing — sab aapke kaam hain.

**Funnel:** Lead → Demo → Interested → Trial → Paid. Har stage par value add karo, push nahi.$md$),

('sales-executive', 2, 'Product & Pricing', $md$Plans: Starter ₹1,999 (1,800 credits) · Pro ₹9,999 (12,000) · Empire ₹39,999 (50,000). 15 credits = 1 HD image.

Customer ke business size aur usage ke hisaab se sahi plan suggest karo. Pehle demo + trial, phir plan.$md$);

-- ── Support Executive modules ────────────────────────────────
insert into public.recruitment_training (role_slug, module_order, title, content) values
('support-executive', 1, 'Support Executive — Your Role', $md$Customer ki problems solve karna — billing, credits, generation issues. Empathy + fast resolution = happy customer.

**SOP:** Sunno → samjho → solve karo ya escalate karo → follow-up.$md$),

('support-executive', 2, 'Common Issues', $md$- **Image not generating:** credits check, queue check, retry.
- **Credits issue:** balance verify, manual adjust agar genuine.
- **Billing:** payment verify, invoice resend.
- Refund genuine ho to process karo, warna politely explain.$md$);
