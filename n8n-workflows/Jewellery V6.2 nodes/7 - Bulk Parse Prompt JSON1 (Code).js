const root = $('Bulk Build Prompt Context1').first().json;

const raw =
  $json &&
  $json.choices &&
  $json.choices[0] &&
  $json.choices[0].message &&
  $json.choices[0].message.content
    ? $json.choices[0].message.content
    : "{}";

let parsed = {};

try {
  parsed = JSON.parse(raw);
} catch (e) {
  parsed = {};
}

const fallbackNegative = [
  "SKU code",
  "product number",
  "serial number",
  "barcode",
  "label",
  "price tag",
  "letters in image",
  "alphabet in frame",
  "numbers",
  "random text",
  "text covering jewellery",
  "monogram",
  "two-letter monogram",
  "single letter graphic",
  "brand initials",
  "signature mark",
  "AI watermark",
  "corner watermark text",
  "typography badge",
  "decorative letters",
  "embedded text logo",
  "wrong logo placement",
  "logo on jewellery",
  "blurry",
  "low detail",
  "distorted jewellery",
  "changed jewellery design",
  "altered gemstone layout",
  "changed metal tone",
  "extra jewellery pieces",
  "duplicate accessories",
  "warped fingers",
  "broken anatomy",
  "unrealistic gemstones",
  "altered product shape",
  "low-resolution",
  "cropped product",
  "hidden jewellery",
  "cluttered frame",
  "cheap look",
  "overexposed metal",
  "fake reflections",
  "extra hands",
  "deformed face",
  "AI face glitch",
  "uncanny valley face",
  "deformed stones",
  "asymmetric prongs",
  "fused gold links",
  "melted metal",
  "plasticky finish",
  "cheap toy look",
  "painted-on gemstones",
  "flat lighting on gold",
  "dull metal sheen",
  "dirty marks",
  "smudges",
  "fingerprints",
  "monochromatic Bollywood fair skin",
  "over-smoothed plastic skin",
  "AI stock photo look",
  "generic AI styling",
  "glass-like pearls",
  "chrome-like pearls",
  "flat white circle diamond",
  "painted enamel",
  "smudged kundan"
].join(", ");

