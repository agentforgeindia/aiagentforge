// ============================================================
// BUILD PROMPT CONTEXT v6 — Jewellery AI Studio (page v6: 18 jewellery types,
// Female/Male models, Studio Professional jewellery sets, Upload Your Scene,
// No Model accessories, AF "Jewellery Agent" reference-board look)
// Based on v4.5 — Jewellery AI Studio Production
// Strong jewellery lock + exact scale + exact piece-count lock
// Branding 90/10 social media layout fixed
// Mobile-story composition + jewellery-type framing fixed
// Single + Bulk compatible
// ============================================================

const p = $json.payload || $('Validate And Normalize1').first().json.payload;

// ============================================================
// GLOBAL HARD RULES — highest priority
// ============================================================

const GLOBAL_JEWELLERY_RULES = `
HIGHEST PRIORITY: The uploaded jewellery is the primary source of truth.

Preserve the uploaded jewellery exactly:
- exact jewellery design
- exact shape
- exact stone placement
- exact gemstone count
- exact craftsmanship
- exact metal finish
- exact proportions
- exact real-world size
- exact visual identity
- exact number of jewellery pieces visible in the uploaded image
- exact jewellery category visible in the uploaded image only

STRICT PIECE-COUNT LOCK:
Only generate the jewellery pieces that are actually visible in the uploaded source image.
If the uploaded image shows only a necklace, generate only that necklace. Do not add earrings, tikka, matha patti, rings, bangles, bracelet, nose ring, waist chain, anklet or any matching set item.
If the uploaded image shows only earrings, generate only those earrings. Do not add necklace, tikka, rings, bangles or any matching set item.
If the uploaded image shows only a ring, generate only that ring. Do not add bracelet, bangles, necklace, earrings or any set item.
If the uploaded image shows only a bracelet, bangle or kada, generate only that wrist jewellery.
If the uploaded image shows a full matching set, generate only the same set pieces visible in the upload, with no missing pieces and no new pieces.
Never complete a jewellery set from imagination. Never create complementary jewellery. Never add bridal accessories unless they are visible in the upload.

STRICT SCALE LOCK:
Match the uploaded jewellery scale exactly relative to the human body and product type.
Do not make jewellery larger, heavier, wider, thicker, longer, more dramatic or more luxurious than the uploaded item.
A necklace must sit with natural real-world necklace size and drape. Earrings must match normal wearable earring scale. Rings must fit finger size naturally. Bangles/bracelets/kada must fit wrist size naturally. Tikka/matha patti must match real forehead/head scale.
The output jewellery must look like the same physical piece photographed on a model, not a redesigned bigger version.

Never:
- redesign the jewellery
- replace the jewellery
- add extra jewellery pieces
- remove any jewellery detail
- change gemstone shape
- change gemstone layout
- change metal tone
- enlarge the jewellery
- shrink the jewellery
- upscale jewellery size for drama
- make necklace thicker, wider or longer than upload
- make earrings bigger or heavier than upload
- create fantasy jewellery
- create oversized diamonds
- create oversized earrings
- create oversized necklace
- create missing set pieces
- add matching earrings if only necklace is uploaded
- add matching necklace if only earrings are uploaded
- add tikka, matha patti, bangles, rings, nose ring or bridal accessories unless present in uploaded image
- create duplicate jewellery
- create distorted jewellery

The jewellery must look physically realistic, naturally wearable, correctly placed on the body, and properly scaled.
The model, outfit, makeup, pose, lighting, background and styling must adapt to the jewellery.
The jewellery must NEVER adapt to the model.
Jewellery is always the main visual hero.
`;

const REALISM_RULES = `
Generate realistic luxury commercial jewellery photography.
The output must look like a real professional DSLR jewellery photoshoot.

Avoid:
- CGI look
- plastic skin
- cartoon jewellery
- fantasy styling
- unrealistic body proportions
- unrealistic jewellery size
- AI-generated extra jewellery
- distorted fingers
- distorted ears
- distorted neck
- broken necklace drape
- floating jewellery
- wrong jewellery placement

Use premium lighting, realistic skin texture, natural shadows, real reflections, and physically believable jewellery placement.
`;

const JEWELLERY_CATEGORY_RULES = `
Before generating, analyze the uploaded jewellery category, exact visible piece count, weight, design language, metal tone, gemstone colors and original real-world scale.

IMPORTANT: The selected jewellery_type is only a hint. The uploaded image is the final truth. If UI says set but uploaded image shows only necklace, generate only necklace. If UI says bridal but uploaded image has no tikka/earrings, do not invent tikka/earrings.

Styling logic:
- Heavy bridal set, choker set, matha patti, tikka, heavy necklace, heavy earrings → bridal or wedding styling.
- Kundan, Polki, Temple, antique gold → traditional Indian royal styling.
- Diamond, platinum, white gold → modern luxury bridal, cocktail, or premium editorial styling.
- Emerald, ruby, sapphire, colored stones → outfit and makeup palette should complement gemstone colors.
- Pearl jewellery → soft elegant styling.
- Daily-wear pendants, light chains, simple rings, small earrings → clean everyday premium styling.
- Statement or cocktail jewellery → luxury fashion editorial styling.
- Men’s rings, kada, chains, bracelets → refined masculine styling.
- Kids jewellery → soft child-safe styling only when clearly selected or requested.

Never force a red lehenga by default. Bridal outfit color must match jewellery.
`;

