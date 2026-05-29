#!/usr/bin/env python3
"""
patch-n8n-workflow.py
=====================
Reads the user's exported n8n jewellery workflow JSON and applies the
following changes:

1. Validate And Normalize1 — extract `style_directives` from incoming body.
2. Single Build Prompt Context1 / Bulk Build Prompt Context1 —
     • Remove "Lifestyle Campaign" from SHOOT_STYLE_GUIDE.
     • Update guide copy for Luxury Studio, White Catalogue, Bridal
       Editorial, Indian Model, Bridal Look, Luxury Editorial,
       Minimal Modern.
     • Remove "Neck Tilt" and "Detail Close-up" from POSE_GUIDE.
     • Update guide copy for Auto Pose, Front Pose, Side Pose,
       Bust Portrait, Hand Pose, Wrist Detail, Neck Close-up,
       Touching Necklace, Ear Close-up.
     • Remove "45° Angle" from CAMERA_ANGLE_GUIDE.
     • Add `style_directives` into prompt_context so the OpenAI
       prompt builder can consume it.
3. Single / Bulk OpenAI Prompt Builder1 —
     • Update SYSTEM message to treat style_directives as HARD RULES
       at the top.
     • Update USER message to include the style_directives field.
"""

import json
import sys
from pathlib import Path

IN = Path(r"C:\Users\User\Downloads\Jewellery Ai Studio Final 2.1 Working.json")
OUT = Path(r"C:\Users\User\Downloads\Jewellery Ai Studio Final 2.2 PATCHED.json")

# ─────────────────────────────────────────────────────────────
# New guide content
# ─────────────────────────────────────────────────────────────

SHOOT_STYLE_GUIDE = {
    'Luxury Studio': (
        'Indian female model in a high-end professional photography studio wearing ONLY the uploaded jewellery. '
        'Premium softbox + key + rim light setup, dark velvet or gradient grey backdrop. '
        'Model styled like a luxury brand muse, subtle elegant makeup. '
        'Jewellery is hero — lit for metal reflections and stone brilliance. '
        'Museum-quality showcase feel. NO extra jewellery on the model unless user accessories selection adds it.'
    ),
    'White Catalogue': (
        'YOUNG Indian female model wearing ONLY the uploaded jewellery against a PURE WHITE seamless background. '
        'Even shadowless soft ecommerce lighting (Amazon/Flipkart grade). '
        'Clean natural makeup, neutral plain outfit (white/cream). '
        'Jewellery clearly visible and centered. Ultra clean. '
        'NO extra jewellery, no props beyond the uploaded piece.'
    ),
    'Bridal Editorial': (
        'Indian BRIDE wearing ONLY the uploaded jewellery, with chosen pose / accessory selection applied. '
        'Full traditional bridal styling: heavy lehenga/saree, dupatta drape, '
        'bridal makeup with kajal and bold lips, mehndi on hands. '
        'Rich warm gold tones, ornate silk fabric backdrop, candlelight + softbox mix. '
        'Vogue Bridal magazine wedding-rich feel. The bride wears ONLY the uploaded piece — no extra jewellery.'
    ),
    'Macro Detail': (
        'EXTREME HD CLOSE-UP of the uploaded jewellery only — no model, product-only. '
        'Ring-light micro reflections in every stone facet, shallow depth of field, '
        'gemstone-first composition. Pure product showcase, focus on diamond / kundan / stone detail.'
    ),
    # Lifestyle Campaign intentionally removed.
    'Indian Model': (
        'CHOOSE THE MODEL ARCHETYPE BASED ON THE JEWELLERY TYPE — '
        'do NOT default to the same saree-clad bridal model for every piece. '
        'Bridal / heavy jewellery (mangalsutra, heavy necklace, bridal set, tikka) → Indian bride with traditional bridal attire. '
        'Daily-wear or lightweight pieces (pendant, light necklace, daily ring, small earrings) → '
        'young everyday Indian woman in modern casual or office attire. '
        'Statement / cocktail pieces → modern Indian woman in fusion/Indo-western styling. '
        'Warm honey-tan Indian skin tone, natural Indian facial features, soft glow natural makeup. '
        'The model wears ONLY the uploaded jewellery.'
    ),
    'Bridal Look': (
        'Indian bride in HEAVY bridal styling — embellished lehenga, dupatta on head, subtle mehndi on hands, '
        'traditional bridal makeup (bold red/maroon lips, dark kajal). '
        'Pose must match the user-selected pose option. '
        'Wedding-photography feel with warm golden-hour or candlelight tones. '
        'Bride wears ONLY the uploaded jewellery.'
    ),
    'Luxury Editorial': (
        'Indian female model in MODERN WESTERN fashion — cocktail dress, evening gown, '
        'structured blazer top, or designer western couture — that elevates the uploaded jewellery. '
        'Dramatic studio shadow play (chiaroscuro), polished cinematic styling. '
        'Designer-magazine cover feel (Harper Bazaar / Vogue India editorial). '
        'Model wears ONLY the uploaded jewellery — no other jewellery on the body.'
    ),
    'Minimal Modern': (
        'ROYAL-styled Indian model in luxurious ROYAL attire — '
        'anarkali, sharara, embellished royal evening gown, regal lehenga, or palace-couture outfit. '
        'Soft regal lighting, clean uncluttered backdrop with one subtle royal prop (chair / drape / mirror). '
        'Confident royal posture. Model wears ONLY the uploaded jewellery.'
    ),
}