var __NL = String.fromCharCode(10);
var __FACE_LOCK = "=== CRITICAL — REAL MODEL FACE LOCK (HIGHEST PRIORITY, OVERRIDES EVERYTHING) ===\nOne of the input images is a REAL photograph of the actual customer/model (the virtual try-on reference). This is a VIRTUAL TRY-ON of that EXACT same human being now wearing/showing the uploaded item. You MUST keep this person's face 100% IDENTICAL to that reference photo: same face shape, bone structure, jawline, cheekbones, eye shape and eye colour, eyebrows, nose, lips, skin tone and complexion, hairline, hairstyle, age and gender. Do NOT invent or generate a new face. Do NOT beautify, slim, smooth, re-shape, lighten, age or change the ethnicity of the face. Treat the face and head as a LOCKED, unchangeable identity that is simply re-photographed now wearing the new item/garment. If the output face does not clearly look like the SAME person as the reference photo, it is a FAILED result. Only the garment/jewellery, pose and background may change — the person's identity must be preserved exactly.";
var __hasModel = Boolean(root && (root.has_uploaded_model || root.model_image_url || root.model_photo_url));
var __fp = parsed && parsed.final_prompt ? String(parsed.final_prompt) : String(raw || "");
var __MODESTY = "=== MANDATORY MODESTY & ANTI-NUDITY (ABSOLUTE, HIGHEST PRIORITY, OVERRIDES EVERYTHING) ===\nIf ANY human model or body part appears in the image, that person MUST be fully and decently clothed - both an upper garment AND a fully-covering lower garment, legs covered to at least below the knee. ZERO nudity, ZERO topless, ZERO bare-legged, ZERO exposed buttocks/genitals/breasts/underwear, ZERO lingerie-only, ZERO sexualised or partially-undressed presentation - in ANY pose. This applies EQUALLY when a user-uploaded model photo is provided: dress that person fully and decently and NEVER remove or omit clothing. If the inputs would otherwise produce an unclothed or under-clothed body, OVERRIDE them and add proper modest clothing. A nude, semi-nude or partially-undressed result is STRICTLY FORBIDDEN and a FAILED output.";
// === V6.1 — JEWELLERY TRUE-SIZE & PLACEMENT LOCK (added after modesty; never paraphrased by GPT) ===
var __jt = String((root && (root.jewellery_type || root.custom_jewellery)) || "").toLowerCase();
var __mt = String((root && (root.model_type || root.model_look)) || "").toLowerCase();
var __noModel = __mt.indexOf("no model") !== -1;
var __has = function (k) { return __jt.indexOf(k) !== -1; };
var __SIZE = "", __PLACE = "", __OUTFIT = "";
if (__has("set")) {
  __SIZE = "This is a necklace + earrings set. The necklace must stay inside the collarbone area: its full width no wider than the distance between the two collarbone ends (it must NOT spread onto the shoulders or cover the chest like a bib), and it hangs only as low as in the product photo relative to its own width. The earrings hang from the earlobes and their length is in real proportion to the ear (a jhumka/drop earring is roughly 1 to 1.5 times the height of the ear, never reaching the shoulder).";
  __PLACE = "Necklace sits directly on bare skin around the base of the neck and collarbones, following the neck curve with gravity, with a soft contact shadow on the skin. Earrings are hooked through the earlobes, hanging straight down.";
  __OUTFIT = "Outfit must have an open neckline (round, sweetheart, boat neck or saree blouse) so the whole neck and collarbone area is bare skin. NO high-neck, turtleneck, mock-neck, collar or fabric under the necklace. Hair tied back or tucked behind the ears so both earrings are fully visible.";
} else if (__has("choker")) {
  __SIZE = "Choker is a close-fit piece: it wraps snugly around the middle/base of the neck at real neck circumference, its height and any hanging drops exactly as tall as in the product photo relative to its width. Do not widen it into a broad collar.";
  __PLACE = "It hugs the neck directly on bare skin, curving around the neck in 3D with a soft contact shadow.";
  __OUTFIT = "Open neckline with the neck and collarbones fully bare. NO high-neck, turtleneck or collar.";
} else if (__has("necklace") || __has("mangalsutra") || __has("pendant") || __has("chain")) {
  __SIZE = "Necklace/chain/pendant at real-life size: the necklace width stays within the collarbone span (never spreading onto the shoulders or covering the chest like a bib), the pendant is its real small size relative to the collarbone, and the drop length matches the product photo's proportions.";
  __PLACE = "It rests directly on bare skin of the neck/collarbone/upper chest, following the body curve with gravity, with a soft contact shadow. Never lying on top of clothing.";
  __OUTFIT = "Open neckline (round, sweetheart, V or boat neck or saree blouse) leaving the full necklace area as bare skin. NO high-neck, turtleneck, mock-neck or collar.";
} else if (__has("ear")) {
  __SIZE = "Earrings at real-life size relative to the ear: a stud fits within the earlobe; a jhumka/drop/chandbali is roughly 1 to 1.5 times the height of the ear, never reaching the shoulder and never wider than the ear.";
  __PLACE = "Hooked through the earlobe, hanging straight down with gravity, with a soft shadow on the neck/cheek.";
  __OUTFIT = "Hair tied back or tucked behind the ear so the earring and earlobe are fully visible.";
} else if (__has("maang") || __has("tikka")) {
  __SIZE = "Maang tikka at real size: the pendant is small (about the width of the gap between the eyebrows) and sits at the centre of the forehead just below the hairline; the chain runs along the centre hair parting.";
  __PLACE = "Chain in the hair parting, pendant resting flat on the forehead skin.";
  __OUTFIT = "Hair with a clean centre parting, forehead clearly visible.";
} else if (__has("nose") || __has("nath")) {
  __SIZE = "Nose pin/nath at real size relative to the nostril and face; a nath ring is no larger than in the product photo relative to the face, its chain going to the ear or hair only if present in the product photo.";
  __PLACE = "Pierced through the side of the nostril, sitting naturally on the skin.";
} else if (__has("ring")) {
  __SIZE = "Ring at real size: the band fits one finger exactly and the top/stone is no wider than about two fingers.";
  __PLACE = "Worn on the finger between knuckle and base, the band wrapping around the finger in 3D.";
} else if (__has("bangle") || __has("kada") || __has("bracelet")) {
  __SIZE = "Bangles/kada/bracelet at real wrist size: inner diameter fits the wrist naturally, thickness as in the product photo relative to its diameter.";
  __PLACE = "Worn on the wrist, resting on the skin with gravity, with a soft contact shadow.";
  __OUTFIT = "Sleeveless, short or three-quarter sleeves so the wrist is fully bare.";
} else if (__has("hathphool")) {
  __SIZE = "Hathphool at real hand size: the centre motif sits on the back of the hand, chains reaching the fingers and wrist exactly as in the product.";
  __PLACE = "Worn on the back of the hand, ring(s) on the finger(s), bracelet on the wrist, all touching skin.";
  __OUTFIT = "Sleeves short enough to keep the wrist bare.";
} else if (__has("anklet") || __has("payal")) {
  __SIZE = "Anklet at real ankle size, chain and charms as small as real.";
  __PLACE = "Worn around the ankle on bare skin, resting with gravity.";
  __OUTFIT = "Lower garment ending at or just above the ankle so the anklet is visible, still fully modest.";
} else if (__has("kamarbandh") || __has("waist")) {
  __SIZE = "Kamarbandh at real waist size, its width as in the product photo.";
  __PLACE = "Worn around the waist over a saree/lehenga, following the waist curve.";
} else if (__has("brooch")) {
  __SIZE = "Brooch at real size, smaller than the palm.";
  __PLACE = "Pinned on the garment (saree pleat, shoulder or lapel).";
}
var __JEWEL_LOCK = "=== CRITICAL — JEWELLERY EXACT DESIGN & TRUE SIZE LOCK (HIGHEST PRIORITY) ===\n" +
  "The FIRST input image is the real jewellery product. Reproduce it EXACTLY: same design, motifs, shape and silhouette, the same number and arrangement of stones, pearls, beads and drops, the same number of rows/layers, same metal colour and finish, and the SAME width-to-length proportions. Do NOT add or remove rows, layers, drops, motifs or stones. Do NOT make it bigger, wider, longer, bolder or heavier than it really is.\n" +
  "The product photo is a close-up, so IGNORE how big it looks in that photo. " +
  (__noModel
    ? "Render it at its real physical size relative to the props and display it sits on."
    : "Render it at its REAL physical size on an adult human body, scaled to the model's anatomy. Visibility must come from camera framing and lighting, NEVER from enlarging the jewellery. " + __SIZE + (__PLACE ? " " + __PLACE : "") + (__OUTFIT ? " " + __OUTFIT : "")) +
  "\nThe jewellery must look physically worn (touching skin, following body curves, with contact shadows), never floating, pasted flat, or placed on top of clothing. An oversized, widened, redesigned or wrongly placed piece is a FAILED output.";