const JEWELLERY_TYPE_FRAMING_RULES = `
JEWELLERY-TYPE AWARE FRAMING:
The uploaded jewellery category must control crop, camera distance and focus.

For anklet / payal:
- Use a luxury ankle-and-foot close-up, not a full foot beauty shot.
- Anklet/payal must be the sharpest object in the frame.
- Focus plane must sit on the jewellery stones, metal edges and hanging elements.
- The foot is only supporting context; toes, sole or skin must never become the hero.
- Keep the anklet/payal large enough to clearly inspect design details.
- Jewellery should occupy approximately 25-40% of the main visible subject area.
- Avoid excessive empty space around the foot.
- Avoid cropping the anklet near the edge.
- Do not blur or simplify tiny stones, links, ghungroo, drops, chains or charms.
- Do not convert detailed anklet/payal into a generic decorative chain.

For rings:
- Use finger or hand close-up.
- Ring must be centered, sharp and naturally fitted.
- Stone, band, prongs and engraving must be crisp.

For earrings:
- Use ear close-up or side profile.
- Earring must be sharp, naturally attached and correctly scaled.
- Do not hide earring with hair.

For necklace / choker / pendant:
- Use neck, bust portrait or chest-up framing.
- Jewellery must be centered and naturally draped.
- Do not make necklace too small in full-body frame.

For bracelet / bangle / kada:
- Use wrist close-up or hand lifestyle crop.
- Jewellery must fit wrist naturally and remain sharp.

For tikka / matha patti:
- Use forehead/face framing.
- Jewellery placement must be natural and symmetrical.

For product-only / flat lay:
- Use macro or clean catalogue framing.
- Uploaded jewellery should remain the only jewellery item and must be sharply detailed.
`;

const OUTPUT_SIZE_COMPOSITION_RULES = `
OUTPUT SIZE / ASPECT RATIO RULES:
The selected output_size controls only canvas aspect ratio, not product quality.

If output_size is Square 1080x1080:
- Use balanced square composition.
- Keep jewellery large, sharp and easy to inspect.

If output_size is Mobile Story, Story, Reel, 1080x1920 or vertical:
- Create a premium vertical advertisement composition.
- Do not simply stretch, crop or enlarge the body part to fill the vertical canvas.
- Do not make the jewellery tiny because of vertical framing.
- Keep jewellery in the visual hero zone with strong close-up framing.
- Product clarity is more important than showing the whole body or full scene.
- For small jewellery such as ring, earring, anklet/payal, bracelet or bangle, use close-up composition with enough negative space for luxury ad feel.
- Maintain DSLR sharpness, high detail, realistic texture and clean product visibility.
- Avoid poster-like layout and avoid oversized branding.
`;

const BULK_VARIATION_RULES = `
For bulk generation, each generated image must feel unique while keeping the uploaded jewellery identical.

Vary only creative presentation:
- model facial features
- hairstyle
- pose
- expression
- backdrop styling
- composition
- camera crop
- lighting setup

Do not generate near-duplicate images.
Do not vary the jewellery design, size, visible piece count, category, metal tone, stone placement, gemstone count or proportions.
Only styling may vary. Jewellery must never vary. Never add or remove set pieces across bulk outputs.
`;

const BRANDING_COMPOSITION_RULES = `
SOCIAL MEDIA BRANDING RULES:

Use a premium jewellery advertisement layout, not a poster layout.

90/10 VISUAL BALANCE:
- Jewellery, model, outfit, background and photography must occupy approximately 90-92% of the visual attention.
- All branding elements together must occupy no more than 8-10% of the image area.
- Branding should be clearly visible but small, elegant and professional.
- Branding must never dominate the jewellery.

LOGO PLACEMENT:
- If a brand logo is provided, place it only in the top-right corner.
- Logo must remain small, premium and professional.
- Logo width should be approximately 4-6% of total image width.
- Maintain safe margin from the top and right edges.
- Never place logo over the jewellery, face, neck, earrings, rings, bracelet or important product area.
- Do not create oversized logos.
- Do not repeat the logo.
- Do not place logo in the center.
- Do not place logo in bottom strip unless specifically requested.

CONTACT DETAILS PLACEMENT:
- If company details are provided, place them in the bottom-right corner.
- Company Name should be on the first line.
- Phone/WhatsApp number should be on the second line.
- Website should be on the third line if available.
- Address should be very small or omitted if it makes the design crowded.
- Text must be readable on mobile screens but not oversized.
- Use clean luxury typography suitable for premium jewellery advertisements.
- Use subtle contrast support if needed, such as a soft shadow, slight dark translucent patch, or elegant minimal text box.
- Do not place all company details in one long horizontal line.
- Do not create a full-width footer banner.
- Do not create large poster-style phone numbers.

VISUAL PRIORITY:
- Jewellery is always the hero.
- Branding must support trust and recall without stealing attention.
- Keep the final image suitable for Instagram/Facebook jewellery ads.
- Maintain luxury, clean, high-end commercial aesthetics.
`;