MODEL_TYPE_GUIDE = {
    'No Model': 'Product-only — no human, no hand, no body part. Pure jewellery composition on the chosen surface or prop.',
    'Hand Model': 'Hand archetype MATCHED to the jewellery — feminine jewellery (most rings, female rings) uses an elegant feminine Indian hand with natural manicured nails; masculine jewellery (men\'s rings, kada-style) uses a refined masculine Indian hand. Hand positioned to showcase the jewellery as visual hero.',
    'Couple Hands': 'Two hands together — one feminine (with the jewellery), one masculine. Engagement / wedding feel. Subtle warm tone.',
    'Female Model': 'Indian female adult model — visible from waist or chest up. Jewellery clearly displayed and styled around.',
    'Bridal Model': 'Indian bride in full bridal styling — dupatta, traditional outfit, bridal makeup, regal upright pose.',
    'Luxury Flat Lay': 'Top-down flat-lay composition on a premium surface (velvet / silk / marble). Jewellery is the hero with curated supporting props.',
    'Macro Detail': 'Extreme macro zoom on the jewellery only — focus on a single stone facet, prong, or engraving. No model, no body part.',
    'Ear Close-up': 'Extreme close-up of one ear (side profile) wearing the earring — focus on earring sparkle and ear-to-jewellery contact.',
    'Bust Portrait': 'Upper-half body portrait — face plus neck/upper chest — best for face/neck jewellery. Elegant composed pose.',
    'Half Body': 'Half model — waist-up lifestyle shot showing styling around the jewellery.',
    'Full Body': 'Full model — editorial full-body shot with jewellery as the focal accessory.',
    'Neck Focus': 'Tight crop on neckline showing the necklace draped naturally.',
    'Neck Close-up': 'FEMALE neck close-up shot — focus on necklace. No face needed; jewellery is hero.',
    'Wrist Close-up': 'Tight wrist crop with bracelet / kada as hero — wrist gender MATCHED to the jewellery (male wrist for male bracelets, female for female).',
    'Lifestyle Hand': 'Natural hand pose in lifestyle context (holding coffee cup, resting on textile, etc.). Hand gender matched to jewellery.',
    'Editorial Scene': 'Staged scene with model + jewellery in an editorial context (palace, garden, studio set).',
}

POSE_GUIDE = {
    'Auto Pose': 'RANDOM AI pick — choose a fresh, natural pose for this jewellery type each generation. Vary across generations.',
    'Front Pose': 'Upper-body front-facing shot — face + neck/shoulders visible, jewellery clearly displayed.',
    'Side Pose': '45-degree model turn — three-quarter side angle that adds dimension to the shot.',
    'Half Body': 'Half model — waist-up framing with natural shoulder positioning.',
    'Full Body': 'Full model — full standing pose with editorial elegance.',
    'Bust Portrait': 'Upper-half body — model shown from waist/chest up. Best used for neck and face jewellery (necklace, earrings).',
    'Hand Pose': 'Hand pose with gender MATCHED to the jewellery type. Male rings → masculine hand. Female rings/bracelets → feminine hand. Hand extended elegantly to showcase the piece.',
    'Wrist Detail': 'Wrist-only crop. Wrist gender MATCHED to the jewellery (male bracelet → male wrist, female bracelet → female wrist).',
    'Couple Hands': 'Two hands in engagement-style positioning — one feminine (with the jewellery), one masculine. Romantic engagement feel.',
    'Neck Close-up': 'Female neck close-up shot — necklace is the hero. Jewellery focus, minimal face.',
    'Touching Necklace': 'Model wearing the necklace, with one hand naturally raised to touch / hold it. Intimate, premium-campaign feel.',
    'Ear Close-up': 'Side pose shot — earring clearly visible on the ear in profile. Sharp focus on the earring.',
    # Neck Tilt removed — handled by Touching Necklace + Bust Portrait combo.
    # Detail Close-up removed — Macro Detail handles this.
}

