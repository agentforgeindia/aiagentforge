const p = $json;
const SYSTEM_PROMPT = "You are a senior creative director, professional commercial product photographer, and prompt engineer for AgentForge Productography AI Studio — a premium product still-image generator powered by FAL nano-banana image editor. You think like an Amazon/Flipkart catalogue lead photographer, a Vogue/GQ ad campaign director, and a brand marketing strategist combined. Every output must look like a real, paid, commercial-grade product shoot — never AI-stock-y, never plastic, never amateur. The platform converts a normal mobile/source photo into a brand-ready still image. ABSOLUTE TEXT RULE (this OVERRIDES rules 19 and 20 and everything else): Do NOT render, draw, write or embed ANY overlay text in the image - no company name, no phone, no website, no address, no brand text strip, no product code, no SKU, no article number, no watermark. ALL such text is added later by a separate external post-production layer. Keep all four corners and the entire frame completely free of any added text. The final_prompt you output MUST NOT request any text overlay and MUST explicitly state the image stays free of overlay text. Still reserve the clean empty corners for external compositing.\n\n═══════════════════════════════════════════════\nA. PRODUCT PRESERVATION (HIGHEST PRIORITY)\n═══════════════════════════════════════════════\n1. Preserve the product from the source image EXACTLY — shape, packaging silhouette, label graphics, brand printed text, colour palette, material finish (matte / gloss / metallic / fabric / wood / leather), bottle/jar/box/tube geometry, lid, cap, sticker, embossing, every visible design element.\n2. NEVER redesign the product. NEVER change brand name, packaging text, label artwork, colour, shape, or proportions.\n3. Product must remain the HERO — sharp focus, never cropped, never hidden by hands / props / model body parts / text.\n4. Output is a STILL IMAGE only. NEVER produce motion, video, animation, gif, reel, multi-frame, or sequential variations.\n\n═══════════════════════════════════════════════\nB. CATEGORY-SPECIFIC RENDERING RULES\n═══════════════════════════════════════════════\n5. Use product_category to set the correct rendering physics & treatment:\n   • COSMETICS (cream / serum / makeup / skincare): glass jar = crystal clarity with controlled internal reflection, plastic tube = smooth matte/gloss finish, brand text crisp on label, no smudge marks. Show ingredient/colour through transparent containers exactly as source.\n   • PERFUME: bottle glass must show real refraction and clean inner liquid colour, atomiser cap reflective, label print sharp. Premium luxury feel — Chanel/Dior level lighting.\n   • JEWELLERY: sharp specular highlights on metal, internal stone fire/scintillation on diamonds, soft pearl sub-surface sheen, preserve metal tone (yellow gold / white gold / rose gold / silver / oxidised) exactly. NO chrome look on pearls.\n   • FASHION ACCESSORIES (bag / belt / watch / wallet): preserve leather grain, stitching detail, hardware finish (gold / silver / gunmetal), buckle / clasp geometry. Watches: dial face fully readable.\n   • FOOD & BEVERAGE: fresh appetising look, true-to-source colour, no over-saturation, condensation droplets on chilled bottles, steam wisps on hot food OK, packaging text crisp. Avoid plasticky food look.\n   • ELECTRONICS: clean precision lines, brushed metal / glossy plastic / glass screens preserved, no fake screen content unless source has it, port and button detail preserved. Apple/Sony/Samsung-tier finish.\n   • HOME DECOR (candles / decor / crafts): material texture preserved (wax grain, ceramic glaze, wooden knots, woven texture), warm cozy mood OK.\n   • TOYS & KIDS: soft saturated colours, safety-stickers preserved, no harsh shadow that hides product, friendly cheerful mood.\n   • SHOES: sole detail, lace pattern, stitching, leather/canvas/synthetic texture preserved. Often shown at 3/4 angle on a clean surface, slightly tilted for hero pose.\n   • BAGS & LUGGAGE: handle / strap / hardware preserved exactly, leather/canvas/nylon texture, real shape (don't flatten).\n   • FURNITURE & HOME (sofa / lamp / kitchen): true scale and proportion, fabric/wood/metal texture preserved, in-context lifestyle shot OK if shoot_style permits.\n   • CUSTOM PRODUCT: read custom_instruction carefully and apply category-appropriate physics; default to luxury-studio treatment.\n\n═══════════════════════════════════════════════\nC. MODEL USAGE & ANATOMY\n═══════════════════════════════════════════════\n6. MODEL USAGE — who/what is in the frame (model_usage):\n   • NO MODEL: render ONLY the product on the requested background. Zero humans, zero hands, zero body parts. Pure premium still-life. This OVERRIDES any model look / group / pose selection.\n   • SINGLE MODEL: one realistic lifestyle model presenting / using / showcasing the product; styling, outfit, makeup and mood adapt to the product + shoot style; product stays the sharp hero.\n   • MODEL HOLDING PRODUCT: the model's hand(s) naturally hold / present / use the product WITH the model's face + upper body softly visible in the same frame — NEVER a lonely disembodied floating hand. Knuckles natural, fingers separated, no death-grip, clean groomed nails; the hand must NOT cover the product's label, brand name or hero detail.\n   • COUPLE WITH PRODUCT: a two-person lifestyle scene with the product as the connecting element; authentic chemistry, both faces naturally visible, product clearly framed and hero.\n   MODEL GROUP (model_group — gender/age for the single model; applies to SINGLE MODEL and MODEL HOLDING PRODUCT): FEMALE = adult woman, MALE = adult man, KIDS = child 4-12 yrs with a safe playful pose and a natural, non-uncanny expression. COUPLE = man + woman, NO MODEL ignores group.\n7. MODEL LOOK (model_look bundles ETHNICITY + PERSON TYPE, e.g. \"Indian Woman\", \"Asian Man\", \"African Couple\", \"Indian Boy/Girl\") — render that EXACT ethnicity and person:\n   • INDIAN: real Indian skin tones with natural variety (fair, wheatish, dusky), authentic Indian features — avoid a monochromatic Bollywood-fair bias.\n   • WESTERN / EUROPEAN: Caucasian / global-premium features with natural variation and professional-model presence.\n   • ASIAN: East / South-East Asian features, authentic and respectful.\n   • MIDDLE EASTERN / ARABIC: Middle-Eastern features with culturally-appropriate modest styling.\n   • AFRICAN: authentic African features and deeper skin tones rendered with proper light direction (avoid muddy shadows).\n   • LATIN AMERICAN: authentic Latin-American features and warm skin tones.\n   • CUSTOM LOOK: honour the exact look described in custom_instruction / model_notes.\n8. Skin texture must be REAL — natural pores, light micro-detail, never plasticky over-smoothed AI skin. Expression authentic, micro-smile or focused gaze depending on product context — never frozen mannequin stare, never uncanny.\n\n═══════════════════════════════════════════════\nD. SHOOT STYLE DIRECTION (only these four styles exist)\n═══════════════════════════════════════════════\n9. Each shoot_style is a different campaign brief — render the deep direction, not just a keyword. The ART DIRECTION BRIEF in the user message already resolves the set / location for the chosen style; follow it exactly.\n   • LUXURY STUDIO: a premium trending studio SET DESIGN (studio_background + studio_set) — sculptural plinths, stone / travertine / driftwood / velvet / satin / water elements, a backdrop colour harmonised with the product, directional campaign light with real shadows. Think Chanel / Aesop / Apple campaign still-life. The set replaces any plain gradient backdrop.\n   • OUTDOOR LIFESTYLE: a real upscale outdoor location from background_theme (Royal Palace, Wedding Theme, Sea Face, Forest, Temple, Forts, River Site, Waterfall, Mountains, Garden); the product sits on a real surface of that place (stone ledge, rock, balustrade, table, sand) at believable scale; golden-hour or soft natural daylight; shallow depth of field so the location reads but the product is razor sharp; never old, broken or rundown.\n   • ECOMMERCE WHITE BG: pure white #FFFFFF seamless background (Amazon / Flipkart / Myntra main-image standard), no gradient, texture or colour cast, product centred and complete filling ~80-85% of the frame, even soft light with only a faint natural contact shadow, NO props, NO scenery.\n   • UPLOAD YOUR SCENE: the user's own uploaded scene photo is the background — composite the product INTO that exact scene, matching its light direction, perspective, colour temperature, shadows and reflections; never redraw or restyle the scene and never add a new backdrop or props.\n\n═══════════════════════════════════════════════\nE. BACKGROUND (derived from the style — no separate background picker)\n═══════════════════════════════════════════════\n10. background_style is set automatically by the style: \"Plain White\" for Ecommerce White BG, the studio set name for Luxury Studio, \"Nature Outdoor\" + background_theme for Outdoor Lifestyle, \"User Uploaded Scene\" for Upload Your Scene. Never fall back to a plain white or plain gradient backdrop unless the style is Ecommerce White BG.\n\n═══════════════════════════════════════════════\nF. MODEL POSE & FRAMING\n═══════════════════════════════════════════════\n11. POSE (pose — how the model is posed with the product; IGNORE entirely when NO MODEL):\n    • AUTO: choose the most flattering natural pose for the product + shoot style; vary it naturally, never the same stiff pose.\n    • FRONT FACE: model facing camera, upper-body framing, confident direct presence, product clearly presented toward camera.\n    • SIDE POSE: elegant 45° / side profile, editorial and dynamic, product still clearly visible.\n    • WALKING POSE: candid walking-with-product feel (still image), lifestyle energy, product held or in scene.\n    • SITTING POSE: relaxed seated lifestyle pose (sofa, stool, cafe), product naturally held or placed, cozy premium mood.\n    • CLOSE-UP SHOT: tight crop on the model's hand/face interaction with the product; product hero and razor sharp.\n    • HALF BODY: waist-up framing, balanced model + product visibility.\n    • FULL BODY: full standing editorial pose, product still clearly visible and hero, never lost in the frame.\n11b. STUDIO SET / SCENE: when studio_set is provided (Luxury Studio) shoot on EXACTLY that set design — it is the background; adapt its props so they hold a product naturally (a plinth, block, stand or surface) and never let a prop overlap the product. When an uploaded scene is present (Upload Your Scene) the scene is the background instead. Campaign-quality lighting, but NO softboxes, light stands, umbrellas, reflectors or any studio equipment visible in the frame.\nKeep anatomy perfect — no warped fingers, broken limbs, extra hands or uncanny faces; the product must NEVER be hidden by the pose.\n12. COMPOSITION:\n    • Hero on power-third (rule of thirds) for editorial OR dead-centre for catalogue.\n    • Generous negative space — never crowd the frame.\n    • Leading lines (props, surface edges, light direction) draw the eye to the product.\n    • 1080x1080 (square 1:1): centred or upper-third hero.\n    • 1080x1920 (vertical 9:16 — story / reel still): product in upper-mid third, lower third = breathable space or brand text strip.\n    • 1080x1350 (portrait 4:5): hero dominant in upper 60%, breathing space at bottom.\n    • 1920x1080 (landscape 16:9 — banner / web hero): product on left or right third, opposite side for text/headline space.\n\n═══════════════════════════════════════════════\nG. LIGHTING (PROFESSIONAL PHOTOGRAPHER RULES)\n═══════════════════════════════════════════════\n13. LIGHTING DEFAULT (unless overridden by shoot style):\n    • Key light: 3/4 front-angle, soft-box quality.\n    • Fill light: opposite side at half key intensity to soften shadows without flattening form.\n    • Rim / back light: optional kicker that separates product from background — gives 3D depth.\n    • For glossy / glass / metal products: include a controlled specular highlight that traces the form (not a chaotic blob).\n    • For matte / fabric / wood: soft directional light revealing texture without harsh hotspot.\n    • AVOID flat front-flash on-camera-flash look — must have directional modelling.\n13b. LOOK & FEEL (AgentForge reference boards — every category):\n    • ONE hero product (or the product range only if the source shows a range), generous negative space, minimal sculptural props — never cluttered.\n    • Backdrop and props in a palette harmonised tone-on-tone with the product's own colours (e.g. green bottle → deep green set, red bottle → deep red set, beige jar → warm sand set).\n    • Real directional light with real shadows: a hard window / leaf / arch shadow, a single spotlight halo, or warm raking sun; true reflections on water, glass or glossy bases.\n    • Natural premium materials: raw stone, travertine, marble, driftwood, moss, sand, still water, silk / satin / velvet drapes.\n    • Hands and models look editorial: elegant groomed hands, faces partly in soft shadow when the product must dominate, styling in the set's palette.\n    • The product fills roughly 40-60% of the frame height (80-85% for Ecommerce White BG) — never tiny, never cropped.\n14. QUALITY TIER:\n    • PREMIUM: clean commercial campaign-grade, 4K-equivalent sharpness, retouched finish, no AI artefacts.\n    • ULTRA HD: micro-detail rendering — every fibre, grain, facet, droplet, label print pixel sharp. Highest tier — never blur, never soften.\n15. COLOUR GRADING per shoot style:\n    • Ecommerce White BG = true-to-life, no colour cast.\n    • Luxury Studio = rich, premium, controlled contrast in the set's palette.\n    • Outdoor Lifestyle = warm golden-hour or soft naturalistic.\n    • Upload Your Scene = match the uploaded scene's own grade exactly.\n\n═══════════════════════════════════════════════\nH. IMAGE CLEANLINESS (CRITICAL — STRICTLY ENFORCED)\n═══════════════════════════════════════════════\n16. The generated image must contain ZERO AI-added logos, badges, monograms, emblems, watermarks, brand marks, single-letter or two-letter graphics, or typography graphics. Do NOT draw, paint, render, illustrate, embed, or imagine any letter combinations, alphabet sequences, abbreviated initials, or stylised character marks anywhere except: (a) the product's own original packaging text/label/brand (which must be preserved exactly as source), (b) the optional brand text overlay defined in rule 19, (c) the optional product_code / text_on_image rendered per rule 20.\n17. ALWAYS reserve a CLEAN EMPTY CORNER at TOP-RIGHT (~18% width × 18% height) with absolutely NO product, NO model, NO props, NO patterns, NO text, NO graphics — clean uniform background — this corner is reserved for external image compositing.\n18. If reserve_second_corner is true, ALSO reserve a SECOND clean empty corner at BOTTOM-RIGHT (~12% width × 12% height) with same total cleanliness — clean uniform background — also reserved for external compositing.\n19. BRAND TEXT OVERLAY (only if brand_details has company name / phone / website / address): DO NOT render this brand text in the image - keep the bottom-left corner clean and text-free; brand text is composited externally. Max width 32% of image, max height 14% of image, ~3% padding from edges. Typography: simple modern sans-serif (Inter / Helvetica / SF Pro style), single family, left-aligned. White text @ 80-90% opacity on subtle dark gradient strip OR dark text on light strip — auto-pick whichever gives best contrast against the background. Layout: line 1 = company name (~2.2% of image height, semi-bold), line 2 = phone + '  |  ' + website (~1.6%, regular), line 3 = address (~1.3%, light, single-line, truncate if long). Skip any line whose field is empty. ZERO decorative shapes / borders / badges / shadows / icons / emoji / ornaments. NEVER place this text in top-right or bottom-right corners (those are reserved for external logo compositing).\n20. PRODUCT CODE / TEXT ON IMAGE (only if text_on_image or product_code is provided): DO NOT render any product code or embedded text in the image - it is composited externally; ignore the sizing details that follow. (legacy) (~1.2-1.5% of image height) in the BOTTOM-LEFT area BELOW the brand text strip, OR if brand text is absent, place it discreetly along the bottom-left at ~3% from edges. Same typography rules — no decorative box, no border. Must NEVER be placed in top-right or bottom-right reserved corners.\n\n═══════════════════════════════════════════════\nI. CUSTOM INSTRUCTION & OVERRIDES\n═══════════════════════════════════════════════\n21. ART DIRECTION BRIEF: the user message starts with an ART DIRECTION BRIEF generated from the AgentForge reference boards (set / location, placement, people, pose). It is authoritative for set, props, placement and mood — weave every line of it into final_prompt. Only rules 1-5 (product preservation + category physics), the modesty rule and rules 16-20 outrank it.\n22. Honour custom_instruction as a STYLE override (mood / colour / prop / background) — but it CAN NEVER override rules 1-4 (product preservation), rule 5 (category physics), or rules 16-20 (image cleanliness / reserved corners / text overlay rules).\n\n═══════════════════════════════════════════════\nOUTPUT (strict JSON only, no markdown, no code fences):\n═══════════════════════════════════════════════\n- final_prompt: 280-520 word paragraph weaving together → preservation → category-specific physics → model / scene → model look authenticity → shoot style direction → the ART DIRECTION BRIEF set / location / placement → model pose → composition for the given aspect → lighting setup → colour grading → quality tier → reserved empty corners (mention 'two clean empty corners — top-right and bottom-right — reserved for external compositing' when applicable, NEVER name them as logo/AF/watermark) → optional brand text strip in bottom-left → optional product code text. STILL IMAGE ONLY — never describe motion or video.\n- negative_prompt: comma-separated avoidance list. MUST include: 'video, animation, reel, gif, motion, multiple frames, blurry, low detail, distorted product, redesigned packaging, altered label, altered brand text, wrong color, deformed bottle, deformed product, AI watermark, letters in image, alphabet in frame, monogram, brand initials, typography badge, decorative letters, corner watermark text, embedded logo, fake screen content, plasticky finish, cheap toy look, painted-on details, flat lighting, dull metal sheen, harsh on-camera flash, fingerprints, smudges, dust, scratches, warped fingers, broken anatomy, deformed face, AI face glitch, uncanny valley face, extra hands, extra fingers, cropped product, hidden brand name, cluttered frame, over-smoothed plastic skin, AI stock photo look, generic AI styling, wrong packaging color, redesigned label, melted plastic, fake reflections, monochromatic Bollywood fair skin'.\n- title_hint: 3-6 word title.";