const SHOOT_STYLE_GUIDE = {
  'Luxury Studio': `
High-end Indian jewellery studio campaign.
Analyze the uploaded jewellery first, then choose styling around it.
Use premium studio lighting with softbox, key light, rim light, and controlled reflections.
Backdrop: dark velvet, gradient charcoal, deep grey, luxury brown, or elegant neutral.
Heavy bridal jewellery may use refined bridal styling.
Lightweight jewellery should use clean premium model styling.
Statement jewellery should use modern editorial styling.
Jewellery must be sharply detailed, correctly worn, realistically scaled, and visually dominant.
`,

  'White Catalogue': `
Ultra-clean ecommerce jewellery catalogue image.
Pure white seamless background.
Even shadowless soft lighting.
Clean Amazon / Flipkart / Meesho grade product clarity.
Use simple neutral styling: white, cream, beige, ivory, or soft pastel outfit.
No dramatic props, no heavy background, no extra jewellery.
Jewellery must be centered, clearly visible, correctly worn, and true to uploaded design.
`,

  'Bridal Editorial': `
Luxury Indian bridal editorial campaign.
Analyze jewellery first and build the bridal look around it.
Do not default to red lehenga.
Outfit color, embroidery, dupatta, makeup, hairstyle and bridal mood must complement jewellery metal tone and gemstone colors.
Heavy bridal sets should use couture bridal styling with lehenga, saree or royal bridal drape.
Diamond and modern jewellery should use elegant modern bridal couture.
Kundan, Polki, Temple and antique gold should use royal traditional bridal styling.
Warm luxury wedding lighting, silk or palace-inspired backdrop, candlelight + softbox feel.
Vogue India bridal campaign quality.
Jewellery must remain the visual hero.
`,

  'Macro Detail': `
Extreme HD macro close-up of the uploaded jewellery only.
No model, no face, no body part unless the selected model type requires wearing context.
Show gemstone facets, prongs, engraving, kundan setting, polish, metal texture, and craftsmanship.
Shallow depth of field, ring-light micro reflections, premium product photography.
Do not change jewellery design, scale, stones, metal tone or layout.
`,

  'Indian Model': `
Premium Indian model jewellery campaign.
Model styling must be selected based on the uploaded jewellery.
Do not use the same saree or bridal look for every piece.
Heavy bridal jewellery → young Indian bride or festive bridal styling.
Daily-wear jewellery → young everyday Indian woman in modern casual, office, or simple ethnic styling.
Statement jewellery → modern Indian woman in fusion or Indo-western styling.
Natural Indian skin tone, realistic Indian facial features, soft premium makeup.
Model wears only the uploaded jewellery.
`,

  'Bridal Look': `
Indian bridal jewellery look designed around the uploaded jewellery.
Do not force red bridal outfit.
Choose lehenga, saree, anarkali or couture bridal outfit according to jewellery style, metal tone, gemstones and heaviness.
Gold, Kundan, Polki and Temple jewellery → rich traditional bridal styling.
Diamond and modern jewellery → elegant modern bridal styling.
Emerald, ruby, pearl, rose gold or colored stones → outfit and makeup palette must complement those colors.
Dupatta, hairstyle, makeup, mehndi and pose must support the jewellery.
Jewellery must be sharp, centered, realistically sized and visually dominant.
`,

  'Luxury Editorial': `
High-fashion Indian jewellery editorial.
Analyze uploaded jewellery and create a modern fashion look that enhances it.
Use cocktail dress, evening gown, structured blazer top, satin drape, designer western couture or Indo-western styling.
Dramatic studio shadow play, cinematic lighting, luxury magazine-cover mood.
Harper Bazaar / Vogue India editorial feel.
Clean premium makeup, confident expression, elegant pose.
No extra jewellery unless it is part of the uploaded jewellery set.
Jewellery remains the hero.
`,

  'Minimal Modern': `
Minimal contemporary Indian jewellery campaign.
Neutral premium palette: cream, beige, ivory, sage, soft grey, muted pastel.
Soft diffused window light.
Clean uncluttered background.
One subtle prop maximum.
Daily-wear jewellery should look calm and premium.
Bridal jewellery should become minimal bridal styling, not heavy red bridal styling.
Statement jewellery should become soft fusion styling.
Jewellery must be clean, sharp, correctly worn, realistically scaled, and primary focus.
`,
  'White Background': `
Ultra-clean ecommerce jewellery image on a PURE WHITE seamless studio background.
Even, shadowless, soft catalogue lighting (Amazon / Flipkart / Meesho grade).
With a model: simple neutral-styled model wearing the uploaded jewellery; clean natural makeup, plain light outfit. With No Model: only the uploaded jewellery, centred and filling most of the frame, with a faint natural contact shadow.
No dramatic props, no dark or textured background, no editorial mood.
Jewellery centered, clearly visible and true to the uploaded design.
`,
  'Outdoor Premium': `
Premium outdoor jewellery campaign in a real, upscale outdoor location (use the selected BACKGROUND_THEME from the frontend hard rules).
Natural golden-hour light, soft shallow depth of field. With a model: the model wears the uploaded jewellery. With No Model: the jewellery rests on a premium natural surface of the location (stone or marble ledge, carved balustrade, rock) with the location softly blurred.
The backdrop must always look premium, clean and aspirational - never old, broken, dilapidated or rundown.
Jewellery stays sharp and the hero of the frame.
`,
  'Studio Professional': `
Premium jewellery studio campaign on the selected STUDIO SET (see STUDIO SET DETAIL) — the set IS the background and replaces any plain seamless backdrop.
Jeweller-grade light: one soft key or narrow spotlight, gentle rim light, controlled metal reflections and stone brilliance; the face may sit partly in soft shadow so the jewellery dominates.
With a model: the model wears the uploaded jewellery on the set. With No Model: the jewellery is displayed on the set's bust / stand / tray / surface.
No softboxes, light stands or studio equipment visible. Jewellery is sharp, correctly worn or displayed, realistically scaled and visually dominant.
`,
  'Upload Your Scene': `
The user's own uploaded scene photo is the background. Place the uploaded jewellery (worn by the model if a model is selected, otherwise displayed on a believable surface in the scene) naturally INTO that exact scene at true real-world scale.
Match the scene's light direction, perspective, colour temperature, shadows and reflections. Never redraw, restyle or replace the scene and never add a new backdrop.
`
};