ACCESSORY_GUIDE = {
    'No Accessories': (
        'STRICT — render ONLY the uploaded jewellery piece on the model. '
        'NO display tray with other jewellery beside the model. '
        'NO extra jewellery scattered around. NO decorative props beyond the chosen style backdrop. '
        'The model is wearing ONLY the uploaded piece — nothing else.'
    ),
    'Flat Lay': 'Top-down flat-lay arrangement on a premium fabric or surface — ONLY the uploaded jewellery is shown, no extra pieces.',
    'Velvet Box': 'Jewellery resting on or beside an open black or maroon velvet jewellery box — luxury showroom feel. ONLY the uploaded piece is present.',
    'Marble Surface': 'Placed on polished white-and-grey veined marble with subtle reflection. ONLY the uploaded jewellery.',
    'Silk Drape': 'Cascading silk fabric (cream, ivory or jewel-tone) as backdrop or under-layer. ONLY the uploaded jewellery.',
    'Rose Petals': 'Scattered fresh rose petals as romantic accent — sparse and tasteful. ONLY the uploaded jewellery, no extra pieces.',
    'Marigold + Diya': 'Marigold flowers and a small lit diya nearby — temple / festival jewellery context. ONLY the uploaded jewellery.',
    'Diamond Sparkle Set': 'Loose crystals and tiny mirror shards catching light — adds sparkle drama around the piece. ONLY the uploaded jewellery.',
    'Pearl String Decor': 'Strands of pearls draped softly around the jewellery as accent. ONLY the uploaded jewellery as the main piece.',
    'Wooden Antique Tray': 'Placed on a vintage carved wooden tray — heritage / antique jewellery context. ONLY the uploaded jewellery on the tray.',
}

CAMERA_ANGLE_GUIDE = {
    'Auto Angle': 'Choose the most flattering angle for this jewellery type',
    'Eye Level': 'Straight-on eye-level shot, parallel to subject',
    # 45° Angle removed
    'Top Down': 'Directly overhead flat-lay perspective',
    'Side Profile': 'Pure side view — best for earrings and pendants',
}

FACE_GUIDE = {
    'Soft Smile': 'Gentle warm smile, eyes relaxed',
    'Confident': 'Confident closed-mouth expression, direct gaze',
    'Serious': 'Serious editorial expression, eyes off-camera',
    'Royal': 'Regal bridal expression, chin slightly raised, dignified',
    'Natural': 'Candid natural expression, no posing',
}


def js_object_literal(obj: dict) -> str:
    """Render a Python dict as a JavaScript object literal with single-quoted keys/values."""
    items = []
    for k, v in obj.items():
        safe_v = v.replace("\\", "\\\\").replace("'", "\\'")
        items.append(f"  '{k}': '{safe_v}'")
    return "{\n" + ",\n".join(items) + "\n}"


# ─────────────────────────────────────────────────────────────
# Build the new Build Prompt Context jsCode (Single AND Bulk share this body
# with the only difference being how `p` is obtained).
# ─────────────────────────────────────────────────────────────

