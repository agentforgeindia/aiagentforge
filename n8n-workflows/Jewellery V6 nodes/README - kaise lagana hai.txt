JEWELLERY AI STUDIO V6 — kya badla aur kaise lagana hai
=========================================================

Sirf 5 nodes badle hain (v5 se). Baaki sab (Webhook, FAL, Wait, Supabase upload/update, Mark Failed) same.

TARIKA A — poora import:
  1. n8n me v5 workflow ka backup Download kar lo.
  2. Import from File -> "Jewellery Ai Studio - V6.json".
  3. Webhook Trigger1 ka path wahi rakho jo v5 me hai (site ka jewellery webhook isi pe jaata hai).
     v5 ko Inactive karo, V6 ko Active.

TARIKA B — v5 me hi copy-paste (webhook same rahega):
  1. "Validate And Normalize1"        -> file 1 ka code paste.
  2. "Single Build Prompt Context1"   -> file 2 ka code paste.
  3. "Bulk Build Prompt Context1"     -> file 3 ka code paste.
  4. "Single OpenAI Prompt Builder1"  -> Body (JSON) me file 4 ka poora text paste (={{ ... }} expression).
  5. "Bulk OpenAI Prompt Builder1"    -> Body (JSON) me file 5 ka poora text paste.
     Headers / Authorization mat chhedna.
  6. Save -> Active.

TEST (har ek ki 1-2 image):
  - Studio Professional + Female + Necklace (Velvet Bust — Maroon)
  - Studio Professional + No Model + Ring (Emerald Marble Cube) + Velvet Box
  - Outdoor Premium + Male + Kada (Royal Palace)
  - White BG + Female + Hathphool
  - Upload Your Scene + Upload Your Model