const MODEL_TYPE_GUIDE = {
  'No Model': `
Product-only jewellery image.
No human, no hand, no face, no body part.
Only the uploaded jewellery on the chosen surface or prop.
Preserve exact design, real-world scale and proportions.
`,

  'Hand Model': `
Luxury hand model jewellery shot.
Match hand gender to jewellery type.
Female rings, bracelets and bangles → elegant feminine Indian hand with natural manicured nails.
Men’s rings, kada or masculine bracelets → refined masculine Indian hand.
Jewellery must fit naturally on the hand and remain realistically sized.
Focus on jewellery as hero.
`,

  'Couple Hands': `
Luxury romantic engagement or wedding jewellery campaign.
Hands and jewellery are the primary focus in the foreground.
Both partners’ faces should also be naturally visible in the frame.
Use romantic pose: hand-holding, ring reveal, hand kiss, gentle embrace, forehead touch, or proposal-inspired pose.
Warm emotional expressions, soft chemistry, premium lighting, shallow depth of field.
Jewellery must remain unchanged, naturally worn, correctly sized and visually dominant.
`,

  'Female Model': `
Premium Indian female adult model wearing the uploaded jewellery.
Face visible.
Chest-up, waist-up or selected pose framing.
Outfit, makeup and hairstyle must complement jewellery.
Jewellery remains hero, correctly worn and realistically scaled.
`,

  'Male Model': `
Premium adult MALE model wearing the uploaded jewellery (rings, kada, bracelet, chain, pendant, brooch or any piece shown).
Face visible where the framing allows; refined masculine styling — sherwani, bandhgala, kurta, tailored suit or clean shirt chosen to suit the jewellery.
Jewellery remains hero, correctly worn and realistically scaled.
`,

  'Bridal Model': `
Ultra-luxury Indian bridal campaign model.
Analyze uploaded jewellery first, then design bridal styling around it.
Avoid generic red bridal look unless it truly matches the jewellery.
Outfit color, fabric, embroidery, makeup tones, hairstyle, draping and bridal mood must complement the jewellery.
Jewellery remains unchanged, visually dominant, naturally worn and realistically sized.
Magazine-cover bridal campaign quality.
`,

  'Luxury Flat Lay': `
Top-down premium flat-lay composition.
Use velvet, silk, marble, stone or premium fabric surface.
Only uploaded jewellery should be shown as main subject.
No model, no hand, no extra jewellery.
Realistic product scale and luxury commercial composition.
`,

  'Macro Detail': `
Extreme macro zoom on uploaded jewellery only.
Focus on one stone facet, prong, engraving, metal texture or craftsmanship detail.
No model, no body part.
Jewellery must remain exact and physically realistic.
`,

  'Ear Close-up': `
Premium side-profile close-up of one ear wearing the uploaded earring.
Focus on earring sparkle and realistic ear-to-jewellery contact.
Preserve earring design, size, stone placement and metal finish exactly.
Earring must appear naturally attached and correctly scaled.
`,

  'Bust Portrait': `
Luxury bust portrait.
Face, neck and upper chest visible.
Best for necklace, earrings, choker, pendant or bridal sets.
Styling supports jewellery without competing.
Jewellery remains hero and correctly placed.
`,

  'Half Body': `
Waist-up luxury campaign shot.
Model pose and outfit should support jewellery visibility.
Jewellery must remain unchanged, realistically scaled and clearly visible.
`,

  'Full Body': `
Full-body editorial jewellery campaign.
Model, outfit and environment support the jewellery.
Jewellery remains the focal accessory, not lost in the frame.
Use clear visibility, premium styling and realistic jewellery scale.
`,

  'Neck Focus': `
Focused neckline jewellery shot.
Necklace, choker or pendant should be centered and naturally draped.
Face may be partially visible depending on pose.
Preserve jewellery design, size, placement and craftsmanship.
`,

  'Neck Close-up': `
Tight female neck close-up.
No full face required.
Necklace is the hero.
Jewellery must remain identical to uploaded design, naturally draped and realistically scaled.
`,

  'Wrist Close-up': `
Luxury wrist-focused jewellery shot.
Match wrist gender to jewellery type.
Bracelet, bangle, kada or watch-style jewellery must fit naturally.
Preserve uploaded jewellery exactly with realistic size and authentic proportions.
`,

  'Lifestyle Hand': `
Natural lifestyle hand pose in premium everyday setting.
Examples: holding coffee cup, resting on silk fabric, holding clutch, touching dupatta, or placing hand on table.
Hand gender must match jewellery.
Jewellery must remain unchanged, correctly worn and visually clear.
`,

  'Editorial Scene': `
High-end jewellery editorial scene with model and environment.
Possible settings: palace, heritage architecture, luxury studio, garden, modern interior, couture set.
Environment should enhance jewellery, not overpower it.
Jewellery remains unchanged, realistically sized, naturally worn and visually dominant.
`
};

