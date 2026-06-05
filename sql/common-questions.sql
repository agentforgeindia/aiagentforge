-- ============================================================
-- AgentForge — Common Assessment Questions (all roles)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- role_slug = NULL → these appear in EVERY role's test, so no
-- role starts with an empty assessment. Covers AgentForge basics
-- + general aptitude.
-- ============================================================

insert into public.recruitment_questions (role_slug, section, difficulty, question, options, correct_idx) values

-- ── AgentForge basics (everyone should know) ─────────────────
(null,'basic','easy','AgentForge AI mukhya roop se kya karta hai?',
 ARRAY['Food delivery','Product photos ko AI se professional catalogue/photoshoot images mein convert karta hai','Mobile recharge','Taxi booking'],1),

(null,'basic','easy','AgentForge ke 3 main agents kaunse hain?',
 ARRAY['Textile, Jewellery, Productography','Cricket, Football, Tennis','Email, SMS, Call','Photo, Video, Audio'],0),

(null,'basic','easy','AgentForge ke plans kahan se start hote hain?',
 ARRAY['Rs 99','Rs 1,999','Rs 50,000','Free hamesha'],1),

(null,'basic','medium','Customer ko AgentForge ka sabse bada benefit kya hai?',
 ARRAY['Free mobile','Photographer/model/studio ke bina professional images','Free internet','Discount coupons'],1),

(null,'basic','easy','AgentForge mobile se use ho sakta hai?',
 ARRAY['Nahi','Haan','Sirf laptop pe','Sirf iPhone pe'],1),

-- ── General aptitude / logic ─────────────────────────────────
(null,'aptitude','easy','Agar ek kaam 2 log 4 din mein karte hain, to 4 log (same speed) kitne din mein karenge?',
 ARRAY['1 din','2 din','4 din','8 din'],1),

(null,'aptitude','easy','25% of 200 = ?',
 ARRAY['25','50','75','100'],1),

(null,'aptitude','medium','Series complete karo: 2, 4, 8, 16, ___',
 ARRAY['20','24','32','64'],2),

(null,'aptitude','easy','Customer naraz hai. Best first response kya hai?',
 ARRAY['Phone kaat do','Politely sunno aur samajho','Argue karo','Ignore karo'],1),

(null,'aptitude','medium','Team mein kaam karte waqt sabse zaroori kya hai?',
 ARRAY['Sirf apna kaam','Communication aur coordination','Doosron ko blame karna','Chup rehna'],1),

-- ── Work ethic / behaviour ───────────────────────────────────
(null,'basic','easy','Daily report kyun zaroori hai?',
 ARRAY['Time waste karne ke liye','Performance track aur improve karne ke liye','Koi reason nahi','Boss ko khush karne ke liye'],1),

(null,'basic','easy','Customer ka data (number/details) ke saath kya karna chahiye?',
 ARRAY['Kisi ko bhi de do','Confidential rakho, sirf company use','Social media pe daalo','Bech do'],1)

on conflict do nothing;