// ============================================================
// PRODUCTOGRAPHY — Build Prompt Context (v4 reference-board art direction)
// Turns the page selections into (1) prompt_context and (2) a short,
// authoritative ART DIRECTION BRIEF distilled from the AgentForge
// "AF Updates refers / Productography Agent" reference boards.
// A fresh random pick is made on every generation so repeat shoots
// never look the same. The uploaded product is never described or
// altered here — only the set, props, light and people around it.
// ============================================================
const brand = p.brand_details || {};
const brandLine = [
  brand.company_name ? `Company: ${brand.company_name}` : "",
  brand.website      ? `Website: ${brand.website}`      : "",
  brand.phone        ? `Phone: ${brand.phone}`          : "",
  brand.address      ? `Address: ${brand.address}`      : "",
].filter(Boolean).join(" | ");

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const low = (v) => String(v || "").toLowerCase();

// ── Category key ──
const catRaw = low(p.product_category);
const CAT =
  /perfume|fragrance|attar|cologne/.test(catRaw) ? "perfume" :
  /cosmetic|skin|serum|cream|makeup|beauty/.test(catRaw) ? "cosmetics" :
  /jewel/.test(catRaw) ? "jewellery" :
  /bag|luggage|handbag|backpack|tote/.test(catRaw) ? "bags" :
  /fashion|accessor|watch|belt|wallet|sunglass/.test(catRaw) ? "fashion" :
  /food|beverage|drink|bottle|cake|sweet|snack/.test(catRaw) ? "food" :
  /electronic|gadget|device|headphone|camera|phone/.test(catRaw) ? "electronics" :
  /furniture|sofa|chair|lamp|kitchen/.test(catRaw) ? "furniture" :
  /decor|candle|vase|craft|ceramic/.test(catRaw) ? "decor" :
  /toy|kid|baby/.test(catRaw) ? "toys" :
  /shoe|sneaker|sandal|heel|footwear/.test(catRaw) ? "shoes" :
  "custom";

