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

// ═══ V6.2 — SHOT LIBRARY (built from AF "Jewellery Agent" reference folders) ═══
// Every generation gets its own seeded combination of crop/pose + outfit + hair + light + colour
// (or display props when No Model) → thousands of unique, reference-style outputs.
// User selections always win: chosen pose, studio set, outdoor theme, uploaded scene, White BG, uploaded model.
const __seedStr = [p.generation_id, p.item_index, p.index, p.batch_index, p.source_image_url, p.batch_id].filter((x) => x !== undefined && x !== null).join('|') || String(Date.now());
let __h = 2166136261;
for (let i = 0; i < __seedStr.length; i++) { __h ^= __seedStr.charCodeAt(i); __h = Math.imul(__h, 16777619); }
let __s = __h >>> 0;
const __rand = () => { __s = (__s + 0x6D2B79F5) >>> 0; let t = __s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const __pickR = (arr) => (arr && arr.length ? arr[Math.floor(__rand() * arr.length)] : '');

const __jtl = String(jewelleryLabel || p.jewellery_type || '').toLowerCase();
const SHOT_CAT =
  /set/.test(__jtl) ? 'SET' :
  /choker|necklace|chain|mangalsutra|haar|rani/.test(__jtl) ? 'NECK' :
  /pendant|locket/.test(__jtl) ? 'PENDANT' :
  /ear|jhumka|stud|bali/.test(__jtl) ? 'EAR' :
  /hathphool|haathphool/.test(__jtl) ? 'HATHPHOOL' :
  /bangle|kada|bracelet|cuff/.test(__jtl) ? 'WRIST' :
  /ring/.test(__jtl) ? 'RING' :
  /tikka|matha|passa/.test(__jtl) ? 'TIKKA' :
  /nose|nath/.test(__jtl) ? 'NOSE' :
  /anklet|payal|toe/.test(__jtl) ? 'ANKLET' :
  /kamar|waist|belt/.test(__jtl) ? 'WAIST' :
  /brooch/.test(__jtl) ? 'BROOCH' : 'OTHER';

const SHOT_POSES_F = {
  EAR: [
    'Tight side-profile ear close-up: head turned away, chin lifted, eyes softly closed, long elegant neck; the earring hangs in the centre of the frame.',
    'Three-quarter face close-up, head slightly tilted, fingertips lightly resting on the jaw below the earring (never covering it), calm direct gaze.',
    'Face framed between large out-of-focus leaves in the foreground, three-quarter turn so the ear and earring are fully clear of the leaves.',
    'Model draped in a fabric hood / backdrop of the same colour as the background, face three-quarter to camera, ear and earring exposed.',
    'Looking down over the shoulder in profile, hair swept to the far side, the earring catching a crisp rim light.',
    'Crop from forehead to shoulders, one hand raised resting on top of the head, the ear and earring completely clear.',
    'Chin slightly down, a narrow light beam falling across the eyes and the earring while the rest of the face sits in soft shadow.',
    'Profile portrait in front of a large warm circular light disc, the earring lit by a soft front fill.'
  ],
  NECK: [
    'Chin raised, head tilted slightly back, eyes closed; upper face softly cropped or in shadow; the neck and collarbone with the necklace are the hero.',
    'Chest-up frontal portrait, shoulders relaxed and level, direct calm gaze, necklace perfectly centred.',
    'Three-quarter turn with one hand resting lightly on the opposite collarbone, fingers beside (never over) the necklace.',
    'Profile turn looking over the shoulder, eyes to the side, necklace following the curve of the neck.',
    'A sheer flowing fabric blowing across the upper face, lips and neck visible, the necklace sharp and completely uncovered.',
    'Framed through tall grass or leaves softly blurred in the foreground, model still, chest-up, calm stare into the lens.',
    'Seated, forearms on a table edge, chin resting on the back of one hand, shoulders square, necklace centred.',
    'A strong diagonal window-light beam across the neckline, model looking off-camera, crisp shadow on the wall behind.'
  ],
  PENDANT: [
    'Tight crop from the lips down to the upper chest, head turned slightly, the pendant centred on the collarbone.',
    'Chin raised, eyes closed, soft light on the neck, the pendant resting in the hollow of the collarbones.',
    'Chest-up three-quarter turn, fingertips touching the chain near the shoulder (never covering the pendant).',
    'Frontal chest-up, face cropped just above the nose, minimal, clean skin, pendant hero.',
    'Model looking down toward the pendant, soft side light, intimate quiet mood.',
    'Profile turn with the chain following the neck, the pendant catching a spark of light.'
  ],
  SET: [
    'Bust portrait, chin lifted toward a warm light, eyes closed, both the necklace and the earrings clearly visible.',
    'Seated at a table, chin resting on one fist, the other hand flat on the table, three-quarter turn, necklace and earrings clear.',
    'Hands crossed elegantly in front of the chest at collarbone height (fingers never covering the necklace), confident gaze.',
    'Three-quarter turn looking away, one hand tucking hair behind the ear to reveal the earring, necklace centred.',
    'Seated on a carved wooden chair beside a large white ceramic vase, body angled, looking toward window light.',
    'Dupatta draped over the head and one shoulder, face three-quarter, the necklace and earrings uncovered.',
    'One hand raised to the hairline, elbow out, intense direct gaze, necklace and earrings in sharp focus.',
    'Arms holding a draped shawl around the upper arms with shoulders and neckline open, chest-up crop.'
  ],
  RING: [
    'Hand resting on soft pampas grass, fingers relaxed and slightly spread, ring on the ring finger, sleeve of a soft knit visible.',
    'Model reclining, one hand reaching onto a mirror-like water surface, the ring and its reflection sharp.',
    'Two hands crossed at the wrists, one raised, delicate white flowers around, ring hero.',
    'Hand reaching toward the camera with the ring in razor-sharp focus, the smiling face softly blurred behind.',
    'Fingertips touching the lips / chin, ring finger forward, face cropped at the lips.',
    'Hand half-emerging from sheer fabric, the ring catching a sliver of light.',
    'Hand dipping into clear water with droplets, the ring sharp just above the surface.',
    'Hand resting on top of the head / hair, face below in moody low light, ring in focus.'
  ],
  WRIST: [
    'Single arm raised vertically into a beam of light against a dark backdrop, fingers relaxed, the piece sharp on the wrist.',
    'Both wrists crossed in front of the face, eyes looking over them into the lens.',
    'Two hands raised together in a graceful dance-like pose, wrists turned outward to the camera.',
    'One hand gently holding the other wrist, fingertips touching beside the jewellery.',
    'Chin resting on both fists, wrists and jewellery toward camera, face visible above.',
    'Arms crossed at the waist over a dark outfit, the pieces facing the camera.',
    'Henna-decorated hands overlapping on a silk lap, the jewellery in focus.',
    'Arm extended to the side with expressive fingers, tight crop on hand and wrist.'
  ],
  HATHPHOOL: [
    'Back of the hand resting on rich silk, fingers gracefully spread, the hathphool perfectly flat and visible.',
    'Both hands framing the face from below, backs of the hands to camera.',
    'Hands clasped softly on the lap over an embroidered lehenga, henna visible.',
    'One hand raised near the cheek, back of the hand to camera, face three-quarter.'
  ],
  TIKKA: [
    'Model lying with folded arms on a sofa armrest, chin on the arms, frontal gaze, sleek centre parting.',
    'Chin resting on one hand, frontal close-up, sleek centre parting with the tikka chain along it.',
    'Eyes closed, head bowed slightly, hands clasped near the cheek, tikka centred on the forehead.',
    'Three-quarter face close-up, eyes looking down, sleek low bun.',
    'A sheer embroidered dupatta held across the lower face below the nose, eyes looking sideways, forehead and tikka clear.',
    'Three-quarter close-up from the hairline to the chin, soft smile, the tikka chain following the parting.'
  ],
  NOSE: [
    'Extreme face close-up from forehead to lips, warm backlight halo, gentle smile, nose pin tack-sharp.',
    'Three-quarter portrait with a saree pallu on the shoulder, head slightly tilted.',
    'Fingertips touching the cheek near the jaw, three-quarter face, nose pin in focus.',
    'Extreme close-up of one eye and the nose, the lower face veiled by sheer gold-bordered fabric.',
    'Regal seated portrait, hand near the chin, nose pin and face sharp.'
  ],
  ANKLET: [
    'Feet in heels peeking below an embroidered lehenga hem, standing, the anklet sharp.',
    'Seated with legs crossed at the ankles, bare feet with alta, saree hem raised just above the ankle.',
    'A hand adjusting the anklet, the foot pointed on a raw marble block.',
    'A foot in a strappy heel on a stone step, flowing trousers lifted above the ankle.'
  ],
  WAIST: [
    'Three-quarter standing pose, one hand on the hip below the kamarbandh, waist-level framing, fully dressed in saree / lehenga.',
    'Side turn with the pallu drawn back to reveal the kamarbandh, crop from chest to hips.',
    'Seated gracefully, hands on the lap, kamarbandh catching the light.'
  ],
  BROOCH: [
    'Chest crop, brooch pinned on the saree pallu at the shoulder, model looking away.',
    'Three-quarter portrait, hand lightly on the lapel beside the brooch.',
    'Tight crop on the shoulder and drape with the brooch as the hero.'
  ],
  OTHER: [
    'Tight close crop on the body part where this piece is worn, natural elegant pose, the jewellery as the hero.',
    'Three-quarter editorial portrait with the jewellery clearly visible and sharp.',
    'Moody close-up with a narrow light beam on the jewellery.'
  ]
};
const SHOT_POSES_M = {
  RING: ['Hand resting on the knee, fingers relaxed, ring in focus, sleeve cuff visible.', 'Fist lightly under the jaw, ring toward camera, face softly lit.', 'Hand on a dark wooden table beside a leather notebook, ring sharp.'],
  WRIST: ['Forearm resting on a table with a rolled sleeve, kada / bracelet toward camera.', 'Adjusting the shirt cuff with the other hand, wrist piece sharp.', 'Arms folded across the chest, wrist piece facing camera.'],
  NECK: ['Chest-up portrait with an open-collar shirt, chain resting on the skin, confident gaze.', 'Three-quarter turn, chin up, chain and pendant catching side light.'],
  PENDANT: ['Chest-up portrait with an open-collar shirt, pendant on the chest, confident gaze.', 'Three-quarter turn, chin up, pendant catching side light.'],
  EAR: ['Side-profile close-up, short groomed hair, stud sharp.', 'Three-quarter portrait with a stubble jaw, ear and stud clear.'],
  BROOCH: ['Chest crop of a bandhgala / sherwani with the brooch pinned on the left side.', 'Three-quarter portrait, hand adjusting the lapel beside the brooch.'],
  OTHER: ['Confident three-quarter portrait, the jewellery clearly visible.', 'Close crop on the body part where the piece is worn, masculine relaxed pose.']
};

// Outfits — neck pieces always on an OPEN neckline (matches the true-size lock)
const SHOT_OUTFIT_OPEN_F = [
  'an ivory off-shoulder draped gown', 'a strapless ruched satin bodice', 'a silk saree with a sweetheart-neck blouse, pallu over one shoulder',
  'an off-shoulder white linen top', 'a one-shoulder sheer organza drape', 'a black satin off-shoulder saree drape',
  'a pastel ruffled organza off-shoulder gown', 'a sleeveless embellished lehenga blouse with a deep round neck', 'a champagne satin cowl-neck wrap'
];
const SHOT_OUTFIT_ANY_F = SHOT_OUTFIT_OPEN_F.concat([
  'a sleeveless black fitted top', 'a soft ivory knit sweater', 'a rich Kanjeevaram silk saree', 'a sheer white organza shirt', 'an olive satin slip dress with a cowl neck'
]);
const SHOT_OUTFIT_WRIST_F = [
  'a sleeveless silk blouse', 'an off-shoulder linen top', 'a short-sleeve embroidered lehenga choli', 'a sleeveless black satin dress',
  'an ivory saree with a sleeveless blouse', 'a strapless draped gown'
];
const SHOT_OUTFIT_M = ['a black bandhgala', 'an ivory silk kurta', 'a white linen shirt with an open collar', 'a charcoal suit with a crisp white shirt', 'a navy embroidered sherwani', 'a black shirt with the top buttons open'];
const SHOT_HAIR_F = ['a sleek low bun', 'a slicked-back high ponytail', 'a sleek centre-parted bun', 'a braided crown bun', 'soft side waves tucked behind the ears', 'voluminous curls pinned up off the neck'];
const SHOT_LIGHT = [
  'a hard window-light beam cutting diagonally across the subject with deep soft shadows',
  'one soft key light from the side with rich Rembrandt falloff',
  'warm golden-hour sunlight with a gentle rim glow',
  'clean soft diffused daylight',
  'a narrow spotlight with a soft halo on the backdrop',
  'dappled leaf-shadow (gobo) light on skin and backdrop',
  'warm backlight rim with a soft front fill'
];
const SHOT_PALETTE = [
  'a deep maroon velvet backdrop', 'a rich emerald green backdrop', 'a royal navy blue backdrop', 'a terracotta / rust backdrop',
  'a muted olive backdrop', 'a warm ivory / cream backdrop', 'a chocolate brown backdrop', 'a sand-beige backdrop',
  'a soft blush pink backdrop', 'a dusty plum backdrop', 'a deep bottle-green backdrop with a soft spotlight'
];
const SHOT_LENS = {
  EAR: '100mm macro-portrait lens, shallow depth of field', NOSE: '100mm macro-portrait lens, shallow depth of field', TIKKA: '100mm macro-portrait lens',
  RING: '100mm macro lens, focus on the stone', WRIST: '90mm lens, focus on the wrist piece', HATHPHOOL: '90mm lens', ANKLET: '90mm lens, low camera',
  NECK: '85mm portrait lens', PENDANT: '85mm portrait lens', SET: '85mm portrait lens', WAIST: '70mm lens', BROOCH: '85mm lens', OTHER: '85mm lens'
};

// No-model displays: arrangement (works on any set) + props (only when no set / scene / white bg chosen)
const SHOT_DISPLAY = {
  EAR: [
    ['the pair standing upright side by side at a slight three-quarter angle, low camera', 'on a polished brass oval tray over crushed emerald velvet with a curl of ivory satin ribbon'],
    ['the pair hanging side by side', 'from a thin dry branch against a soft warm gradient'],
    ['the pair leaning naturally', 'against rough sand-coloured stone slabs with a few dried billy-button flowers'],
    ['the pair placed together', 'on a dark polished pebble in a low warm sunbeam with long shadows'],
    ['the pair laid side by side', 'on folded ivory linen inside a carved wooden tray with jasmine buds and loose pearls'],
    ['the pair hooked side by side', 'over the edge of weathered dark driftwood'],
    ['the pair hanging', 'from a fresh olive branch over travertine with soft leaf shadows']
  ],
  NECK: [
    ['draped naturally on a neck bust, centred and symmetrical', 'a deep velvet neck bust in front of soft draped curtains'],
    ['hung in a natural drape', 'across a twisted driftwood branch above a stone surface'],
    ['draped centred on a bust', 'a travertine bust in front of a curved travertine arch'],
    ['draped in a graceful curve', 'over a large sculpted calla-lily petal with silk folds'],
    ['displayed on a bust', 'a matte bust surrounded by softly flowing organza fabric'],
    ['on a bust with a small festive still-life beside it', 'a velvet bust with a brass elephant, a diya and soft greenery']
  ],
  PENDANT: [
    ['hanging vertically, chain taut, pendant centred', 'over a tall piece of rough bark wood on dark wood chips'],
    ['draped on a bust, pendant centred', 'a royal blue velvet bust with satin drapes'],
    ['draped centred on a bust', 'a travertine bust with a warm amber gradient'],
    ['hanging in a soft loop', 'from a curving driftwood branch against a solid colour backdrop']
  ],
  SET: [
    ['the necklace on a bust with the earrings on a small stand beside it', 'a velvet neck bust with a brass elephant and a diya'],
    ['the necklace draped and the earrings hung beside it', 'over a sculpted wooden branch on a warm brown backdrop'],
    ['the necklace on a bust with the earrings hung on the bust ears', 'a sculpted mannequin bust with a head on a round plinth']
  ],
  RING: [
    ['the ring standing upright at a three-quarter angle', 'on twisted driftwood with a soft peach gradient'],
    ['the ring floating just above a pedestal with its soft shadow below', 'over a curved sculpted plaster pedestal with flowing paper curves'],
    ['the ring standing upright', 'on a stone slab with draped green silk'],
    ['the ring seated upright', 'in an open velvet ring box'],
    ['the ring worn on one finger of the mannequin hand', 'on a gold sculpted hand mannequin standing on a black marble plinth']
  ],
  WRIST: [
    ['the pieces displayed upright', 'on a velvet T-bar bracelet stand'],
    ['the piece hanging', 'from a budding branch with tiny sparkles of light'],
    ['the piece wrapped around', 'a tall piece of raw dark wood'],
    ['the piece resting on top', 'of a dark green marble cube in a slanted light beam'],
    ['the pieces standing in pairs', 'on stacked travertine slabs with baby\'s breath flowers'],
    ['the pieces resting on soft folds', 'of draped ivory silk'],
    ['the pieces stacked', 'on a wooden rod over embroidered fabric and handmade paper'],
    ['the pieces arranged in a neat stack', 'on a carved wooden box with marigolds, jasmine and a lit diya']
  ],
  TIKKA: [
    ['laid with the chain extended straight above the pendant', 'on a carved wooden box with a sheer lace dupatta'],
    ['laid flat and centred', 'on a round velvet plate over champagne satin with baby\'s breath'],
    ['laid with the chain curving', 'on cream marble with Indian sweets and rose petals']
  ],
  NOSE: [
    ['placed upright at a three-quarter angle', 'on a travertine block with dried white flowers'],
    ['the piece laid flat', 'on soft natural linen folds'],
    ['standing upright', 'on a small stone pebble in warm light']
  ],
  ANKLET: [
    ['draped in a soft curve', 'over a raw marble block'],
    ['laid in a gentle arc', 'on embroidered silk']
  ],
  OTHER: [
    ['displayed at its most flattering angle', 'on a polished marble cube in a slanted light beam'],
    ['the piece displayed', 'on weathered driftwood against a solid colour backdrop']
  ]
};
SHOT_DISPLAY.HATHPHOOL = SHOT_DISPLAY.WRIST; SHOT_DISPLAY.WAIST = SHOT_DISPLAY.OTHER; SHOT_DISPLAY.BROOCH = SHOT_DISPLAY.OTHER;

const __styleL = String(p.shoot_style || p.output_type || '').toLowerCase();
const __isWhite = /white/.test(__styleL);
const __hasSet = Boolean(clean(p.studio_set));
const __hasOutdoor = Boolean(clean(p.outdoor_background));
const __userPose = clean(p.pose);
const __autoPose = !__userPose || /auto/i.test(__userPose);
const __uploadedModel = Boolean(p.has_uploaded_model || p.model_image_url);
const __isMale = modelGender === 'Male';
const __neckOpen = ['NECK', 'PENDANT', 'SET', 'BROOCH'].indexOf(SHOT_CAT) !== -1;

let SHOT_RECIPE = '';
if (isNoModel) {
  const d = __pickR(SHOT_DISPLAY[SHOT_CAT] || SHOT_DISPLAY.OTHER);
  const parts = ['Product display (jewellery only, no human): ' + d[0] + '.'];
  if (hasScene) parts.push('Placed naturally inside the uploaded scene.');
  else if (__isWhite) parts.push('On a pure white seamless background with a soft natural contact shadow; bright even softbox catalogue light.');
  else if (__hasSet || __hasOutdoor) parts.push('Use the selected set / background; arrange only as described.');
  else parts.push('Setting: ' + d[1] + '. Backdrop: ' + __pickR(SHOT_PALETTE) + '. Light: ' + __pickR(SHOT_LIGHT) + '.');
  parts.push('Camera: ' + (SHOT_LENS[SHOT_CAT] || '85mm lens') + ', the jewellery tack-sharp and the clear hero.');
  SHOT_RECIPE = parts.join(' ');
} else {
  const poses = __isMale ? (SHOT_POSES_M[SHOT_CAT] || SHOT_POSES_M.OTHER) : (SHOT_POSES_F[SHOT_CAT] || SHOT_POSES_F.OTHER);
  const outfits = __isMale
    ? (SHOT_CAT === 'NECK' || SHOT_CAT === 'PENDANT' ? ['an ivory silk kurta with an open placket', 'a white linen shirt with an open collar', 'a black shirt with the top buttons open'] : SHOT_OUTFIT_M)
    : SHOT_CAT === 'ANKLET' ? ['an embroidered lehenga', 'a silk saree', 'flowing ivory wide-leg trousers']
    : SHOT_CAT === 'WAIST' ? ['a silk saree', 'an embroidered bridal lehenga']
    : (__neckOpen && SHOT_CAT !== 'BROOCH') ? SHOT_OUTFIT_OPEN_F
    : (['WRIST', 'HATHPHOOL'].indexOf(SHOT_CAT) !== -1 ? SHOT_OUTFIT_WRIST_F : SHOT_OUTFIT_ANY_F);
  const hairs = SHOT_CAT === 'TIKKA' ? ['a sleek centre-parted low bun', 'a sleek centre-parted braid', 'centre-parted hair pinned back smoothly'] : SHOT_HAIR_F;
  const parts = [];
  parts.push(__autoPose ? 'Crop & pose: ' + __pickR(poses) : 'Crop & pose: follow the selected pose (' + __userPose + ') with a tight, flattering crop for this jewellery type.');
  parts.push('Outfit: ' + __pickR(outfits) + ' (fully and decently dressed).');
  if (!__uploadedModel && !__isMale && SHOT_CAT !== 'ANKLET') parts.push('Hair: ' + __pickR(hairs) + ', never covering the jewellery.');
  const __fixedBg = hasScene || __isWhite || __hasSet || __hasOutdoor;
  if (__fixedBg && __autoPose) parts.push('(Keep the pose and crop; drop any pose prop or surface that does not belong in the selected background.)');
  if (hasScene) parts.push('Background: the uploaded scene.');
  else if (__isWhite) parts.push('Background: pure white seamless; bright even softbox light.');
  else if (__hasSet) parts.push('Background: the selected studio set; light: ' + __pickR(SHOT_LIGHT) + ' consistent with that set.');
  else if (__hasOutdoor) parts.push('Background: the selected outdoor theme; light: ' + __pickR(['warm golden-hour sunlight with a gentle rim glow', 'soft open-shade daylight', 'dappled sunlight through leaves', 'soft late-afternoon sun']) + '.');
  else parts.push('Background: ' + __pickR(SHOT_PALETTE) + ' harmonised with the metal and stones; light: ' + __pickR(SHOT_LIGHT) + '.');
  parts.push('Camera: ' + (SHOT_LENS[SHOT_CAT] || '85mm lens') + '; magazine-campaign editorial look like premium Indian jewellery brand ads.');
  SHOT_RECIPE = parts.join(' ');
}

return {
  json: {
    ...p,
    shot_recipe: SHOT_RECIPE,
    shot_category: SHOT_CAT,
    prompt_context: {
      shot_recipe: SHOT_RECIPE,
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
0. shot_recipe — the exact composition for THIS image (crop & pose, outfit, hair, light, backdrop or display props). Write the final_prompt around it; never replace it with a generic pose. Selected studio set / outdoor theme / uploaded scene / White BG still define the background.
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