const POSE_GUIDE = {
  'Auto Pose': `Choose the most suitable fresh pose for the uploaded jewellery type. Prioritize jewellery visibility and realistic wearing position. Vary pose naturally across generations.`,
  'Front Pose': `Front-facing upper-body shot. Face, neck and shoulders visible. Jewellery clearly displayed and centered.`,
  'Side Pose': `Elegant 45-degree or side angle. Best for earrings, side-profile jewellery, pendants and editorial shots. Jewellery must remain clearly visible.`,
  'Half Body': `Waist-up framing with natural shoulder positioning. Jewellery visible without obstruction.`,
  'Full Body': `Full standing pose with editorial elegance. Jewellery should still remain visible and important.`,
  'Bust Portrait': `Chest-up or upper-body portrait. Best for necklace, choker, earrings and face/neck jewellery.`,
  'Hand Pose': `Hand pose matched to jewellery type. Female jewellery → feminine hand. Male jewellery → masculine hand. Hand extended or positioned elegantly to showcase jewellery. No distorted fingers.`,
  'Wrist Detail': `Wrist-only or wrist-dominant crop. Best for bracelet, bangle or kada. Jewellery must fit naturally and remain hero.`,
  'Couple Hands': `Romantic couple hand pose. Hands in foreground with jewellery clearly visible. Faces may be softly visible in background. Engagement or wedding emotional feel.`,
  'Neck Close-up': `Female neck close-up. Necklace is the hero. Minimal face, clean skin texture, realistic necklace drape.`,
  'Touching Necklace': `Model wearing necklace with one hand naturally touching or holding it. Premium intimate campaign feel. Hand should not hide jewellery.`,
  'Ear Close-up': `Side-profile close-up. Earring clearly visible on the ear. Sharp focus on jewellery and realistic ear placement.`
};

const ACCESSORY_GUIDE = {
  'No Accessories': `Strict clean output. Only uploaded jewellery. No display tray with other jewellery. No extra necklace, earrings, rings, bracelets or bangles. No scattered jewellery. No brand text unless separately requested.`,
  'Flat Lay': `Top-down luxury flat-lay. Only uploaded jewellery on premium surface. No extra jewellery pieces.`,
  'Velvet Box': `Uploaded jewellery resting on or beside an open velvet jewellery box. Black, maroon, navy or deep green velvet. Luxury showroom feel. Only uploaded jewellery.`,
  'Marble Surface': `Uploaded jewellery placed on polished white-grey veined marble. Subtle reflection. Only uploaded jewellery.`,
  'Silk Drape': `Uploaded jewellery styled with cascading silk fabric. Use cream, ivory, champagne, beige or gemstone-matching jewel tone. Only uploaded jewellery.`,
  'Rose Petals': `Sparse fresh rose petals as romantic accent. Tasteful and minimal. Only uploaded jewellery.`,
  'Marigold + Diya': `Marigold flowers and one small lit diya nearby. Festival or temple jewellery mood. Only uploaded jewellery.`,
  'Diamond Sparkle Set': `Tiny crystals or mirror sparkle accents around jewellery. Do not create extra jewellery. Uploaded jewellery remains main subject.`,
  'Pearl String Decor': `Soft pearl string decor as background accent only. Do not confuse pearl decor with main jewellery. Uploaded jewellery remains main subject.`,
  'Wooden Antique Tray': `Uploaded jewellery placed on vintage carved wooden tray. Heritage antique jewellery feel. Only uploaded jewellery.`
};

const CAMERA_ANGLE_GUIDE = {
  'Auto Angle': 'Choose the most flattering realistic camera angle for this jewellery type while keeping jewellery clearly visible.',
  'Eye Level': 'Straight-on eye-level shot, parallel to subject, premium catalogue clarity.',
  'Top Down': 'Direct overhead flat-lay perspective, best for product-only or surface shots.',
  'Side Profile': 'Side profile view, best for earrings, pendants, side neck details and editorial portraits.'
};

const FACE_GUIDE = {
  'Soft Smile': 'Gentle warm smile, relaxed eyes, premium approachable expression.',
  'Confident': 'Confident closed-mouth expression, direct gaze, luxury brand feel.',
  'Serious': 'Serious editorial expression, eyes slightly off-camera, high-fashion mood.',
  'Royal': 'Regal bridal expression, chin slightly raised, dignified and elegant.',
  'Natural': 'Candid natural expression, effortless and realistic, not over-posed.'
};