// ── Reference-board library (per category) ──
// sets: premium product-only still-life sets seen on the boards
// outdoor: how the product sits in a real location
// hands: how a hand / model presents it
// accents: optional small props that suit the category
const LIB = {
  cosmetics: {
    display: ["on a small stepped travertine / raw-stone block", "on a smooth round stone pedestal", "on a balanced stack of river pebbles topped with moss", "on a small white cube plinth"],
    sets: [
      "a warm sand-beige set with stepped travertine / raw-stone blocks, the product on the top block, a sprig of eucalyptus or dried baby's-breath at the side and a hard window-light shadow across the wall",
      "a deep bottle-green seamless set, the product on a small white cube plinth with one oversized paper-white poppy bending over it",
      "a warm amber-to-caramel gradient set with a weathered driftwood branch and a smooth rock at the base, soft top light",
      "a pale sage-green set with a balanced stack of smooth river pebbles topped with fresh moss, the product resting on the moss",
      "a top-down shot of the product lying on a bed of lush green moss with dappled sunlight",
      "a cream plaster set with a round travertine pedestal, a few rough stones and dried flowers, soft sunlight through an arch window",
      "the product on softly rippled sand with a curl of rope and a piece of dark driftwood, warm raking light",
      "a warm studio with a cluster of the product range on low stone plinths and a soft plume of smoke drifting behind",
    ],
    outdoor: "resting on a sun-warmed natural stone ledge or smooth rock, a little greenery or dried grass around it, the location softly blurred behind",
    hands: "elegant, softly lit hands with clean natural nails cradle the product from below or present it between the fingertips against a warm backdrop; the label faces camera",
    accents: ["eucalyptus sprig", "dried baby's-breath", "fresh moss", "smooth river pebbles", "a halved citrus with water droplets", "a single white flower"],
  },
  perfume: {
    display: ["on a rough dark rock or burnt-wood chunk", "nestled in a soft fold of satin", "on a glossy reflective base with a clean reflection", "on a floating piece of weathered wood"],
    sets: [
      "a deep colour-matched backdrop (taken from the bottle's own colour) with the bottle on a rough dark rock / burnt-wood chunk, a single hard spotlight creating a glowing halo",
      "the bottle nestled in rich, softly folded satin fabric in a colour that harmonises with the bottle",
      "the bottle standing on still, mirror-like water with a perfect reflection, warm dusk light and a soft sun glow behind",
      "the bottle suspended underwater in deep blue with fine rising bubbles and caustic light rays",
      "the bottle lying on a sunlit shallow-water surface with rippling caustic light patterns",
      "the bottle on a floating piece of weathered wood with a few dried leaves or petals falling around it, warm colour-matched backdrop",
      "the bottle wrapped diagonally with thick natural rope against a warm tan backdrop",
      "the bottle on a glossy reflective base with amber resin stones and a thin curl of smoke, warm side light",
    ],
    outdoor: "standing on a dark rock or stone ledge at golden hour with a soft reflection or warm sun glow behind",
    hands: "a graceful hand with polished nails holds the bottle at chest or face height; the face may be partly in shadow or softly out of focus so the bottle stays the hero; moody low-key light",
    accents: ["folded satin", "dried petals", "amber resin stones", "a thin curl of smoke", "a single flower stem", "water droplets"],
  },
  jewellery: {
    display: ["on a velvet neck-bust / display form in a deep jewel tone", "hung or draped along a sculptural driftwood branch", "on a polished dark marble cube in a narrow beam of light", "on a velvet bangle stand / T-bar", "resting in soft folds of silk on a small plinth"],
    sets: [
      "a velvet neck-bust / display form in a deep jewel tone (burgundy, royal navy or emerald) with the piece worn on it, a single soft spotlight making the metal and stones sparkle against a matching dark backdrop",
      "a sculptural weathered driftwood branch against a warm brown or deep maroon backdrop, the piece hung or draped along the wood",
      "a polished dark-green marble cube lit by a single narrow beam of light on a deep green set, the piece resting on the top edge",
      "a smooth travertine bust or arch on a warm sand-beige set with soft golden light and a gentle shadow",
      "a velvet bangle stand / T-bar in burgundy or plum against a matching backdrop, the piece displayed on it",
      "an Indian festive still-life: a carved wooden jewellery box, folded silk in plum or maroon, a few marigold flowers and a glowing brass diya in warm candle light",
      "folded cream silk or satin with the piece resting in the soft folds, warm side light",
      "a brushed brass tray on deep green velvet with a loose ivory ribbon, the piece laid on the tray",
      "a flat natural stone slab on a pale beige set with a few dried flowers and a hard sunlight shadow",
      "a slim olive or dried branch across the frame with earrings / pendant hanging from it, soft dappled leaf shadows",
      "a dark river pebble in a hard diagonal sunbeam on a deep amber set, the piece resting on the pebble",
    ],
    outdoor: "worn by the model or resting on a stone / marble ledge in a luxurious real place (palace courtyard, sunset sea, golden dunes, tall green grass), warm golden light, the location gently blurred",
    hands: "identify the jewellery type from the product photo and wear it on the RIGHT body part at a flattering close crop — ring on a relaxed finger, bangles / bracelet stacked on the wrist (hands with soft henna or polished nails), earrings on the ear in a three-quarter profile with hair tucked back, necklace / pendant / mangalsutra / full set on the neckline and collarbone, nose pin on a close-up face, maang tikka on the forehead centre-parting, anklet on the ankle with a heel or bare foot; Indian ethnic styling (silk saree, lehenga, dupatta partly veiling the face) or a clean off-shoulder / strapless-gown editorial look (always decently dressed), dramatic soft side light with the face partly in shadow so the jewellery stays the hero",
    accents: ["folded silk", "a few marigold flowers", "a small brass diya", "dried baby's-breath", "a single ivory ribbon", "a pearl strand"],
  },
  bags: {
    display: ["on a sculptural piece of driftwood", "on a low round pedestal", "on a dark rock outcrop", "on a rustic wooden stool with a draped linen cloth"],
    sets: [
      "the bag on a sculptural piece of driftwood against a warm colour-matched gradient backdrop",
      "the bag on a low round pedestal in a deep burgundy or colour-matched set with a single soft spotlight",
      "the bag framed by dark velvet curtains with a dramatic side light",
      "the bag floating with a silk scarf, a few rose stems and a small key levitating around it on a warm beige backdrop",
      "the bag swirling within a large ribbon of soft pastel silk fabric",
      "the bag on a rustic wooden stool with a cream linen cloth draped over the seat",
    ],
    outdoor: "placed on a dark rock or weathered stone outcrop at dusk / sunset with a gradient sky behind, or on a white stone balustrade among palms, or in a desert-plaster arched window",
    hands: "an elegant hand (optionally in a black lace glove) holds the bag by its handle against a clean backdrop; for a model, the bag is carried at the side against a bold solid colour wall",
    accents: ["silk scarf", "rose stems", "a small brass key", "a pair of sunglasses"],
  },
  fashion: {
    display: ["on a small stone or wood plinth", "on folded leather or linen", "on a sculptural rock"],
    sets: [
      "a small stone or wood plinth with a single hard spotlight and a soft vignette",
      "a warm colour-matched seamless set with a sculptural rock and a hard window shadow",
      "folded leather or linen with the accessory resting on it, soft side light",
    ],
    outdoor: "resting on a stone ledge or rock in warm golden light, the location softly blurred",
    hands: "the accessory is worn or held by an elegant hand / wrist, the product crisp and unobstructed",
    accents: ["folded linen", "a small stone"],
  },
  food: {
    display: ["on an ornate brass or glass cake stand", "on a dark wood board", "on a stone slab", "on a marble surface"],
    sets: [
      "a dark, moody chiaroscuro set with deep velvet drapery, the food on an ornate brass or glass cake stand",
      "a deep burgundy set with fresh roses and ribbon around the dish, soft directional light",
      "a green velvet table with a single spotlight, pearls or gold details on the side",
      "a slate-blue textured table with the dish, a few scattered ingredients, dried flowers and a single window light from behind",
      "white marble with a hard sunlight window shadow, the product on a glass stand",
      "a dynamic splash of the drink with fresh fruit and ice cubes frozen in mid-air around the bottle",
      "the bottle wedged between two sunlit sandstone canyon walls against a warm glowing sky",
      "an overhead flat-lay on a dark wood board with a few whole ingredients and spices",
    ],
    outdoor: "set on a rustic table or stone ledge in soft natural light with a gently blurred garden or terrace behind",
    hands: "a hand in an elegant sleeve presents the plate / bottle toward camera against a warm dark backdrop",
    accents: ["fresh berries", "ice cubes", "whole spices", "dried flowers", "a linen napkin", "a brass spoon"],
  },
  electronics: {
    display: ["on a black stone cube", "floating just above a minimal plinth", "on a dark rock", "on stepped concrete blocks"],
    sets: [
      "a dark moody set with the device on a black stone cube, a thin glowing ring light behind it as a halo and a soft haze",
      "the device floating just above a minimal white plinth on a clean grey seamless background with a soft shadow below",
      "the device bursting from dark volcanic rock with glowing orange cracks and small flying rock fragments",
      "the device on black sand with a single hard rim light and a reflective base",
      "glossy red-lit acrylic podiums in a dark red set with neon edge light",
      "the device on a rock rising from still dark water with a mirror reflection and cool blue light",
      "the device balanced between two dark rocks against a warm sunset gradient sky",
      "the device on stepped concrete blocks in a soft grey set with a hard diagonal light",
    ],
    outdoor: "placed on a rock outcrop at dusk with a warm gradient sky, or on a dark stone ledge by water",
    hands: "a hand holds the device up against a vivid colour-matched backdrop, or reaches for it inside a leather bag; the screen / lens faces camera",
    accents: ["a thin haze", "small rock fragments", "a glowing ring light"],
  },
  furniture: {
    display: ["standing on the set floor at true scale", "on a low platform at true scale"],
    sets: [
      "the piece standing alone on a vast still mirror lake at soft pastel dawn, a perfect reflection below",
      "the piece in the middle of a field of small wildflowers at golden hour",
      "the piece on endless white sand dunes with long soft shadows",
      "the piece in a terracotta monochrome room with a warm window light patch on the floor",
      "the piece in a grand dark-green hall with a sweeping staircase and chandelier",
      "the piece in a minimal pale room with a large tree-leaf shadow across the wall",
      "the piece on a calm reflective pool beside monumental curved concrete architecture by the sea",
    ],
    outdoor: "placed naturally on the ground of the location — sand, grass, stone terrace or a water edge — at true scale, golden light",
    hands: "a model sits or leans naturally on the piece in a relaxed, lived-in pose while the piece stays fully visible",
    accents: ["a small side table", "a linen throw", "a ceramic vase"],
  },
  decor: {
    display: ["on a fluted plaster pedestal", "on stepped travertine blocks", "on a velvet-draped table"],
    sets: [
      "the piece on a table draped in soft velvet (olive, mustard or terracotta) against matching drapery",
      "the piece on a fluted plaster pedestal with loose silk fabric falling beside it and warm light",
      "the piece on stepped travertine blocks with dried flowers and a hard window shadow",
      "the piece on a round table with a linen cloth against a warm plaster wall",
      "a warm earthy set with orange drapery, a clay brick and a sculptural stone slab beside the piece",
      "the piece on stacked stones by still water under a moonlit blue sky with small white flowers",
    ],
    outdoor: "placed on a stone garden table or ledge with soft greenery, warm afternoon light",
    hands: "a hand gently places or adjusts the piece, the piece fully visible",
    accents: ["dried pampas", "a linen drape", "a lemon or two", "a slim candle"],
  },
  toys: {
    display: ["on a round pastel podium", "on stacked wooden blocks", "in a woven basket with a soft blanket"],
    sets: [
      "a soft pastel set with a round podium, fluffy white cloud props and gentle light",
      "a bright arched niche in a playful colour with a round wooden podium",
      "a cosy nursery corner with a woven basket, soft knitted blanket, wooden rings and a plush bunny",
      "wooden blocks of different heights with the product on top, soft window light",
      "a sunny cream set with sheer curtains, small wooden toys and dried flowers",
      "the product on a little wooden swing among pink cherry blossoms and blue sky",
    ],
    outdoor: "on a small wooden bench or grassy spot in a sunny garden, soft and cheerful",
    hands: "a child's small hands hold the toy / product naturally with a joyful, natural expression; always safe and age-appropriate",
    accents: ["a plush bunny", "wooden rings", "a knitted blanket", "cloud props"],
  },
  shoes: {
    display: ["on a small cube plinth at a three-quarter hero angle", "balanced on a sculptural rock", "on a classical fluted column", "on a pale travertine block"],
    sets: [
      "a tone-on-tone set in a colour taken from the shoe, the shoe on a small cube plinth with a hard diagonal window shadow",
      "the shoe balanced on a rough sculptural rock against a soft gradient backdrop",
      "the shoe on a round pedestal in front of a large glowing sun disc",
      "the shoe on a classical fluted column in warm light",
      "the shoe on a pale travertine block in a minimal cream interior with dried flowers",
      "a pair on rippled white sand beside a raw quartz stone",
      "the shoe floating at an angle above a stepped pastel block set",
      "the shoe on a sandstone rock among soft palm-leaf shadows",
    ],
    outdoor: "set on a natural rock or stone step at a three-quarter hero angle, warm golden light",
    hands: "a hand holds the shoe by the heel toward camera, or a model's feet wear it in a clean full-length frame",
    accents: ["a raw stone", "dried grass", "a small cloud prop"],
  },
  custom: {
    display: ["on a sculptural stone plinth", "on a small travertine block"],
    sets: [
      "a warm colour-matched seamless set with a sculptural stone plinth and a hard window shadow",
      "a deep moody set with a single spotlight and a soft reflection below the product",
      "a pale travertine step set with a few dried botanicals and soft sunlight",
    ],
    outdoor: "resting on a natural stone ledge in warm golden light with the location softly blurred",
    hands: "an elegant hand presents the product toward camera, the label facing forward",
    accents: ["a smooth stone", "dried botanicals"],
  },
};
const L = LIB[CAT] || LIB.custom;

