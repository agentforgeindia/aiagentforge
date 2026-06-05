-- ============================================================
-- AgentForge — Customer FAQ Book → Knowledge Base
-- Run this in Supabase SQL Editor.
-- ============================================================

insert into public.kb_articles (category, title, content, tags, is_pinned) values

('training', 'Customer FAQ Book', $md$Common customer questions aur ready answers. Caller in answers ko apne shabdon mein bole.

## General
**Q: AgentForge AI kya hai?**
A: AI visual platform — product/design photo upload karke professional catalogue, photoshoot-style images aur marketing creatives generate karte hain, bina photographer/model/studio ke.

**Q: AI image kitni der mein generate hoti hai?**
A: Usually few minutes — queue aur quality selection par depend karta hai (~30-60 sec average).

**Q: Free trial hai?**
A: Signup par free credits milte hain (100 credits). Customer apna test generation kar sakta hai.

**Q: Mobile se use kar sakte hain?**
A: Yes, bilkul.

**Q: Output HD hota hai?**
A: Yes — HD, watermark-free, commercial use allowed.

## Use Cases
**Q: Photoshoot ki jagah use kar sakte hain?**
A: Many businesses catalogue updates, social media creatives aur marketing visuals ke liye use karte hain — repeated photoshoots ki dependency kam hoti hai.

**Q: Textile design upload kar sakte hain?**
A: Yes — fabric/design upload karke model mockup + catalogue image milti hai.

**Q: Jewellery upload kar sakte hain?**
A: Yes — product photo se bridal shoot, luxury catalogue aur campaign image.

**Q: Ecommerce product ke liye kaam karta hai?**
A: Yes — product photo se ecommerce listing, Instagram creative aur product ad.

## Pricing & Credits
**Q: Price kya hai?**
A: Plans ₹1,999 se start hote hain. Starter ₹1,999 / Pro Creator ₹9,999 / Empire ₹39,999.

**Q: Credits kya hote hain?**
A: Credits = generation currency. 15 credits = 1 HD image. Plan ke saath credits milte hain, khatam hone par top-up.

**Q: Kaunsa plan lena chahiye?**
A: Business usage par depend — pehle demo + trial, phir usage ke hisaab se suggest karenge.

**Q: Payment kaise hota hai?**
A: Website par secure payment (Razorpay/UPI/Card). Team guide kar sakti hai.

## Quality / Trust
**Q: AI quality achhi hai?**
A: Isliye pehle demo + trial suggest karte hain — apni image se output check karke decide karein.

**Q: Data safe hai?**
A: Yes — secure platform, images apke account mein.

## Onboarding
**Q: Kaise shuru karein?**
A: 1) Signup (free credits) 2) Product/design photo upload 3) Style select 4) Generate 5) Download. Team first generation guide kar sakti hai.$md$,
 ARRAY['faq','training','customer'], true)

on conflict do nothing;