const NEGATIVE_JEWELLERY_PROMPT = `
bad jewellery, redesigned jewellery, changed jewellery, extra jewellery, duplicate jewellery,
added jewellery pieces, missing jewellery pieces, invented jewellery set, completed jewellery set,
matching earrings added, matching necklace added, added tikka, added matha patti, added rings, added bangles, added bracelet, added nose ring, added anklet,
oversized jewellery, oversized necklace, oversized earrings, oversized ring, oversized diamond, oversized choker, oversized pendant,
wrong real-world scale, enlarged jewellery, thicker necklace, longer necklace, heavier earrings,
wrong stone placement, changed gemstone layout, changed metal tone, fake gemstones,
fantasy jewellery, cartoon jewellery, CGI jewellery, distorted jewellery, melted jewellery,
floating jewellery, broken necklace, unrealistic necklace drape, wrong earring placement,
distorted ear, distorted fingers, extra fingers, deformed hand, plastic skin,
random text, watermark, logo, barcode, label, price tag, brand initials, monogram,
blurry jewellery, low detail jewellery, soft jewellery details, smoothed gemstones, lost craftsmanship, hidden jewellery, jewellery covered by hand,
jewellery not visible, jewellery too small, body part dominating jewellery, foot dominating anklet, toes dominating anklet, vertical crop losing jewellery detail, mismatched jewellery, poor lighting, harsh shadow
`;

const BACKGROUND_THEME_GUIDE = {
  'Royal Palace': 'Grand royal Indian palace courtyard or ornate heritage palace interior with carved arches, marble and gold accents. Regal, pristine and aspirational - never old, broken or rundown.',
  'Wedding Theme': 'Premium Indian wedding setting with an elegant floral mandap, soft drapes, warm festive decor and celebration ambience. Clean, upscale and aspirational.',
  'Sea Face': 'Upscale seaside golden-hour backdrop with soft ocean bokeh, gentle waves and warm premium light. Aspirational holiday-luxury mood.',
  'Forest': 'Lush premium green forest with soft dappled sunlight and clean natural depth. Fresh, rich and aspirational, never wild or messy.',
  'Temple': 'Elegant traditional Indian temple architecture with carved stone, brass and warm devotional ambience. Premium, clean and dignified.',
  'Forts': 'Majestic Indian heritage fort architecture with sandstone walls and royal arches in cinematic premium light. Grand and aspirational, never ruined.',
  'River Site': 'Serene premium riverside / ghat backdrop with soft reflections and calm flowing water in warm light. Clean and aspirational.',
  'Waterfall': 'Premium scenic waterfall backdrop with soft mist, lush surroundings and cinematic depth. Fresh and aspirational.',
  'Mountains': 'Premium mountain landscape with soft layered peaks, clean air and aspirational scale in flattering premium light.',
  'Garden': 'Manicured luxury garden with blooming flowers, soft greenery and gentle daylight. Clean, fresh and upscale.'
};
const STUDIO_POSE_GUIDE = {
  'Auto': 'Choose the most flattering natural studio pose for this jewellery type while keeping the piece clearly visible and hero.',
  'Standing Front': 'Model standing facing the camera with upright confident posture; jewellery centered and clearly visible.',
  'Three-Quarter Turn': 'Model turned about 45 degrees in an elegant three-quarter angle that flatters neckline and earrings while keeping jewellery sharp.',
  'Hand in Pocket': 'Relaxed editorial pose with one hand in pocket, confident premium fashion mood, jewellery still prominent.',
  'Looking Away': 'Model gazing softly away from the camera for a refined editorial mood; jewellery remains the clear focal point.',
  'Seated Stool': 'Model seated gracefully on a studio stool with poised upper-body framing; jewellery clearly visible.',
  'Leaning Pose': 'Model leaning subtly with relaxed elegant posture for a premium campaign feel; jewellery stays hero.',
  'Walking Toward Camera': 'Dynamic walking-toward-camera motion with confident energy; jewellery kept sharp and centered.'
};
const MODEL_LOOK_GUIDE = {
  'Indian Model': 'Indian / South-Asian model with natural Indian skin tone and realistic Indian facial features.',
  'Western Model': 'Western / European-American model with fair-to-medium skin tone and natural Western features.',
  'Asian Model': 'East-Asian model with natural East-Asian skin tone and facial features.',
  'Middle Eastern Model': 'Middle-Eastern model with warm olive skin tone and natural Middle-Eastern features.',
  'African Model': 'African model with a deep natural skin tone and authentic African features.',
  'European Model': 'European model with a natural fair European skin tone and features.',
  'Indian Male Model': 'Indian / South-Asian MAN with natural Indian skin tone and realistic Indian facial features.',
  'Western Male Model': 'Western / European-American MAN with natural Western features.',
  'Asian Male Model': 'East-Asian MAN with natural East-Asian skin tone and facial features.',
  'Middle Eastern Male Model': 'Middle-Eastern MAN with warm olive skin tone and natural Middle-Eastern features.',
  'African Male Model': 'African MAN with a deep natural skin tone and authentic African features.',
  'European Male Model': 'European MAN with a natural fair European skin tone and features.',
  'Uploaded Model': 'The uploaded customer photo is the model — keep that exact person.'
};

