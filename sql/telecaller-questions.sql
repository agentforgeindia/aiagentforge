-- ============================================================
-- AgentForge — Telecaller Assessment Questions
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Seeds MCQs for the telecaller role into the recruitment
-- question bank (used by /careers test). correct_idx is 0-based.
-- ============================================================

insert into public.recruitment_questions (role_slug, section, difficulty, question, options, correct_idx) values

-- ── Product knowledge ────────────────────────────────────────
('telecaller','product','easy',
 'AgentForge AI mukhya roop se kya karta hai?',
 ARRAY['Website banata hai','Product photos ko professional AI catalogue/photoshoot creatives mein convert karta hai','Logo design karta hai','Accounting software hai'], 1),

('telecaller','product','easy',
 'Textile customer ko AgentForge se kya benefit milta hai?',
 ARRAY['Free fabric milta hai','Design upload karke model mockup + catalogue image','Sirf billing','Courier service'], 1),

('telecaller','product','easy',
 'Jewellery customer ko kya benefit hai?',
 ARRAY['Product photo se bridal/luxury shoot + catalogue image','Gold rate updates','Jewellery delivery','Repairing'], 0),

('telecaller','product','medium',
 'Productography AI kiske liye best hai?',
 ARRAY['Sirf textile','Gift, toys, cosmetics, ecommerce product sellers','Sirf jewellery','Real estate'], 1),

('telecaller','product','easy',
 'AgentForge ke plans kahan se start hote hain?',
 ARRAY['Rs 99','Rs 499','Rs 1,999','Rs 25,000'], 2),

-- ── Sales / calling flow ─────────────────────────────────────
('telecaller','sales','easy',
 'Cold call ka MAIN objective kya hai?',
 ARRAY['Turant payment lena','Demo bhejna, interest generate karna, qualified lead banana','Customer se argue karna','Sirf number collect karna'], 1),

('telecaller','sales','easy',
 'Call ke baad sabse zaroori kaam kya hai?',
 ARRAY['Phone band karna','CRM status update karna','Chai peena','Doosre caller ko batana'], 1),

('telecaller','sales','medium',
 'Calling flow ka sahi order kya hai?',
 ARRAY['Pricing → Greeting → Demo','Greeting → Business identify → Problem → Solution → Demo → WhatsApp confirm → CRM','Demo → Payment → Greeting','Sirf pricing batana'], 1),

('telecaller','sales','medium',
 'Customer kahe "Pricing bhejo aur trial karna hai" — ye kaunsa lead hai?',
 ARRAY['Cold Lead','Warm Lead','Hot Lead — immediately mark + inform team','Wrong number'], 2),

('telecaller','sales','medium',
 'Customer kahe "Baad mein dekhunga, abhi requirement nahi but useful hai" — kya karein?',
 ARRAY['Lead delete karo','Warm lead — demo bhejo + 24-48h follow-up','Force karo abhi kharidne ke liye','Block karo'], 1),

-- ── Objection handling ───────────────────────────────────────
('telecaller','sales','medium',
 'Customer kahe "Already photographer hai" — best response?',
 ARRAY['Photographer galat hai','Photographer premium ke liye best hai; AgentForge daily catalogue/new arrivals/social creatives ke liye useful hai','Call kaat do','Argue karo'], 1),

('telecaller','sales','medium',
 'Customer kahe "AI quality achhi nahi hoti" — best response?',
 ARRAY['Aap galat ho','Isliye pehle demo aur trial suggest karte hain, apni image se output check karein','Phone rakh do','Discount do'], 1),

('telecaller','sales','easy',
 'Customer kahe "Time nahi hai" — best response?',
 ARRAY['Abhi suno warna offer khatam','No issue Sir, demo WhatsApp kar deta hoon convenient time par dekhiye','Baar baar call karo','Lead chhodo'], 1),

-- ── Quality / behaviour ──────────────────────────────────────
('telecaller','basic','easy',
 'Caller ko kya NAHI karna chahiye?',
 ARRAY['Politely baat karna','Customer ko force karna aur quality overpromise karna','CRM update karna','Demo bhejna'], 1),

('telecaller','basic','easy',
 'Per caller daily call target lagbhag kitna hai?',
 ARRAY['10-20','100-120','500-600','Koi target nahi'], 1),

('telecaller','basic','medium',
 'Best calling mindset kya hai?',
 ARRAY['Har call par sale zaroori','Pehle educate + curiosity, phir demo, trial, phir payment','Customer ko daraana','Sirf pricing bolna'], 1),

('telecaller','basic','easy',
 'Demo bhejne se pehle kya confirm karna zaroori hai?',
 ARRAY['Customer ka PAN','WhatsApp number','Bank details','Aadhaar'], 1),

('telecaller','crm','easy',
 'Hot lead milne par turant kya karna hai?',
 ARRAY['Ignore karo','Mark Hot Lead + AgentForge team ko inform karo','Kal dekhenge','Delete karo'], 1)

on conflict do nothing;
