PRODUCTOGRAPHY v4 — kya badla aur kaise lagana hai
======================================================

Sirf 5 nodes badle hain. Baaki sab nodes (Webhook, Credits, FAL, Wait, Supabase, Refund) same hain.

TARIKA A (aasaan) — poora workflow import:
  1. n8n me "Productography - Final v3.1 Facefix" workflow kholo.
  2. Upar-right ... menu -> Download karke backup rakh lo.
  3. Naya workflow banao -> ... menu -> "Import from File" -> "Productography - Final v4 Reference Boards.json" chuno.
  4. "Webhook Trigger" node me path wahi rakho jo v3.1 me tha (site ka N8N_PRODUCTOGRAPHY_WEBHOOK_URL isi pe jaata hai).
     Dono workflow ek hi path pe active nahi ho sakte — pehle v3.1 ko Inactive karo, phir v4 ko Active.
  5. Save.

TARIKA B — purane v3.1 me hi copy-paste (webhook URL bilkul same rahega):
  1. "Validate And Normalize" Code node  -> saara code hatao, file "1 - ..." ka code paste karo.
  2. "Single Build Prompt Context" Code node -> file "2 - ..." ka code paste karo.
  3. "Bulk Build Prompt Context" Code node   -> file "3 - ..." ka code paste karo.
  4. "Single OpenAI Prompt Builder" aur "Bulk OpenAI Prompt Builder" (HTTP Request) ->
     Body (JSON) field me purana saara text hatao aur file "4 - ..." ki EK line paste karo:
         ={{ JSON.stringify($json.openai_body) }}
     (Field Expression mode me hona chahiye. Headers / Authorization mat chhedna.)
  5. Save -> Active.

TEST:
  Har shoot style (Luxury Studio, Outdoor Lifestyle, Ecommerce White BG, Upload Your Scene) ki
  2-3 images banao — No Model aur Model dono ke saath. n8n Executions me
  "Single Build Prompt Context" ka output kholo -> "art_direction_brief" me dikhega ki
  kaunsa set / display / model cue gaya.
