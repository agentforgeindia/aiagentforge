"""
Patch the jewellery PATCHED workflow to enforce YOUNG + jewellery-type-matched
models on these 4 shoot styles:
  - Luxury Studio
  - White Catalogue
  - Bridal Editorial
  - Minimal Modern

Updates the SHOOT_STYLE_GUIDE object inside both:
  - Single Build Prompt Context1
  - Bulk Build Prompt Context1
"""

import json
import re
from pathlib import Path

SRC = Path(r"C:\Users\User\Downloads\Jewellery Ai Studio Final 2.2 PATCHED.json")
DST = Path(r"C:\Users\User\Downloads\Jewellery Ai Studio Final 2.3 PATCHED.json")

# New shoot style guide entries — all 4 emphasize YOUNG + match jewellery type.
NEW_ENTRIES = {
    "Luxury Studio": (
        "YOUNG Indian female model (20-28 yr old) inside a high-end professional "
        "photography studio wearing the jewellery. MATCH MODEL ARCHETYPE TO "
        "JEWELLERY TYPE — bridal/heavy pieces => young bride styling; "
        "daily-wear pendants/light necklaces => young everyday Indian woman; "
        "festive => young festive-styled woman. Premium softbox + key + rim "
        "light, dark velvet or gradient grey backdrop. Subtle elegant makeup. "
        "Jewellery is hero — lit for metal reflections and stone brilliance. "
        "Museum-quality showcase feel."
    ),
    "White Catalogue": (
        "YOUNG Indian female model (20-28 yr old) wearing the jewellery against "
        "a PURE WHITE seamless background. MATCH MODEL ARCHETYPE TO JEWELLERY "
        "TYPE — bridal pieces => young bride; daily-wear => young casual woman; "
        "statement => young fusion-styled woman. Even shadowless soft ecommerce "
        "lighting (Amazon/Flipkart/Meesho grade). Clean natural makeup, neutral "
        "plain outfit (white/cream). Jewellery clearly visible and centered. "
        "Ultra clean composition."
    ),
    "Bridal Editorial": (
        "YOUNG Indian BRIDE (20-28 yr old) wearing the jewellery — MATCH "
        "BRIDAL ATTIRE TO JEWELLERY TYPE — heavy bridal sets => full lehenga "
        "+ dupatta drape + bridal makeup with kajal and bold lips + mehndi on "
        "hands; lighter bridal pieces => engagement-style saree or anarkali. "
        "Rich warm gold tones, ornate silk fabric backdrop, candlelight + "
        "softbox mix. Vogue Bridal magazine wedding-rich feel."
    ),
    "Minimal Modern": (
        "YOUNG Indian female model (20-28 yr old) — MATCH MODEL ARCHETYPE TO "
        "JEWELLERY TYPE — bridal pieces => young bride in minimal bridal "
        "styling; daily-wear => young casual woman; statement => young "
        "fusion-styled woman. Minimal Scandinavian-influenced styling. Soft "
        "neutral colour palette (cream, beige, sage). Soft diffused window "
        "light. Uncluttered backdrop with maybe one subtle prop. Clean, calm, "
        "contemporary D2C brand feel."
    ),
}


def patch_js_code(code: str) -> str:
    """Replace the 4 entries inside the SHOOT_STYLE_GUIDE = { ... } object."""
    for key, new_value in NEW_ENTRIES.items():
        # The entries look like:  'Luxury Studio': 'old text here',
        # We match the line that starts with `  'Luxury Studio': '...',`
        # and replace the value while preserving the closing comma.
        # Need to escape single quotes inside new_value for JS string.
        js_escaped = new_value.replace("\\", "\\\\").replace("'", "\\'")
        # Trailing comma is OPTIONAL — the last entry in the object has none.
        pattern = re.compile(
            r"(  '" + re.escape(key) + r"': )'(?:[^'\\]|\\.)*'(,?)",
            re.DOTALL,
        )
        replacement = r"\g<1>'" + js_escaped + r"'\g<2>"
        new_code, count = pattern.subn(replacement, code, count=1)
        if count == 0:
            raise RuntimeError(f"Could not find SHOOT_STYLE_GUIDE entry for '{key}'")
        code = new_code
    return code


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    patched_nodes: list[str] = []

    for node in data["nodes"]:
        if node["name"] in (
            "Single Build Prompt Context1",
            "Bulk Build Prompt Context1",
        ):
            old_code = node["parameters"]["jsCode"]
            node["parameters"]["jsCode"] = patch_js_code(old_code)
            patched_nodes.append(node["name"])

    if len(patched_nodes) != 2:
        raise SystemExit(
            f"Expected to patch 2 nodes, patched: {patched_nodes}"
        )

    # Bump workflow name so the import doesn't silently overwrite.
    data["name"] = (
        "Jewellery Ai Studio Final 2.3 (young + jewellery-type-matched models)"
    )

    DST.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Patched nodes:", patched_nodes)
    print("Written:", DST)


if __name__ == "__main__":
    main()