var __JEWEL_END = "FINAL CHECK: jewellery identical to the first input image, at true real-life size, correctly worn" + (__noModel ? "." : ", neckline/hair/sleeves leaving it fully visible on bare skin.");
var __SHOT = root && root.shot_recipe ? '=== SHOT DIRECTION FOR THIS IMAGE (follow exactly) ===' + __NL + String(root.shot_recipe) : '';
__fp = __MODESTY + __NL + __NL + __JEWEL_LOCK + __NL + __NL + __fp + (__SHOT ? __NL + __NL + __SHOT : '') + __NL + __NL + __JEWEL_END;
if (__hasModel) { __fp = __FACE_LOCK + __NL + __NL + __fp; }
var __SCENE_LOCK = "=== CRITICAL — USER-UPLOADED SCENE COMPOSITE (HIGHEST PRIORITY) ===\nOne of the input images is the user's OWN background scene/photo. Place the product/jewellery naturally INTO this EXACT scene, replacing any existing product/placeholder in it. Match the scene's real lighting direction, perspective, shadows, depth of field, reflections and colour temperature so it looks genuinely photographed there. Keep the uploaded scene itself UNCHANGED — do NOT redraw, restyle or regenerate the background. Only the product is inserted/relit realistically into the user's scene.";
var __hasScene = Boolean(root && (root.reference_scene_url || root.has_uploaded_scene));
if (__hasScene) { __fp = __SCENE_LOCK + __NL + __NL + __fp; }

return {
  json: {
    ...root,
    final_prompt: __fp,
    negative_prompt: parsed && parsed.negative_prompt ? String(parsed.negative_prompt) : fallbackNegative,
    title_hint: parsed && parsed.title_hint ? String(parsed.title_hint) : "Jewellery AI Output"
  }
};