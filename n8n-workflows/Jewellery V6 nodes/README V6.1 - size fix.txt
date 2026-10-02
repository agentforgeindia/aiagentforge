JEWELLERY V6.1 — jewellery size / placement fix
================================================
Problem: jewellery model pe bada (oversized) ban rha tha, high-neck kapde ke upar baith rha tha.
Fix: sirf 2 nodes badle — "Single Parse Prompt JSON1" aur "Bulk Parse Prompt JSON1".
Inme ek "JEWELLERY EXACT DESIGN & TRUE SIZE LOCK" block add hua hai jo final prompt ke
upar (modesty ke baad) aur end me "FINAL CHECK" line lagata hai. Ye GPT rewrite nahi karta,
seedha FAL ko jaata hai. Type ke hisaab se size + placement + neckline rules lagte hain
(Set / Necklace / Choker / Earrings / Ring / Bangles-Kada / Tikka / Nath / Hathphool / Payal ...).

KAISE LAGANA HAI (V6 me copy-paste — sabse easy):
  1. "Single Parse Prompt JSON1" -> file 6 ka poora code paste.
  2. "Bulk Parse Prompt JSON1"   -> file 7 ka poora code paste.
  3. Save -> Publish.
(Ya poora "Jewellery Ai Studio - V6.1.json" import karo — par usme FAL key purani hai,
 to import ke baad 6 FAL nodes me nayi key daalni padegi. Isliye copy-paste better hai.)