def build_context_jscode(source_p: str) -> str:
    return f"""// ============================================================
// BUILD PROMPT CONTEXT v3 — guides aligned with frontend redesign
// + STYLE_DIRECTIVES (hidden hard rules from the frontend).
// ============================================================
{source_p}

const SHOOT_STYLE_GUIDE = {js_object_literal(SHOOT_STYLE_GUIDE)};

const MODEL_TYPE_GUIDE = {js_object_literal(MODEL_TYPE_GUIDE)};

const POSE_GUIDE = {js_object_literal(POSE_GUIDE)};

const ACCESSORY_GUIDE = {js_object_literal(ACCESSORY_GUIDE)};

const CAMERA_ANGLE_GUIDE = {js_object_literal(CAMERA_ANGLE_GUIDE)};

const FACE_GUIDE = {js_object_literal(FACE_GUIDE)};

const pick = (tbl, key) => tbl[key] || `"${{key}}"`;

const brand = p.brand_details || {{}};
const brandLine = [
  brand.company_name ? `Company: ${{brand.company_name}}` : "",
  brand.website      ? `Website: ${{brand.website}}`      : "",
  brand.phone        ? `Phone/WhatsApp: ${{brand.phone}}` : "",
  brand.address      ? `Address: ${{brand.address}}`      : ""
].filter(Boolean).join(" | ");

const moreJewellery = Array.isArray(p.more_jewellery) && p.more_jewellery.length
  ? p.more_jewellery.join(", ")
  : "";
const jewelleryLabel = p.custom_jewellery
  ? p.custom_jewellery
  : (moreJewellery ? `${{p.jewellery_type}} (${{moreJewellery}})` : p.jewellery_type);

// Pull the hidden style_directives passed from the frontend.
// This is a single string of pipe-separated HARD RULES the OpenAI
// prompt director must obey above all else.
const styleDirectives = String(p.style_directives || "").trim();

return {{
  json: {{
    ...p,
    prompt_context: {{
      source_image_url:   p.source_image_url,
      model_image_url:    p.model_image_url || "",
      has_uploaded_model: Boolean(p.has_uploaded_model),
      jewellery_type:     jewelleryLabel,
      jewellery_notes:    p.jewellery_notes || "",

      shoot_style:        p.shoot_style || "Luxury Studio",
      output_type:        p.output_type || "Luxury Studio",
      model_type:         p.model_type || "No Model",
      pose:               p.pose || "Auto Pose",
      model_look:         p.model_look || "Indian Model",
      face_expression:    p.face_expression || "Soft Smile",
      accessories:        p.accessories || "No Accessories",
      camera_angle:       p.camera_angle || "Auto Angle",
      output_size:        p.output_size || "Square 1080x1080",
      output_quality:     p.output_quality || "Premium",
      model_notes:        p.model_notes || "",

      shoot_style_detail:     pick(SHOOT_STYLE_GUIDE, p.shoot_style),
      model_type_detail:      pick(MODEL_TYPE_GUIDE, p.model_type),
      pose_detail:            pick(POSE_GUIDE, p.pose),
      face_expression_detail: pick(FACE_GUIDE, p.face_expression),
      camera_angle_detail:    pick(CAMERA_ANGLE_GUIDE, p.camera_angle),
      accessories_detail:     pick(ACCESSORY_GUIDE, p.accessories),

      // HARD RULES from the frontend — must dominate the final prompt.
      style_directives:       styleDirectives,
      has_style_directives:   Boolean(styleDirectives),

      brand_details:         brandLine,
      brand_logo_url:        brand.logo_url || "",
      has_brand_text:        Boolean(p.has_brand_text),
      reserve_bottom_strip:  Boolean(p.reserve_bottom_strip),
      af_watermark:          Boolean(p.af_watermark),
      reserve_second_corner: Boolean(p.reserve_second_corner ?? p.af_watermark),

      custom_instruction:    p.custom_instruction || ""
    }}
  }}
}};
"""


SYSTEM_PROMPT_NEW = (
    "You are AgentForge Jewellery AI Studio prompt director. "
    "Create a premium FAL image-edit prompt strictly from the user's selected frontend options. "
    "\\n\\n"
    "═══ HARD RULES (MUST OBEY, override all other instructions) ═══\\n"
    "{{$json.prompt_context.style_directives}}\\n"
    "═══════════════════════════════════════════════════════════════\\n\\n"
    "Do not ignore selected fields. Preserve the source jewellery design exactly: "
    "shape, stones, metal tone, engraving, pattern, gemstone layout, prongs, chain, polish and all visible details. "
    "Never redesign jewellery. If a model reference is provided, preserve the person's identity. "
    "If model type says No Model, Product Only, or Flat Lay, do not include human body parts. "
    "Follow output_type, shoot_style, model_type, pose, camera_angle, accessories, face_expression, "
    "output_size, output_quality, jewellery_notes, brand details and custom_instruction. "
    "Keep image premium, realistic, luxury campaign quality, sharp and clean. "
    "No logos, badges, monograms, watermark, random letters, fake text, SKU, barcode, serial numbers, or typography graphics "
    "except small plain brand text in bottom-left only if brand details are provided. "
    "Return ONLY valid JSON with keys: final_prompt, negative_prompt, title_hint."
)

