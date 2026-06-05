-- ============================================================
-- AgentForge — Telecalling Training → Knowledge Base
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Seeds the telecalling manual as KB articles so the calling
-- team can read scripts, objection handling and templates.
-- Uses dollar-quoting ($md$) so apostrophes need no escaping.
-- ============================================================

insert into public.kb_articles (category, title, content, tags, is_pinned) values

('training', 'Telecaller — Product Knowledge', $md$## AgentForge AI kya hai?
AI visual creation platform — businesses bina photoshoot ke professional product images, catalogue creatives aur marketing visuals banate hain. Customer photo upload karta hai, style select karta hai, AI output deta hai.

## One-line pitch
"AgentForge AI se business owners apne products ke professional photoshoot-style images bina photographer, model aur studio ke generate kar sakte hain."

## 3 Agents
- **Textile AI** — fabric/design upload → model mockup + catalogue image
- **Jewellery AI** — product photo → bridal shoot, luxury catalogue
- **Productography AI** — product photo → ecommerce + Instagram creative

## Product Knowledge Test (yaad rakho)
**Q1. AgentForge kya karta hai?** Product photos ko professional AI catalogue/photoshoot/marketing creatives mein convert karta hai.
**Q2. Textile benefit?** Design upload karke model mockup + catalogue + social creative.
**Q3. Jewellery benefit?** Product photo se bridal shoot, luxury shoot, catalogue.
**Q4. Product seller benefit?** Photo se ecommerce listing, Instagram creative, product ad.
**Q5. Call ka objective?** Demo/tutorial bhejna, interest generate karna, qualified lead banana.$md$,
 ARRAY['telecaller','training','product'], true),

('training', 'Telecaller — Calling Flow (7 Steps)', $md$## Step 1: Greeting
"Hello Sir/Madam, main ______ AgentForge AI se bol raha hoon. Kya main business owner ya marketing team se baat kar raha hoon?"

## Step 2: Business Identify
"Sir aapka business textile, jewellery, product selling ya ecommerce category mein hai?"

## Step 3: Problem Connect
"Sir usually product photoshoot, catalogue images aur social media creatives mein kaafi time aur cost lagti hai."

## Step 4: Solution Explain
"AgentForge AI mein aap product/design photo upload karke professional photoshoot-style image generate kar sakte hain."

## Step 5: Demo Offer
"Sir main aapko 2 minute ka demo WhatsApp kar deta hoon."

## Step 6: WhatsApp Confirm
"Sir yehi number WhatsApp ke liye use karun ya koi aur number hai?"

## Step 7: CRM Update (mandatory)
Demo Sent / Interested / Callback Later / Not Interested / Wrong Number / Hot Lead / Trial Started / Paid Customer$md$,
 ARRAY['telecaller','script'], true),

('training', 'Telecaller — Textile Script', $md$**Opening:** "Hello Sir, main ______ AgentForge AI se bol raha hoon. Kya aap textile business se belong karte hain?"

**Pitch:** "Sir humne textile businesses ke liye AI platform banaya hai jisme aap apna design upload karke model photoshoot-style image generate kar sakte hain."

**Problem:** "Sir har new design ka photoshoot, model arrange karna aur catalogue banana costly aur time-consuming hota hai."

**Solution:** "AgentForge AI mein design upload karke professional mockup, catalogue image aur Instagram creative generate kar sakte hain."

**Question:** "Sir currently aap apne catalogue aur social media creatives kaise banwate hain?"

**Demo push:** "Main aapko short demo WhatsApp kar deta hoon — normal textile design se model shoot ka output."

**Close:** "Sir WhatsApp ke liye yehi number correct hai?"$md$,
 ARRAY['telecaller','script','textile'], false),

('training', 'Telecaller — Jewellery Script', $md$**Opening:** "Hello Sir/Madam, main ______ AgentForge AI se bol raha hoon. Kya main jewellery showroom owner ya marketing team se baat kar raha hoon?"

**Pitch:** "Sir jewellery collection ke photoshoot mein model, makeup, photographer aur editing ka kaafi cost aata hai."

**Solution:** "AgentForge Jewellery AI Studio mein product photo upload karke bridal shoot, luxury catalogue shoot aur social campaign image generate kar sakte hain."

**Question:** "Sir aap currently jewellery catalogue aur Instagram images kaise banwate hain?"

**Demo push:** "Main 2 minute ka demo WhatsApp kar deta hoon — output quality khud dekhiye."

**Close:** "Sir demo bhejne ke liye WhatsApp number confirm kar dijiye."$md$,
 ARRAY['telecaller','script','jewellery'], false),

