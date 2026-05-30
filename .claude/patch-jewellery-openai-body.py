#!/usr/bin/env python3
"""
patch-jewellery-openai-body.py
==============================
Rewrites the `jsonBody` of the two OpenAI Prompt Builder nodes
in the jewellery n8n workflow so dynamic prompt_context values
(global_jewellery_rules, realism_rules, etc.) are JSON-escaped
safely.

ROOT CAUSE
----------
Previous body was a JSON literal with raw {{$json.prompt_context.X}}
interpolations. Multi-line / quote-bearing values broke the JSON.
Result: "JSON parameter needs to be valid JSON" → workflow lands
on the error branch → Mark Single Failed → client sees the alert
"Generation failed in n8n. Credits refunded.".

FIX
---
Wrap the entire body in a single `={{ JSON.stringify({...}) }}`
expression that builds the object with JS template literals.
JSON.stringify handles every escape automatically. The schema
sent to OpenAI is byte-identical to the old one — only the
construction is changed.
"""

import json
from pathlib import Path

IN = Path(r"C:\Users\User\Downloads\Jewellery Ai Studio 80%.json")
OUT = Path(
    r"C:\Users\User\Downloads\Jewellery Ai Studio 80% PATCHED (openai-body-fix).json"
)


# ────────────────────────────────────────────────────────────
# Shared system message (identical in Single + Bulk nodes).
# Returned as a JS expression that joins lines with newlines.
# Each `c.X` lookup is safely escaped by the surrounding
# JSON.stringify wrapper.
# ────────────────────────────────────────────────────────────
SYSTEM_CONTENT_EXPR = """[
        'You are AgentForge Jewellery AI Studio prompt director. Create a premium FAL image-edit prompt strictly from the user\\'s selected frontend options.',
        '',
        '═══ GLOBAL JEWELLERY LOCK RULES (MUST OBEY FIRST) ═══',
        c.global_jewellery_rules || '',
        '',
        '═══ REALISM RULES ═══',
        c.realism_rules || '',
        '',
        '═══ JEWELLERY CATEGORY LOGIC ═══',
        c.jewellery_category_rules || '',
        '',
        '═══ BULK VARIATION RULES, IF PRESENT ═══',
        c.bulk_variation_rules || '',
        '',
        '═══ FRONTEND HARD RULES, IF PRESENT ═══',
        c.style_directives || '',
        '═══════════════════════════════════════════════════════════════',
        '',
        'Do not ignore selected fields. Preserve the source jewellery design exactly: shape, stones, metal tone, engraving, pattern, gemstone layout, prongs, chain, polish and all visible details. Never redesign jewellery. Never make jewellery oversized or undersized. If a model reference is provided, preserve the person\\'s identity. If model type says No Model, Product Only, Macro Detail, or Luxury Flat Lay, do not include human body parts unless explicitly required by the selected model type. Follow output_type, shoot_style, model_type, pose, camera_angle, accessories, face_expression, output_size, output_quality, jewellery_notes, brand details and custom_instruction. Keep image premium, realistic, luxury campaign quality, sharp and clean. No logos, badges, monograms, watermark, random letters, fake text, SKU, barcode, serial numbers, or typography graphics except small plain brand text in bottom-left only if brand details are provided. Return ONLY valid JSON with keys: final_prompt, negative_prompt, title_hint.'
      ].join('\\n')"""