// ── v6: where each jewellery type is worn / displayed (page offers 18 types) ──
const JEWELLERY_WEAR_GUIDE = {
  'Ring': 'Worn on a relaxed finger in a hand close-up; band, stone and prongs crisp.',
  'Earrings': 'Worn on the ear — three-quarter or side profile, hair tucked back so the earring is fully visible.',
  'Necklace': 'Worn on the neckline / collarbone with a natural drape; bust or chest-up framing.',
  'Jewellery Set': 'Worn together exactly as uploaded (only the pieces visible in the upload) — bust portrait showing neckline and ears.',
  'Choker': 'Worn snug at the base of the neck; bust framing with the neck elongated.',
  'Pendant': 'Worn on a chain at the collarbone / upper chest; pendant centred and sharp.',
  'Chain': 'Worn around the neck at natural length; chest-up framing showing the full chain.',
  'Mangalsutra': 'Worn around the neck with the black-bead chain and pendant resting naturally on the chest; graceful Indian styling.',
  'Bracelet': 'Worn on the wrist; wrist / hand close-up.',
  'Bangles': 'Worn stacked or as a pair on the wrist; hands with soft henna or polished nails.',
  'Kada': 'Worn as a single bold cuff on the wrist; works for women or men.',
  'Hathphool': 'Worn on the back of the hand — the ring on the finger linked by chains to the wrist bracelet; elegant hand pose over silk or dupatta.',
  'Maang Tikka': 'Worn on the forehead centre-parting with the chain along the parting; face close-up.',
  'Nose Pin / Nath': 'Worn on the nostril (stud or nath with chain to the ear); close-up face in soft three-quarter light.',
  'Anklet / Payal': 'Worn on the ankle with a heel or bare foot; ankle close-up where the anklet is the sharpest object.',
  'Kamarbandh': 'Worn around the waist over a saree or lehenga; waist / three-quarter framing, always fully and decently dressed.',
  'Brooch': 'Pinned on a saree pallu, dupatta, blazer lapel or sherwani; chest framing.',
};
const jewelleryWearDetail = (label) => {
  const key = Object.keys(JEWELLERY_WEAR_GUIDE).find((k) => String(label || '').toLowerCase().startsWith(k.toLowerCase()));
  return key ? JEWELLERY_WEAR_GUIDE[key] : 'Identify the exact jewellery type from the uploaded image and wear / display it on the correct body part at a flattering close crop.';
};

// ── v6: look & feel distilled from the AF "Jewellery Agent" reference boards ──
const JEWELLERY_REFERENCE_LOOK = `
REFERENCE LOOK (AgentForge jewellery boards):
- Rich, moody jewel-tone or warm neutral backdrops (maroon, royal navy, emerald, chocolate brown, amber, sand, ivory) harmonised with the metal and stones.
- One soft key light or a narrow spotlight / sunbeam; real shadows; the face may be partly in soft shadow so the jewellery is the hero.
- Premium display props when no model: velvet neck-busts and bangle stands, polished marble cubes, travertine, weathered driftwood, folded silk, brass trays, river pebbles, a few dried flowers, marigold and diya for festive.
- Model styling: Indian ethnic (silk saree, lehenga, dupatta partly veiling the face, soft henna) or clean off-shoulder / strapless-gown editorial — always decently dressed; for men: sherwani, bandhgala, kurta or tailored suit.
- Tight, flattering close crops for small pieces (ring, nose pin, tikka, earrings, anklet); bust framing for neck pieces.
`;

const pick = (tbl, key) => tbl[key] || `"${key}"`;
const clean = (v) => String(v || "").trim();
const isBulk = String(p.generation_mode || p.mode || "").toLowerCase() === "bulk";

const brand = p.brand_details || {};

const brandLine = [
  brand.company_name ? `Company: ${brand.company_name}` : "",
  brand.website ? `Website: ${brand.website}` : "",
  brand.phone ? `Phone/WhatsApp: ${brand.phone}` : "",
  brand.address ? `Address: ${brand.address}` : ""
].filter(Boolean).join(" | ");

const moreJewellery = Array.isArray(p.more_jewellery) && p.more_jewellery.length
  ? p.more_jewellery.join(", ")
  : "";

const jewelleryLabel = p.custom_jewellery
  ? p.custom_jewellery
  : (moreJewellery ? `${p.jewellery_type} (${moreJewellery})` : p.jewellery_type);

const styleDirectives = clean(p.style_directives);
const isNoModel = String(p.model_type || '').toLowerCase().includes('no model');
const modelGender = isNoModel ? '' : (clean(p.model_gender) || (/male model/i.test(String(p.model_type || '')) && !/female/i.test(String(p.model_type || '')) ? 'Male' : 'Female'));
const genderRule = !modelGender ? '' : modelGender === 'Male'
  ? 'MODEL GENDER: MALE — the model is an adult MAN. Use masculine styling, hands and poses; never render a woman.'
  : 'MODEL GENDER: FEMALE — the model is an adult WOMAN.';