// ── Style / model state ──
const style = String(p.shoot_style || "Luxury Studio");
const usage = low(p.model_usage);
const noModel = !usage || /no model|without model/.test(usage);
const holding = /holding/.test(usage);
const couple = /couple/.test(usage);
const hasScene = Boolean(p.reference_scene_url);
const hasModelPhoto = Boolean(p.model_photo_url || p.model_image_url);

const brief = [];
brief.push(`CATEGORY: ${p.product_category || "Product"} (treated as ${CAT}).`);
const isEcom = style === "Ecommerce White BG";
const isSceneStyle = hasScene || style === "Upload Your Scene";
if (!isEcom && !isSceneStyle) {
  brief.push("REFERENCE LOOK (AgentForge boards): a real paid campaign still — ONE hero product, generous negative space, a backdrop colour harmonised tone-on-tone with the product's own colours, sculptural natural props kept minimal (stone, travertine, driftwood, moss, sand, water, silk), directional light with real shadows (window / leaf / hard sun), true reflections where a surface allows. The product fills roughly 40-60% of the frame height, never tiny and never cropped.");
} else {
  brief.push("REFERENCE LOOK: a real paid campaign still — ONE hero product, crisp and true to colour, never tiny and never cropped.");
}

if (isSceneStyle) {
  brief.push("SET: the user's UPLOADED SCENE photo is the background — place the product naturally INTO that exact scene at a believable scale on a real surface, matching its light direction, perspective, colour temperature and shadows. Do not add a new set, props or backdrop.");
} else if (isEcom) {
  brief.push(noModel
    ? "SET: pure white #FFFFFF seamless marketplace background (Amazon / Flipkart main-image standard) — no gradient, no props, no scenery, no colour cast; the product centred, complete, front-facing and filling about 80-85% of the frame; even soft light with only a faint natural contact shadow directly underneath."
    : "SET: pure white #FFFFFF seamless studio background — no gradient, no props, no scenery, no colour cast; the model(s) and the product fully inside the frame, the product clearly visible and prominent; even soft catalogue light with only faint natural contact shadows.");
} else if (style === "Outdoor Lifestyle") {
  const theme = p.background_theme || "a premium natural location";
  brief.push(`SET: real outdoor location — ${theme} — always upscale, clean and aspirational, never old, broken or rundown. The product is ${L.outdoor}. Golden-hour or soft natural daylight, shallow depth of field so the location reads but the product is razor sharp.`);
} else {
  // Luxury Studio (default)
  const set = p.studio_set || pick(L.sets);
  const name = p.studio_set && p.studio_background ? `${p.studio_background} — ` : "";
  brief.push(`SET: premium trending studio set — ${name}${set}. This set IS the background (it replaces any plain gradient backdrop). The set may describe where a person stands or sits — the product goes there instead${noModel ? "" : " and the model uses that spot"}. Keep it minimal and never let a prop overlap the product.`);
  if (noModel) brief.push(`PRODUCT DISPLAY (reference board): present the product ${pick(L.display)}, built from materials that suit the set's palette.`);
  if (!p.studio_set) brief.push("(No set was chosen, so this set was picked from the category reference board.)");
  brief.push(`OPTIONAL ACCENT: at most one small accent — ${pick(L.accents)} — placed away from the product, only if it suits the set.`);
}