('training', 'Telecaller — Product Seller Script', $md$**Opening:** "Hello Sir, main ______ AgentForge AI se bol raha hoon. Kya aap gift items, toys, cosmetics, accessories ya ecommerce products sell karte hain?"

**Pitch:** "Sir har product ka professional photoshoot karwana expensive aur time-consuming hota hai."

**Solution:** "AgentForge AI mein mobile se product photo upload karke professional ecommerce image, Instagram creative aur catalogue image generate kar sakte hain."

**Question:** "Sir aap apne products Instagram, WhatsApp catalogue ya marketplace par sell karte hain?"

**Demo push:** "Main demo WhatsApp kar deta hoon. Useful lage to free trial bhi check kar sakte hain."$md$,
 ARRAY['telecaller','script','product'], false),

('sop', 'Telecaller — Objection Handling', $md$**"Need nahi hai"** → "Bilkul Sir. Main sirf demo bhej deta hoon. Future mein catalogue ya social creatives chahiye to useful rahega."

**"Already photographer hai"** → "Great Sir. Photographer premium shoot ke liye best hai. AgentForge daily catalogue, new arrivals aur social creatives ke liye useful hai jahan har product ka shoot possible nahi."

**"AI quality achhi nahi hoti"** → "Sir isliye hum pehle demo aur trial suggest karte hain. Apni image se output check karke decide karein."

**"Price kya hai?"** → "Sir plans ₹1,999 se start hote hain. Pehle demo dekh lijiye, phir usage ke hisaab se suitable plan suggest karenge."

**"Time nahi hai"** → "No issue Sir. Demo WhatsApp kar deta hoon, convenient time par dekhiye."

**"Samajh nahi aaya"** → "Sir simple hai — product photo upload karte hain, style select karte hain, AI professional image bana deta hai."

**"Hum chhote business hain"** → "Sir chhote businesses ke liye hi zyada useful hai, kyunki har baar photographer, model aur studio afford karna easy nahi."$md$,
 ARRAY['telecaller','objection'], true),

('sop', 'Telecaller — WhatsApp Templates', $md$## First Demo
Hi Sir/Madam, thank you for your time. AgentForge AI helps textile, jewellery and product businesses create professional catalogue images and photoshoot-style visuals using AI.
🎥 Demo: [Demo Link]
🌐 https://aiagentforge.in

## Textile Demo
Hi Sir, AgentForge AI can generate model mockups and catalogue images from fabric/design photos.
🎥 [Textile Demo] · 🌐 https://aiagentforge.in

## Jewellery Demo
Hi Sir/Madam, AgentForge Jewellery AI Studio generates bridal shoot, catalogue and premium campaign images from product photos.
🎥 [Jewellery Demo] · 🌐 https://aiagentforge.in/jewellery-ai

## Product Demo
Hi Sir, AgentForge AI creates ecommerce images, Instagram creatives and catalogue visuals from normal product photos.
🎥 [Product Demo] · 🌐 https://aiagentforge.in

## Pricing
Hi Sir/Madam, AgentForge AI pricing: [Pricing Link]. Plans start from ₹1,999. Choose as per business usage.

## Follow-Up
Hi Sir/Madam, hope you checked the AgentForge AI demo. Would you like to try it for your business product/design? We can guide the first generation.

## Hot Lead
Hi Sir, thank you for your interest. Our team can guide: 1) Signup 2) First generation 3) Plan selection 4) Payment support. Please share a suitable callback time.$md$,
 ARRAY['telecaller','whatsapp','templates'], false),

('sop', 'Telecaller — Lead Priority Rules', $md$## 🔥 Hot Lead — mark immediately + inform team
Customer says: "Pricing bhejo" / "Demo dikhao" / "Kaise use karna hai?" / "Payment kaise?" / "Trial karna hai" / "Mere product par test ho sakta hai?"

## ⚡ Warm Lead — demo + follow-up 24-48h
"Demo bhej do" / "Baad mein dekhunga" / "Team se discuss karunga" / "Abhi requirement nahi but useful hai"

## ❄️ Cold Lead — mark, don't push
"Need nahi" / "Interested nahi" / "Wrong business" / "Call mat karo"

## Daily Targets (per caller)
- 100-120 calls · 30+ connected · 10-15 demos · 3-5 interested · 1-2 hot leads

## Quality Rules
DO: politely speak, ask category, simple language, soft demo push, confirm WhatsApp, update CRM, honest hot leads.
DON'T: force buying, overpromise quality, argue, heavy technical talk, end call without demo, fake interested leads.$md$,
 ARRAY['telecaller','leads','targets'], true)

on conflict do nothing;