const hasScene = Boolean(p.reference_scene_url || p.has_uploaded_scene);

return {
  json: {
    ...p,
    prompt_context: {
      source_image_url: p.source_image_url,
      model_image_url: p.model_image_url || "",
      has_uploaded_model: Boolean(p.has_uploaded_model),
      has_uploaded_scene: hasScene,
      model_gender: modelGender,
      gender_rule: genderRule,
      jewellery_wear_detail: isNoModel
        ? `NO MODEL — no human or body part. Display the ${jewelleryLabel || "jewellery"} on its own on the set / selected props (bust, stand, tray or surface), at its most flattering angle and true real-world scale.`
        : jewelleryWearDetail(jewelleryLabel),
      reference_look: JEWELLERY_REFERENCE_LOOK,

      jewellery_type: jewelleryLabel,
      jewellery_notes: p.jewellery_notes || "",

      shoot_style: p.shoot_style || "Studio Professional",
      output_type: p.output_type || "Studio Professional",
      model_type: p.model_type || "No Model",
      pose: isNoModel ? "" : (p.pose || "Auto Pose"),
      model_look: p.model_look || "Indian Model",
      face_expression: p.face_expression || "Soft Smile",
      accessories: p.accessories || "No Accessories",
      outdoor_background: p.outdoor_background || "",
      studio_pose: p.studio_pose || "",
      studio_background: p.studio_background || "",
      studio_set: p.studio_set || "",
      camera_angle: p.camera_angle || "Auto Angle",
      output_size: p.output_size || "Square 1080x1080",
      output_quality: p.output_quality || "Premium",
      model_notes: p.model_notes || "",

      global_jewellery_rules: GLOBAL_JEWELLERY_RULES,
      realism_rules: REALISM_RULES,
      jewellery_category_rules: JEWELLERY_CATEGORY_RULES,
      jewellery_type_framing_rules: JEWELLERY_TYPE_FRAMING_RULES,
      output_size_composition_rules: OUTPUT_SIZE_COMPOSITION_RULES,
      branding_composition_rules: BRANDING_COMPOSITION_RULES,
      bulk_variation_rules: isBulk ? BULK_VARIATION_RULES : "",
      negative_prompt: NEGATIVE_JEWELLERY_PROMPT,

      shoot_style_detail: pick(SHOOT_STYLE_GUIDE, p.shoot_style || "Studio Professional"),
      model_type_detail: pick(MODEL_TYPE_GUIDE, p.model_type || "No Model"),
      pose_detail: isNoModel ? "" : pick(POSE_GUIDE, p.pose || "Auto Pose"),
      face_expression_detail: pick(FACE_GUIDE, p.face_expression || "Soft Smile"),
      camera_angle_detail: pick(CAMERA_ANGLE_GUIDE, p.camera_angle || "Auto Angle"),
      accessories_detail: pick(ACCESSORY_GUIDE, p.accessories || "No Accessories"),
      background_theme_detail: p.outdoor_background ? pick(BACKGROUND_THEME_GUIDE, p.outdoor_background) : "",
      studio_pose_detail: p.studio_pose ? pick(STUDIO_POSE_GUIDE, p.studio_pose) : "",
      studio_set_detail: p.studio_set ? `${p.studio_background || "Studio set"}: ${p.studio_set}` : "",
      model_look_detail: pick(MODEL_LOOK_GUIDE, p.model_look || "Indian Model"),

      style_directives: styleDirectives,
      has_style_directives: Boolean(styleDirectives),

      brand_details: brandLine,
      brand_logo_url: brand.logo_url || "",
      has_brand_text: Boolean(p.has_brand_text),
      reserve_bottom_strip: Boolean(p.reserve_bottom_strip),
      af_watermark: Boolean(p.af_watermark),
      reserve_second_corner: Boolean(p.reserve_second_corner ?? p.af_watermark),

      custom_instruction: p.custom_instruction || "",

      final_priority_instruction: `
Use this priority order:
1. GLOBAL_JEWELLERY_RULES
2. REALISM_RULES
3. JEWELLERY_CATEGORY_RULES
4. JEWELLERY_TYPE_FRAMING_RULES
5. OUTPUT_SIZE_COMPOSITION_RULES
6. BRANDING_COMPOSITION_RULES
7. BULK_VARIATION_RULES when present
8. style_directives
9. model_type_detail
10. shoot_style_detail
11. pose_detail
12. accessories_detail
13. camera_angle_detail
14. face_expression_detail
15. custom_instruction
16. background_theme_detail (apply when shoot style is Outdoor Premium or Luxury Editorial)
17. studio_set_detail (apply when shoot style is Studio Professional — the set IS the background)
18. model_look_detail + gender_rule (the model gender and ethnicity / look must match exactly)
19. jewellery_wear_detail (where the selected jewellery type is worn / displayed)
20. reference_look (overall mood from the AgentForge jewellery reference boards)
When has_uploaded_scene is true, the uploaded scene is the background and overrides studio set / background theme.

Never violate jewellery preservation rules.
Never violate branding composition rules when brand details or logo are provided.
For mobile-story output, preserve jewellery detail and use vertical ad composition without letting body parts dominate the product.
`
    }
  }
};