if (noModel) {
  brief.push("PEOPLE: none — zero humans, hands or body parts. Pure premium still-life.");
} else if (holding) {
  brief.push(`PEOPLE: MODEL HOLDING PRODUCT — ${L.hands} (ignore any backdrop named in this cue; the SET line decides the background). The face and upper body are softly visible in the frame (never a lonely floating hand); the hand never covers the label or brand name.`);
} else if (couple) {
  brief.push("PEOPLE: a couple (man + woman) in the set with the product as the connecting element, authentic warm chemistry, both faces natural, product clearly framed as hero.");
} else {
  brief.push(`PEOPLE: one model (${[p.model_group, p.model_look].filter(Boolean).join(", ") || "adult"}) presenting / using the product in the set — styling, outfit and makeup match the set's palette; the product stays the sharp hero. Reference cue for how people present this category: ${L.hands} (ignore any backdrop named in this cue; the SET line decides the background).`);
}
if (!noModel && hasModelPhoto) brief.push("MODEL PHOTO: the uploaded person photo IS the model — keep their exact face and identity.");
if (!noModel && p.pose && p.pose !== "Auto") brief.push(`POSE: ${p.pose}.`);

const ART_DIRECTION_BRIEF = brief.join("\n");

const prompt_context = {
  source_image_url:   p.source_image_url,
  product_category:   p.product_category,
  model_usage:        p.model_usage,
  model_look:         p.model_look,
  shoot_style:        p.shoot_style,
  background_style:   p.background_style,
  model_group:        p.model_group || "",
  pose:               p.pose || "Auto",
  background_theme:   p.background_theme || "",
  studio_background:  p.studio_background || "",
  studio_set:         p.studio_set || "",
  has_uploaded_scene: hasScene,
  has_uploaded_model: hasModelPhoto,
  output_size:        p.output_size,
  output_quality:     p.output_quality,
  product_code:       p.product_code || "",
  text_on_image:      p.text_on_image || "",
  brand_details:      brandLine,
  reserve_second_corner: Boolean(p.reserve_second_corner),
  custom_instruction: p.custom_instruction || "",
};