def user_content_expr(is_bulk: bool) -> str:
    """User-message content. Bulk variant adds the BULK preamble +
    BULK VARIATION RULES + slightly different closing rules."""

    intro = (
        "'This is one item from a BULK batch. Create final FAL image-edit prompt using exactly these selected settings:'"
        if is_bulk
        else "'Create final FAL image-edit prompt using exactly these selected settings:'"
    )

    bulk_variation_block = (
        """
        'BULK VARIATION RULES:',
        c.bulk_variation_rules || '',
        '',"""
        if is_bulk
        else ""
    )

    closing_rules = (
        "'Rules: Jewellery lock rules override everything else. Bulk variation can change model, pose, crop and background only; it must never change jewellery. final_prompt must include selected frontend options if not empty. Preserve jewellery exactly. Keep jewellery realistic in actual size and correct body placement. Do not add SKU, barcode, product code, serial number, random text, watermark or logo. final_prompt 220-420 words. negative_prompt comma-separated. Return only valid JSON.'"
        if is_bulk
        else "'Rules: Jewellery lock rules override everything else. final_prompt must include selected frontend options if not empty. Preserve jewellery exactly. Keep jewellery realistic in actual size and correct body placement. Do not add SKU, barcode, product code, serial number, random text, watermark or logo. final_prompt 220-420 words. negative_prompt comma-separated. Return only valid JSON.'"
    )

    return f"""[
        {intro},
        '',
        'GLOBAL JEWELLERY LOCK RULES:',
        c.global_jewellery_rules || '',
        '',
        'REALISM RULES:',
        c.realism_rules || '',
        '',
        'JEWELLERY CATEGORY RULES:',
        c.jewellery_category_rules || '',
        '',{bulk_variation_block}
        'FRONTEND HARD RULES:',
        c.style_directives || '',
        '',
        'SOURCE JEWELLERY IMAGE: ' + (c.source_image_url || ''),
        'JEWELLERY TYPE: ' + (c.jewellery_type || ''),
        'JEWELLERY PROTECTION NOTES: ' + (c.jewellery_notes || ''),
        'OUTPUT TYPE / CREATIVE DIRECTION: ' + (c.output_type || ''),
        'SHOOT STYLE / MODEL LOOK: ' + (c.shoot_style || ''),
        'SHOOT STYLE DETAIL: ' + (c.shoot_style_detail || ''),
        'MODEL REFERENCE IMAGE: ' + (c.model_image_url || ''),
        'HAS UPLOADED MODEL: ' + String(c.has_uploaded_model || false),
        'MODEL TYPE: ' + (c.model_type || ''),
        'MODEL TYPE DETAIL: ' + (c.model_type_detail || ''),
        'POSE: ' + (c.pose || ''),
        'POSE DETAIL: ' + (c.pose_detail || ''),
        'CAMERA ANGLE: ' + (c.camera_angle || ''),
        'CAMERA ANGLE DETAIL: ' + (c.camera_angle_detail || ''),
        'MODEL LOOK: ' + (c.model_look || ''),
        'FACE EXPRESSION: ' + (c.face_expression || ''),
        'FACE EXPRESSION DETAIL: ' + (c.face_expression_detail || ''),
        'MODEL NOTES: ' + (c.model_notes || ''),
        'ACCESSORIES / PROPS: ' + (c.accessories || ''),
        'ACCESSORIES DETAIL: ' + (c.accessories_detail || ''),
        'OUTPUT SIZE: ' + (c.output_size || ''),
        'OUTPUT QUALITY: ' + (c.output_quality || ''),
        'BRAND TEXT DETAILS: ' + (c.brand_details || ''),
        'CUSTOM INSTRUCTION: ' + (c.custom_instruction || ''),
        'NEGATIVE PROMPT BASE: ' + (c.negative_prompt || ''),
        '',
        {closing_rules}
      ].join('\\n')"""


def build_body(is_bulk: bool) -> str:
    """Return the full `={{ JSON.stringify({...}) }}` expression
    that becomes the node's jsonBody."""
    system_content = SYSTEM_CONTENT_EXPR
    user_content = user_content_expr(is_bulk)

    # The single n8n expression. Everything between =`{{` and `}}`
    # is JavaScript evaluated by the workflow runtime.
    return (
        "={{ (() => { const c = $json.prompt_context || {}; return JSON.stringify({\n"
        '  model: "gpt-4.1-mini",\n'
        "  max_tokens: 1800,\n"
        "  temperature: 0.35,\n"
        '  response_format: { type: "json_object" },\n'
        "  messages: [\n"
        '    { role: "system", content: ' + system_content + " },\n"
        '    { role: "user",   content: ' + user_content + " }\n"
        "  ]\n"
        "}); })() }}"
    )


def main():
    data = json.loads(IN.read_text(encoding="utf-8"))
    data["name"] = (
        data.get("name", "") + " (openai-body-fix)"
    )

    patched = []
    for node in data["nodes"]:
        name = node.get("name", "")
        if name == "Single OpenAI Prompt Builder1":
            node["parameters"]["jsonBody"] = build_body(is_bulk=False)
            patched.append(name)
        elif name == "Bulk OpenAI Prompt Builder1":
            node["parameters"]["jsonBody"] = build_body(is_bulk=True)
            patched.append(name)

    OUT.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"Patched nodes : {patched}")
    print(f"Output file   : {OUT}")


if __name__ == "__main__":
    main()