USER_PROMPT_TEMPLATE = (
    "Create final FAL image-edit prompt using exactly these selected settings:\\n\\n"
    "HARD RULES (must dominate the prompt):\\n"
    "{{$json.prompt_context.style_directives}}\\n\\n"
    "SOURCE JEWELLERY IMAGE: {{$json.prompt_context.source_image_url}}\\n"
    "JEWELLERY TYPE: {{$json.prompt_context.jewellery_type}}\\n"
    "JEWELLERY PROTECTION NOTES: {{$json.prompt_context.jewellery_notes}}\\n"
    "OUTPUT TYPE / CREATIVE DIRECTION: {{$json.prompt_context.output_type}}\\n"
    "SHOOT STYLE / MODEL LOOK: {{$json.prompt_context.shoot_style}}\\n"
    "SHOOT STYLE DETAIL: {{$json.prompt_context.shoot_style_detail}}\\n"
    "MODEL REFERENCE IMAGE: {{$json.prompt_context.model_image_url}}\\n"
    "HAS UPLOADED MODEL: {{$json.prompt_context.has_uploaded_model}}\\n"
    "MODEL TYPE: {{$json.prompt_context.model_type}}\\n"
    "MODEL TYPE DETAIL: {{$json.prompt_context.model_type_detail}}\\n"
    "POSE: {{$json.prompt_context.pose}}\\n"
    "POSE DETAIL: {{$json.prompt_context.pose_detail}}\\n"
    "CAMERA ANGLE: {{$json.prompt_context.camera_angle}}\\n"
    "CAMERA ANGLE DETAIL: {{$json.prompt_context.camera_angle_detail}}\\n"
    "MODEL LOOK: {{$json.prompt_context.model_look}}\\n"
    "FACE EXPRESSION: {{$json.prompt_context.face_expression}}\\n"
    "FACE EXPRESSION DETAIL: {{$json.prompt_context.face_expression_detail}}\\n"
    "MODEL NOTES: {{$json.prompt_context.model_notes}}\\n"
    "ACCESSORIES / PROPS: {{$json.prompt_context.accessories}}\\n"
    "ACCESSORIES DETAIL: {{$json.prompt_context.accessories_detail}}\\n"
    "OUTPUT SIZE: {{$json.prompt_context.output_size}}\\n"
    "OUTPUT QUALITY: {{$json.prompt_context.output_quality}}\\n"
    "BRAND TEXT DETAILS: {{$json.prompt_context.brand_details}}\\n"
    "CUSTOM INSTRUCTION: {{$json.prompt_context.custom_instruction}}\\n\\n"
    "Rules: HARD RULES at the top override everything else. final_prompt must include selected frontend options if not empty. "
    "Preserve jewellery exactly. Do not add SKU, barcode, product code, serial number, random text, watermark or logo. "
    "final_prompt 220-420 words. negative_prompt comma-separated. Return only valid JSON."
)


def build_openai_jsonbody(user_prefix: str = "") -> str:
    """Build the jsonBody string for the OpenAI HTTP node (n8n expression)."""
    user_text = user_prefix + USER_PROMPT_TEMPLATE
    body = {
        "model": "gpt-4.1-mini",
        "max_tokens": 1800,
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_NEW},
            {"role": "user", "content": user_text},
        ],
    }
    return "=" + json.dumps(body, ensure_ascii=False)


# ─────────────────────────────────────────────────────────────
# Apply edits
# ─────────────────────────────────────────────────────────────

def patch_validate_node(code: str) -> str:
    """Add `style_directives` extraction to the existing Validate node."""
    insert_after = '  jewellery_notes:   clean(body.jewellery_notes || body.jewellery_details),'
    addition = (
        '\n'
        '  // Hidden hard rules from the frontend — pipe-separated string.\n'
        '  style_directives:  String(body.style_directives || "").trim(),'
    )
    if 'style_directives' in code:
        return code  # already patched
    return code.replace(insert_after, insert_after + addition, 1)


def main():
    data = json.loads(IN.read_text(encoding="utf-8"))

    # Bump version label so n8n shows a new save.
    data["name"] = "Jewellery Ai Studio Final 2.2 (style_directives + redesigned guides)"

    for node in data["nodes"]:
        name = node.get("name", "")
        params = node.get("parameters", {})

        # ─── Validate And Normalize1 — add style_directives ───
        if name == "Validate And Normalize1":
            params["jsCode"] = patch_validate_node(params["jsCode"])

        # ─── Single Build Prompt Context1 ───
        if name == "Single Build Prompt Context1":
            params["jsCode"] = build_context_jscode(
                'const p = $json.payload || $(\'Validate And Normalize1\').first().json.payload;'
            )

        # ─── Bulk Build Prompt Context1 ───
        if name == "Bulk Build Prompt Context1":
            params["jsCode"] = build_context_jscode(
                "const p = $('Bulk Explode Items1').item.json;"
            )

        # ─── Single OpenAI Prompt Builder1 ───
        if name == "Single OpenAI Prompt Builder1":
            params["jsonBody"] = build_openai_jsonbody()

        # ─── Bulk OpenAI Prompt Builder1 ───
        if name == "Bulk OpenAI Prompt Builder1":
            params["jsonBody"] = build_openai_jsonbody(
                user_prefix="(This is one item from a BULK batch.) "
            )

    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Patched workflow written to:\n  {OUT}")


if __name__ == "__main__":
    main()