const USER_MESSAGE = [
  "Generate the FAL image-edit prompt for this STILL product shoot. Output strict JSON only — no markdown.",
  "",
  "ART DIRECTION BRIEF (authoritative — built from the AgentForge reference boards; weave every line into final_prompt):",
  ART_DIRECTION_BRIEF,
  "",
  "SELECTIONS",
  `- Category: ${prompt_context.product_category}`,
  `- Shoot style: ${prompt_context.shoot_style}`,
  `- Background (derived from the style): ${prompt_context.background_style}`,
  prompt_context.background_theme ? `- Background theme: ${prompt_context.background_theme}` : null,
  prompt_context.studio_background ? `- Studio set: ${prompt_context.studio_background}` : null,
  `- Model usage: ${prompt_context.model_usage}`,
  noModel ? null : `- Model group: ${prompt_context.model_group || "—"}`,
  noModel ? null : `- Model look: ${prompt_context.model_look || "—"}`,
  noModel ? null : `- Pose: ${prompt_context.pose}`,
  `- Uploaded scene photo: ${hasScene ? "yes" : "no"}`,
  `- Uploaded model photo: ${hasModelPhoto && !noModel ? "yes" : "no"}`,
  `- Output size: ${prompt_context.output_size}`,
  `- Quality: ${prompt_context.output_quality}`,
  `- Reserve second empty corner: ${prompt_context.reserve_second_corner}`,
  prompt_context.custom_instruction ? `- Custom instruction (style override only): ${prompt_context.custom_instruction}` : null,
  "",
  "STILL IMAGE ONLY — never describe motion or video. Return strict JSON with final_prompt, negative_prompt, title_hint.",
].filter((l) => l !== null).join("\n");

const openai_body = {
  model: "gpt-4o-mini",
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: USER_MESSAGE },
  ],
};

return [{
  json: {
    ...p,
    prompt_context,
    art_direction_brief: ART_DIRECTION_BRIEF,
    openai_body,
  },
}];
