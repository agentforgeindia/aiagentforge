// =====================================================================
//  PHOTOGRAPHY-GRADE PROMPT BUILDER  v4  (AgentForge)
// =====================================================================
//  Changes over v3:
//   - PRINT FORENSIC LOCK promoted to RULE #0 (top of prompt).
//   - Added PHOTOREALISM ENGINEERING block (RAW-photo physics).
//   - Added SENSOR + LENS AUTHENTICITY block.
//   - Added HUMAN IMPERFECTION CHECKLIST (expanded skin/eyes/hands).
//   - Added AMBIENT PHYSICS (contact shadows, light bounce, occlusion).
//   - Overlay text re-described as "post-production composite layer"
//     so model never embeds it INTO fabric.
//   - Negative prompt expanded with Nano-Banana-2-specific AI tells.
//   - Pose payload supports custom pose passthrough (input.custom_pose).
// =====================================================================

const meta  = $node['Code - Validate Input1'].json;
const input = meta.raw_input || meta;

const clean = (v, fallback = '') => {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  return s || fallback;
};
const lower = v => clean(v).toLowerCase();

// ========= core fields =========
const category        = clean(input.textile_category || input.category, 'Apparel');
const productType     = clean(input.product_type || input.product, 'Textile Product');
const modelUsage      = clean(input.model_usage, 'Single Model');
const modelLook       = clean(input.model_type || input.model_look, 'Indian Model');
const pose            = clean(input.custom_pose || input.pose || input.model_pose || input.scene_view, 'Front Face');
const expression      = clean(input.face_expression || input.model_expression,
                              'relaxed natural expression with a soft, real smile');
const shootStyle      = clean(input.shoot_style, 'Studio Catalogue');
const outputSize      = clean(input.output_size, '1080x1080');
const quality         = meta.quality;
const accessories     = clean(input.accessories, '');
const customRaw       = clean(input.custom_instruction, '');
const articleNumber   = clean(input.article_number || input.design_number, '');
const articlePosition = clean(input.article_position || input.watermark_position, 'top-right');
const designUrl       = meta.design_url;
const generationId    = meta.generation_id;
const logoUrl         = clean(input.logo_url || input.company_logo_url, '');
const sofaSeater        = clean(input.sofa_seater, '');
const towelType         = clean(input.towel_type, '');
const studioPose        = clean(input.studio_pose, '');
const outdoorBackground = clean(input.outdoor_background, '');
const studioBackground  = clean(input.studio_background, '');
const otherDesc         = clean(input.other_product_description, '');
const autoDetect        = (input.auto_detect_product === true) || (String(input.auto_detect_product).toLowerCase() === 'true') || (lower(input.product_type || input.product) === 'other');

// Branding
const brand = input.brand_details || {};
const positions = brand.positions || {};
const companyName    = clean(input.company_name    || brand.company_name, '');
const companyPhone   = clean(input.company_phone   || input.phone_number || brand.phone_number, '');
const companyWebsite = clean(input.company_website || input.website      || brand.website, '');
const companyAddress = clean(input.company_address || input.address      || brand.address, '');
const companyNamePosition    = clean(input.company_name_position    || positions.company_name,  'bottom-left');
const companyPhonePosition   = clean(input.company_phone_position   || positions.phone_number,  'bottom-left');
const companyWebsitePosition = clean(input.company_website_position || positions.website,       'bottom-right');
const companyAddressPosition = clean(input.company_address_position || positions.address,       'bottom-left');

const customInstruction = customRaw
  .split('|')
  .map(s => s.trim())
  .filter(Boolean)
  .join(' | ');

// ========= flags =========
const c = lower(category);
const p = lower(productType);
const u = lower(modelUsage);
const poseKey  = lower(pose);
const styleKey = lower(shootStyle);
const lookKey  = lower(modelLook);

const isHomeTextile =
  c.includes('home') || c.includes('decor') || c.includes('universal') ||
  ['bedsheet','curtain','pillow','cushion','sofa','towel','blanket','quilt',
   'bathrobe','rug','carpet','wall fabric','wall panel','fabric roll','table cover',
   'flat fabric','hanging fabric','rolled fabric','folded fabric','close-up texture',
   'fabric hanging','fabric bag','upholstery','luxury bedroom'
  ].some(x => p.includes(x));

const isNoModel = u.includes('no model') || u === 'none' || u.includes('flat lay') ||
                  u.includes('flatlay') || u.includes('product only');
const isMannequin = u.includes('mannequin');

const isTraditional = ['kurta','saree','salwar','kameez','lehenga','dupatta','pathani',
                       'sherwani','anarkali','sharara','palazzo','blouse','dhoti'].some(x => p.includes(x));
const isFemaleProduct = ['saree','kurti','blouse','dupatta','lehenga','anarkali','frock',
                         'gown','dress','sharara','palazzo','salwar','kameez','girls','ladies suit','cord set','stole','scarf'].some(x => p.includes(x));
const isMaleProduct = ['mens shirt','male kurta','pathani','blazer','waistcoat','sherwani',
                       '3 piece','2 piece','trouser','boys shirt','boys kurta'].some(x => p.includes(x));
const isKidsProduct = ['kids','boys','girls','frock','night suit','baby'].some(x => p.includes(x));

const isLuxury  = styleKey.includes('luxury') || styleKey.includes('editorial') || styleKey.includes('hotel');
const isWhiteBg = styleKey.includes('white')  || styleKey.includes('ecommerce') || styleKey.includes('e-commerce');
const isOutdoor = styleKey.includes('outdoor') || styleKey.includes('garden') || styleKey.includes('street') ||
                  styleKey.includes('sunset');
const isStudio  = styleKey.includes('studio')  || styleKey.includes('catalogue');


// =====================================================================
//  RULE #0 - PRINT FORENSIC LOCK (absolute, non-negotiable)
// =====================================================================
const printForensicRule = `
=====================================================================
RULE #0A - MANDATORY MODESTY & ANTI-NUDITY (ABSOLUTE, HIGHEST PRIORITY, OVERRIDES EVERYTHING INCLUDING POSE, FRAMING AND ANY UPLOADED PHOTO):
The human model is ALWAYS fully and decently clothed across the whole body - shoulders, torso and legs covered to at least below the knee. If the selected product is an UPPER / top-only garment (kurti, kurta, shirt, t-shirt, top, blouse, choli, hoodie, sweatshirt, waistcoat, blazer, jacket, dupatta, stole, scarf), the model MUST ALSO wear a complete, fully-covering, well-fitted LOWER garment appropriate to the look (leggings, churidar, palazzo, salwar, trousers, jeans, or a skirt) in a clean complementary SOLID colour pulled from the print palette. LOWER COLOUR STYLING: if the user instruction gives a LOWER GARMENT COLOUR, use exactly that colour. Otherwise study the uploaded print first and choose a classic solid lower that makes the print look its best - contrasting in tone (light / pastel print -> navy, charcoal or deep olive; dark / rich print -> stone beige, khaki, light grey or off-white), never the same colour as the print's ground, never loud or neon, never printed or patterned. The uploaded design appears ONLY on the main garment. The model is NEVER bare-legged, NEVER in underwear/lingerie only, NEVER partially undressed, NEVER topless and NEVER nude. There must be ZERO nudity and ZERO exposure of buttocks, genitals, female breasts or undergarments - in ANY pose, including full-body. This rule applies EQUALLY when a user-uploaded model photo is provided: dress that person fully and decently and NEVER remove or omit their lower clothing. If any other instruction or input would lead to an unclothed or under-clothed body, OVERRIDE it and add proper modest clothing. A model shown without a lower garment, or with exposed private areas, is a STRICTLY FORBIDDEN, FAILED result. This modesty rule governs what the model WEARS, never the framing: in a HALF-BODY / waist-up shot the lower garment is still worn but simply stays outside the frame.
=====================================================================
  RULE #0 - PRINT FORENSIC LOCK (ABSOLUTE, OVERRIDES EVERYTHING)
=====================================================================
The uploaded textile design at ${designUrl} is the GROUND TRUTH source
of the print. Treat it the way a forensic photographer treats evidence.

THE PRINT MUST BE PRESERVED PIXEL-FOR-PIXEL where the fabric is flat:
- Every motif, line, curve, dot, and colour in the source MUST appear
  in the output identically.
- Do NOT redraw. Do NOT re-interpret. Do NOT stylise.
- Do NOT shift hue, saturation, brightness, or contrast of the print.
- Do NOT change motif SCALE - the repeat-size must remain natural to
  the garment cut (a 10cm motif on the source stays a 10cm motif on
  the garment, not stretched or shrunk).
- Do NOT change motif ROTATION. The print orientation on the body
  matches how a real cut-and-sew operation would lay the fabric.
- Do NOT invent decorative elements that are not in the source.
- Do NOT add embroidery, sequins, beadwork, foil, or any embellishment
  unless the source already has it.
- Do NOT crop the pattern repeat to "look better."
- Apply the print to the fabric ONCE, cleanly mapped to the product's cut panels. Do NOT duplicate it, double-expose it, tile it excessively, or overlay a second floating copy of the design.
- Do NOT blow up a single motif so large that one motif covers the whole garment. The motif scale stays true to the source.
- The print must look genuinely WOVEN / PRINTED INTO the cloth - never pasted-on, stuck-on, floating above the fabric, oversized, or overlapping itself.

BORDER / PLACEMENT-PRINT RULE (CRITICAL): If the uploaded design has a distinct decorative BORDER strip along the BOTTOM of the image (a horizontal band clearly different from the main scattered / all-over motif), that border belongs ONLY at the very BOTTOM HEM of the finished product.
- For a shirt / kurta / any garment: the border runs horizontally along the BOTTOM HEM only. The body, chest, shoulders, sleeves, CUFFS, COLLAR / neckline and the BUTTON PLACKET must use the MAIN all-over motif - NOT the border.
- Do NOT copy, mirror, repeat or scatter the border onto the collar, neckline, cuffs, button placket, yoke, shoulders or sleeves. The border appears exactly once, as a single horizontal band at the hem.
- For home textiles (curtain / bedsheet / sofa cover / table cover): the border sits along the natural edge(s) of that item only, never tiled across the whole surface.
- Keep the border's motifs, colours and scale exactly as in the source and align it cleanly to the product cut, like a real engineered placement print.

CENTRE-FRONT PLACKET & PLACEMENT FIDELITY (CRITICAL, NON-NEGOTIABLE for shirts / kurtas / any button-front garment): (1) The button placket, collar, cuffs and button band are made from the SAME base fabric in the SAME base colour as the body of the garment - NEVER a contrasting strip, never a lighter/darker band, never a separate panel colour. (2) First decide what KIND of design was uploaded. If it is a PLACEMENT / ENGINEERED design (borders, stripes beside the placket, framed panels, isolated motifs, a single chest or hem motif), reproduce EXACTLY those elements in EXACTLY their positions, sizes and count - and NOTHING ELSE: do NOT add borders, stripes or lines to the sleeves, shoulders, collar, cuffs, yoke or hem unless they are clearly present in the uploaded design; in particular the CUFF BANDS stay completely plain base fabric - a border that runs beside the placket must NEVER be repeated around the cuffs or sleeve ends; do NOT duplicate or mirror a placement motif elsewhere; every area that is plain in the design stays plain base fabric. (3) If it is an ALL-OVER repeat print, spread the repeat naturally across body and sleeves, but keep a narrow motif-free channel of base fabric (same colour) down the button placket so no motif is sliced by the buttons; every motif stays whole. An added stripe on the sleeve, an extra border, or a placket in a different colour is a FAILED result.

REAL-PERSON CASTING (every ethnicity, especially Western / European models): cast a believable real working model, NOT a generic stock-photo or AI face - natural matte skin with real texture (no makeup look on men), a relaxed genuine expression or soft closed-mouth smile instead of a wide toothy stock-photo grin, natural hairline and grooming, real-world proportions.

AUTHENTIC PHOTOGRAPH (NO AI / CGI LOOK): the result MUST look like a real DSLR photograph of a real human, never an AI render, 3D model or "AI-influencer" face. Natural skin with visible pores and tiny imperfections (never plastic-smooth or waxy), realistic hair with a few stray flyaway strands, subtle natural facial asymmetry, real catch-lights in the eyes, and true-to-life fabric wrinkles and drape. Avoid airbrushed perfection, glassy eyes, over-symmetry and any synthetic AI sheen.

HUMAN BODY ANATOMY LOCK (CRITICAL whenever a model is present): render perfectly correct, natural human anatomy.
- Hands: EXACTLY five fingers per hand (count them), natural finger length, correct thumb; no fused, extra, missing, bent-backwards or melted fingers.
- Feet: EXACTLY five toes per foot, natural foot shape and size with a correct ankle; never elongated, melted, flipper-like or club-shaped feet.
- Arms & legs: natural human length and proportion; elbows, knees, wrists and ankles bend the correct way; no over-long, rubbery, twisted, duplicated or merged limbs.
- Body count: one head, two arms and two legs per person, and the correct NUMBER of people for the scene; never merge two bodies, never add a stray extra hand/leg, never leave a floating disconnected limb.
- Keep the pose physically plausible and relaxed, so the model looks like a real photographed human while the printed textile stays clearly visible.

THE ONLY ACCEPTABLE TRANSFORMATIONS:
- Realistic fabric distortion at seams, drape folds, body curves, and
  pleats - exactly as cloth behaves in real photographs.
- Realistic light fall-off across the fabric (highlights and shadows
  on the print are OK; print colour itself does not change).
- Realistic fabric thickness (the print at a sharp fold may compress
  slightly, the way real cloth does).

If the model's beauty and the print's fidelity ever conflict - THE
PRINT WINS. Always.
`;


// =====================================================================
//  PHOTOREALISM ENGINEERING - RAW-photo physics layer
// =====================================================================
const photorealismBlock = `
PHOTOREALISM ENGINEERING - TREAT THIS AS A RAW FILE FROM A REAL CAMERA:

This output must be indistinguishable from a 14-bit RAW photograph
straight out of a professional camera body. A trained retoucher
opening it in Lightroom should not see any AI signature.

OPTICAL PHYSICS (subtle, never exaggerated):
- Depth-of-field falls off gradually with real lens math - sharpness
  rolls off on a curve, not in a hard plane.
- Bokeh discs at out-of-focus highlights are slightly cat-eye shaped
  at the frame edges (real lens vignetting).
- Faint, natural chromatic aberration on high-contrast edges in the
  corners - a 1-2 pixel red/blue fringe is realistic, never magenta.
- Subtle lens vignetting darkening the corners by ~10-15%.
- Diffraction softness at f/8+ if the scene calls for it.

SENSOR + EXPOSURE PHYSICS:
- 14-bit dynamic range - highlights roll off into soft shoulder, not
  clipped white. Shadows hold detail, not crushed black.
- Natural grain structure: a fine, organic ISO grain pattern
  appropriate to the ISO specified in the camera line. Never digital
  noise. Never mushy noise reduction.
- Micro-contrast in skin, hair, and fabric weave - the way modern
  full-frame sensors render real surface texture.
- No over-sharpened halos. No HDR look. No tone-mapped flatness.

AMBIENT PHYSICS:
- Contact shadows where the model's foot meets the floor, where hands
  meet hips, where clothes meet skin. Soft, anchored, never floating.
- Ambient occlusion in skin creases, between fingers, under the jaw,
  inside garment folds - small darkenings where light cannot reach.
- Realistic light bounce: a red garment subtly bounces warm light
  onto the underside of the jaw. Indoor incandescents bounce warm
  light onto everything in the lower half of frame.
- Skin shows real subsurface scattering - light penetrates 1-2mm into
  skin and re-emerges slightly redder, especially at ear edges,
  fingertips, and the soft side of the nose.
- A few airborne dust particles softly catching the key light if the
  scene is indoor - only a few, never theatrical.

COLOUR SCIENCE:
- Skin tones in the natural Caucasian/South-Asian/East-Asian/African
  ranges depending on the model cast - never orange, never magenta,
  never grey. Match the Fitzpatrick scale honestly.
- White balance neutral to the lighting condition (warm 3200K indoor,
  cool-warm 5600K outdoor golden hour).
- Colour palette respects the source textile - the rest of the scene
  is chosen to complement the print, never compete with it.
`;


// =====================================================================
//  CAMERA + LIGHTING per shoot style
// =====================================================================
let cameraSpec, lightingSpec, referenceSpec;

if (isWhiteBg) {
  cameraSpec    = 'Captured on a Phase One XF IQ4 medium-format camera, Schneider 80mm LS lens at f/8, ISO 50, 1/200s. Clinical e-commerce composition, product centred, model held in clean catalogue pose.';
  lightingSpec  = 'Lighting: bright, perfectly even high-key catalogue lighting - the background is blown out to pure #FFFFFF white while the garment keeps true, accurate colours with no colour cast, no rim-light theatrics and no lighting equipment visible anywhere in the frame.';
  referenceSpec = 'Visual reference: the main product image standard of Amazon India, Flipkart and Myntra fashion listings - pure white background, true colours, product fills the frame.';
} else if (isOutdoor) {
  cameraSpec    = 'Captured on a Canon EOS R5 with 85mm f/1.4 prime, shot at f/2.8, ISO 200, 1/500s. Shallow depth of field with the model in sharp focus and background softly blurred. Natural perspective, no fisheye, no wide-angle distortion.';
  lightingSpec  = 'Lighting: golden-hour ambient daylight, soft warm key from camera-left, subtle bounce fill from a silver reflector, gentle natural rim from skylight. No harsh shadows. Skin keeps a healthy natural warmth, not orange.';
  referenceSpec = 'Luxury ethnic fashion campaign photography similar to Myntra Luxe, Kalki Fashion, Aza Fashion, and Sabyasachi campaign aesthetics.';
} else if (isLuxury) {
  cameraSpec    = 'Captured on a Hasselblad H6D-100c with HC 100mm f/2.2, shot at f/4, ISO 100. Medium-format clarity, painterly fall-off, micro-contrast in fabric weave clearly visible.';
  lightingSpec  = 'Lighting: a large window-shaped softbox high camera-left as the key, plus a soft bounce fill on the opposite side so the GARMENT PRINT stays fully visible and well-exposed - editorial mood, but NEVER so dark that the print, colours or fabric detail are lost. A gentle hair / rim light separates the model from the background. Refined and cinematic, never muddy, never underexposed.';
  referenceSpec = 'Visual reference: a Sabyasachi or Tarun Tahiliani campaign - heritage luxury, controlled palette, restrained styling.';
} else if (isStudio) {
  cameraSpec    = 'Captured on a Sony A7R V with 70-200mm GM II at 135mm, f/5.6, ISO 100, 1/160s. Compressed perspective typical of professional studio catalogue work, full-body or three-quarter framing.';
  lightingSpec  = 'Lighting: large octabox key at 45 degrees camera-right, fill softbox camera-left at half power, hair light from rear-top, seamless paper backdrop in a neutral mid-tone. Soft directional shadows on fabric folds.';
  referenceSpec = 'Visual reference: the clean professional catalogue look of Fabindia, Westside, Manyavar or Biba lookbooks - commercial, well-lit, fabric-forward.';
} else if (isHomeTextile) {
  cameraSpec    = 'Captured on a Fujifilm GFX 100S with 32-64mm zoom at 45mm, f/5.6, ISO 200, tripod-mounted. Architectural perspective straightened in post, no wide-angle distortion of furniture.';
  lightingSpec  = 'Lighting: large window daylight from the side, soft bounce fill, practical lamps glowing warm in the background for ambient depth. Interior-magazine lighting, never flash-flat.';
  referenceSpec = 'Visual reference: the styled interior photography of Architectural Digest India and Good Homes magazine - lived-in but elegant, never showroom-sterile.';
} else {
  cameraSpec    = 'Captured on a Sony A7R V with 50mm f/1.4 GM, shot at f/2.8, ISO 200, 1/250s. Honest natural perspective.';
  lightingSpec  = 'Lighting: large softbox key with subtle fill, controlled shadows that reveal fabric texture and drape.';
  referenceSpec = 'Visual reference: clean Indian e-commerce fashion photography.';
}


// =====================================================================
//  POSE / VIEW
// =====================================================================
let poseInstruction = '';
if      (poseKey.includes('side'))         poseInstruction = 'Pose the model in a relaxed three-quarter turn (about 30-45 degrees off-axis from the lens), one shoulder slightly forward, weight on the back foot. The fabric print on the front of the garment must remain clearly visible; do not turn into a strict profile.';
else if (poseKey.includes('walking'))      poseInstruction = 'Pose: a single mid-stride frame captured at the moment the lead foot lands. Arms swing naturally - not posed. Slight forward lean. The garment shows believable motion blur only in the lower hem; the face and torso remain sharp.';
else if (poseKey.includes('sitting'))      poseInstruction = 'Pose: seated naturally on a neutral bench, stool or low ledge. Spine relaxed, never ramrod-straight. Hands rested. The fabric drape falls realistically across the lap with believable gravity creases.';
else if (poseKey.includes('close'))        poseInstruction = 'Composition: tight torso-to-thigh crop showing weave detail, stitching, button placket and fabric drape. Model partially in frame - head and shoes cut off intentionally, magazine-style.';
else if (poseKey.includes('back'))         poseInstruction = 'Pose: model turned slightly over the shoulder, looking back at the lens. Hair falls naturally on one side. Garment back panel fully visible.';
else if (poseKey.includes('half body'))    poseInstruction = (isMannequin
  ? 'FRAMING - HALF BODY (MANNEQUIN, CRITICAL): an UPRIGHT STANDING upper-body bust / torso display form with NO legs and NO seat - never seated, no chair, stool or bench. Waist-up catalogue crop from a clear gap of background above the top of the form (never cut) down to the hips. No trousers, legs, feet or stand base in frame; the whole upper garment from collar to hem fills most of the frame.'
  : 'FRAMING - HALF BODY (CRITICAL): a STANDING waist-up portrait - the model stands upright (never seated). Camera at chest height, 85mm lens. Leave a clear gap of empty background ABOVE the head: the WHOLE head and hair are fully inside the frame and are NEVER cut. Crop at the hips, just below the hem of the top - nothing below the upper thigh (no knees, legs or shoes; the lower garment at most a thin sliver at the bottom edge). The entire upper garment - collar, both sleeves and hem - is visible and fills most of the frame. Never crop at the elbows or wrists.');
else if (poseKey.includes('full body'))    poseInstruction = 'Composition: a true FULL-BODY shot framing the model from the top of the head down to the shoes (the head is NEVER cut), with a little headroom above and floor visible below the feet. The ENTIRE garment from collar to hem must be visible. Do NOT crop the head or feet and do NOT zoom into a half-body crop.';
else if (poseKey.includes('auto'))         poseInstruction = 'Pose: choose the most flattering catalogue pose for this garment so that the printed pattern is maximally visible and the silhouette reads cleanly.';
else if (poseKey.includes('top'))          poseInstruction = 'Composition: directly overhead flat-lay, camera perfectly parallel to the surface. Product laid flat with natural soft creases, fabric edges aligned but not surgically straight.';
else if (poseKey.includes('folded'))       poseInstruction = 'Composition: product neatly folded as it would arrive in a premium retail box. Visible fold lines, soft fabric edges, one corner gently lifted to reveal the pattern repeat.';
else if (poseKey.includes('room corner'))  poseInstruction = 'Composition: interior corner shot, two walls meeting at the rear-third of the frame, product styled as a natural part of the room - never floating, never centred.';
else if (poseKey.includes('hotel'))        poseInstruction = 'Composition: editorial hotel-room interior, bed or seating area as foreground, soft window light from the side, the textile product as the visual hero of the scene.';
else if (poseKey.includes('lifestyle'))    poseInstruction = 'Composition: model interacting with the environment as if mid-moment - pouring tea, looking out a window, reading. The garment is the focus but the moment is real, not staged.';
else if (poseKey.includes('front'))        poseInstruction = 'Pose: relaxed front-facing catalogue stance. Shoulders square but not stiff, one hand at the side, the other resting lightly at the waist or pocket. Subtle weight shift to one leg so the silhouette feels human, not symmetrical.';
else                                       poseInstruction = `Pose / scene direction (user-specified): ${pose}. Render this exactly as described while keeping the printed pattern clearly visible.`;

if (studioPose && lower(studioPose) !== 'auto') {
  poseInstruction = 'STUDIO POSE (' + studioPose + '): direct the model into a clean, professional "' + studioPose + '" studio catalogue pose, keeping the full printed garment clearly visible and the silhouette reading cleanly.';
}


// =====================================================================
//  MODEL CASTING + IMPERFECTION CHECKLIST
// =====================================================================
let modelInstruction = '';

if (isNoModel) {
  modelInstruction = 'NO HUMAN MODEL in this image. Product-only composition. Use a clean flat-lay, an invisible-ghost-mannequin technique, or a fabric drape against a neutral background depending on the product.';
} else if (isMannequin) {
  // v24: stylish, varied mannequin shoots. If the website sent a specific
  // "MANNEQUIN SHOOT" brief (custom_instruction) that brief wins; otherwise a
  // random premium variant is chosen so repeat shoots never look identical.
  const __mqMen = [
    'a headless tailor\'s dress form on a black turned-wood tripod stand with a slim chrome neck post',
    'a glossy black abstract full-body mannequin with a mirror-chrome faceless head, one hand on the hip',
    'a matte-black abstract faceless full-body mannequin standing tall, weight on one leg',
    'a matte-white faceless full-body mannequin with one hand in the pocket and a slight hip shift'
  ];
  const __mqLadies = [
    'a matte-white abstract faceless female full-body mannequin in a fashion stance, one hand on the hip',
    'a vintage ivory linen female dress form on an ornate curved brass tripod stand',
    'a glossy black abstract faceless female full-body mannequin standing elegantly with one knee softly bent'
  ];
  const __mqKids = [
    'a glossy white abstract faceless CHILD full-body mannequin standing on a clear glass base plate',
    'a small white CHILD dress form on a turned wooden stand',
    'a polished chrome faceless CHILD full-body mannequin seated on a small wooden bench'
  ];
  const __mqBust = isKidsProduct
    ? ['a small white CHILD upper-body dress form on a turned wooden stand, framed waist-up']
    : (isFemaleProduct
      ? ['a vintage ivory linen female upper-body dress form, framed waist-up', 'a matte-white abstract faceless female upper-body bust mannequin (no legs), framed waist-up']
      : ['a headless tailor\'s upper-body dress form with a slim chrome neck post, framed waist-up', 'a glossy black upper-body bust mannequin (no legs) with a mirror-chrome faceless head, framed waist-up']);
  const __mqVariants = poseKey.includes('half body') ? __mqBust : (isKidsProduct ? __mqKids : (isFemaleProduct ? __mqLadies : __mqMen));
  const __mqPick = __mqVariants[Math.floor(Math.random() * __mqVariants.length)];
  modelInstruction = /MANNEQUIN SHOOT/i.test(customInstruction)
    ? 'MANNEQUIN PRESENTATION: follow the MANNEQUIN SHOOT brief in the user instruction exactly (mannequin type, finish, pose and backdrop). The mannequin is faceless with no human skin and no hair. The garment fits it like a tailored catalogue display and the print stays clearly visible and unchanged.'
    : 'MANNEQUIN PRESENTATION: present the garment on ' + __mqPick + '. The mannequin is faceless with no human skin and no hair. The garment fits it like a tailored catalogue display and the print stays clearly visible and unchanged. Keep the scene, background and lighting exactly as selected in the SCENE section of this brief - never default to a plain studio backdrop unless that is the selected style.';
} else {
  let ethnicityLine = '';
  if (u.includes('family')) ethnicityLine = 'A warm, natural family group for a premium fashion catalogue: two adults plus one or two children, all clearly visible and tastefully styled (overall cast look: ' + modelLook + '). Real, lived-in interactions, never stiff stock poses. The printed textile garment is worn by the family members so the print is clearly visible on the clothing.'; else if (u.includes('couple')) ethnicityLine = 'A natural-looking couple of two adult models for a premium fashion catalogue (overall cast look: ' + modelLook + '). A subtle, authentic connection, never theatrical. The printed textile garment is worn by the couple so the print is clearly visible.'; else if (lookKey.includes('indian'))         ethnicityLine = 'Indian / South Asian features - warm brown skin tone (Fitzpatrick III-IV), dark brown eyes, dark hair styled simply, age 22-30, height-proportional build of a working fashion model. Looks like the kind of person you would see in a Tata Cliq or Nykaa Fashion campaign.';
  else if (lookKey.includes('western') ||
           lookKey.includes('european'))   ethnicityLine = 'European features - fair to medium skin tone, light or dark hair, age 22-30, fashion-model proportions. Looks like a working model from a Zara or COS campaign.';
  else if (lookKey.includes('asian'))      ethnicityLine = 'East Asian features - fair to light golden skin tone, dark hair, age 22-30. Looks like a working model from a Uniqlo or Muji campaign.';
  else if (lookKey.includes('middle'))     ethnicityLine = 'Middle Eastern features - olive skin tone, dark hair, dark eyes, age 22-30, refined modelling proportions. Looks like a campaign model for a Dubai-based luxury label.';
  else if (lookKey.includes('african'))    ethnicityLine = 'African features - rich deep skin tone (Fitzpatrick V-VI), natural hair textures, age 22-30. Looks like a working model from a contemporary West African or Lagos Fashion Week campaign.';
  else if (lookKey.includes("latin")) ethnicityLine = "Latin American features - warm tan / olive skin tone, dark wavy hair, dark eyes, age 22-30, fashion-model proportions. Looks like a working model from a Latin American fashion campaign.";
  else if (lookKey.includes('couple'))     ethnicityLine = 'A natural-looking couple of two adult models. Their connection is subtle - a glance, a hand near the shoulder - never forced or theatrical.';
  else if (lookKey.includes('family'))     ethnicityLine = 'A warm family group: two adults plus 1-2 children. Real-feeling interactions, not staged smiles to camera. Family is fully clothed and the focus is the textile product.';
  else                                     ethnicityLine = `A professional fashion model with ${modelLook} features.`;

  let genderHint = '';
  if (isFemaleProduct) genderHint = 'The model is FEMALE - graceful, confident posture, hair styled simply, modest tasteful presentation. Age appropriate to the product (22-30 for adult-women products, 6-12 for girls\' products).';
  else if (isMaleProduct) genderHint = 'The model is MALE - relaxed confident posture, well-groomed hair, clean shaven or trimmed beard appropriate to the look (22-30 for adult-men products, 6-12 for boys\' products).';
  else genderHint = 'Gender of the model should match the product category naturally.';

  // Honour the explicit Model Look role from model_type (e.g. Indian Woman / Asian Boy).
  const _explFemale = /(woman|female|girl)/.test(lookKey);
  const _explMale   = /(man|male|boy)/.test(lookKey);
  const _explChild  = /(boy|girl)/.test(lookKey);
  if (_explChild) {
    genderHint = (_explFemale ? 'The model is a YOUNG GIRL' : 'The model is a YOUNG BOY') + ' aged 5-11 (this OVERRIDES any adult age mentioned above) - wholesome, fully-clothed, brand-safe child catalogue styling, no suggestive posing.';
  } else if (_explFemale) {
    genderHint = 'The model is a FEMALE adult, age 22-30 - graceful confident posture, hair styled simply, modest tasteful presentation.';
  } else if (_explMale) {
    genderHint = 'The model is a MALE adult, age 22-30 - relaxed confident posture, well-groomed hair, clean-shaven or neatly trimmed beard.';
  }
  let kidsLine = '';
  if (isKidsProduct) {
    kidsLine = '\nKIDS DIGNITY: the child model is fully clothed, age 4-10, photographed in a wholesome catalogue manner. Natural play-like posture. No suggestive posing. No alone-in-bedroom scenes. Always tasteful and brand-safe.';
  }

  modelInstruction = `MODEL CASTING:
${ethnicityLine}
${genderHint}${kidsLine}

HUMAN IMPERFECTION CHECKLIST - MANDATORY TO AVOID THE "AI LOOK":

Skin texture (most important):
- Visible pores on the nose, forehead, cheeks - at sensor-level detail.
- Faint vellus hair (peach fuzz) on the cheek and jawline, catching
  light softly.
- One or two natural micro-features: a small mole, a tiny freckle, a
  faint scar, or slight redness at the side of the nose. Never a
  perfectly clean face.
- Subsurface scattering - light penetrates the skin and re-emerges
  slightly warmer at the ear edges, nostril rim, fingertips, lips.
- Natural asymmetry between the left and right side of the face.

Eyes:
- Realistic moisture film over the cornea.
- Individual eyelashes visible - not a clumpy black mass.
- Catchlights from the actual light setup specified - asymmetric
  between the two eyes (each eye catches a slightly different angle).
- Faint vein traces in the sclera (whites are not pure white).
- Iris has a real radial fibre structure - never a flat colour disc.

Hair:
- Natural flyaways at the temples and crown.
- Individual strands visible at the parting and along the hairline.
- Light penetrates the outermost strands and creates a soft rim glow
  where the key light hits.
- Realistic hair-fabric contact - strands fall across the shoulder of
  the garment, not floating above it.

Hands (Nano-Banana fails here most):
- Exactly five fingers per hand. Count them.
- Each fingernail has a visible cuticle and nail bed.
- Knuckle creases on the back of the hand.
- Tendon shadows when the hand is partially flexed.
- Realistic finger thickness tapering - not sausage-fingers, not
  pencil-fingers.
- Where a hand touches the garment, the fabric compresses slightly
  and a contact shadow forms.

Body:
- Real working-model proportions - not exaggerated, not Barbie/Ken.
- Visible shoulder structure, collarbones, natural arm muscle tone.
- Where the garment touches the body, fabric tension lines appear at
  shoulder seam, bust point, waist, and elbow crease - exactly as a
  real photographer would see them.

EXPRESSION:
${expression}. The expression must feel CAUGHT, not held - a frame
plucked from a moment of natural emotion. Eye contact is soft, not
intense. Lips are relaxed, never a forced perfect smile. Slight
asymmetry in the smile or brow makes it real.`;
}

const premiumBeautyDirection = `
PREMIUM FASHION BEAUTY DIRECTION:

The model is professionally styled, the way premium Indian ethnic
brand campaigns style their cast - but inside the bounds of REALISM:

Face:
- Glowing healthy skin, hydrated, with natural sheen on the high
  points (forehead, nose bridge, cheekbones).
- Subtle professional makeup - foundation matched to skin, light
  contour, defined brow, neutral or rose lip.
- Skin colour is harmonious, not orange, not over-bronzed.
- Confident catalogue expression, never selfie-style.

Hair:
- Properly styled by a fashion-shoot grooming team - soft volume,
  clean hairline, intentional flyaways.
- Not messy, not laundromat-fresh either - somewhere between.

Wardrobe styling beyond the garment:
- Any visible secondary clothing (e.g. churidar under the kameez,
  blouse under the saree) is in a complementary solid shade chosen
  by an art director, never a clashing print.

Brand reference for overall look:
- Myntra Luxe, Aza Fashion, Kalki Fashion, Manyavar, Biba, Tata
  Cliq Luxury, House of Anita Dongre.

REJECT all of these immediately:
- Casual home-photo vibe.
- Selfie / mobile camera aesthetic.
- Tired face, dull skin, no-makeup base, ordinary local look.
- Tourist-photo vibe, terrace-shoot vibe.
- Random candid expression that doesn't belong in a catalogue.
`;

// =====================================================================
//  PRODUCT-SPECIFIC TAILORING (every category, deeply)
// =====================================================================
let productInstruction = '';
let garmentNegatives = '';

// == APPAREL: MEN ==
if (p.includes("men's shirt") || (p.includes('shirt') && !p.includes('t-shirt') && !p.includes('tshirt') && !p.includes('boys'))) {
  productInstruction = 'GARMENT - MEN\'S FORMAL SHIRT: tailored woven shirt with crisp turn-down collar standing properly at the neck, clean front placket sitting flat on the chest with mother-of-pearl buttons in correct count (7-8 from collar to hem), shoulder seam falling exactly at the shoulder point, sleeve cuff with two buttons, square hem with optional side vents. No chest pocket unless explicitly requested. The shirt is worn UNTUCKED - the hem falls naturally outside and over the trouser waistband, never tucked in. Pattern across the placket and chest must continue naturally as if cut from a single piece of fabric. The model ALSO wears a complete, fully-covering coordinated LOWER garment (trousers or jeans for men; leggings, palazzo, churidar or skirt for women) in a clean complementary solid colour - the model is fully clothed, NEVER bare-legged and NEVER shown without a lower garment.';
} else if (p.includes('male kurta') || (p.includes('kurta') && !p.includes('kids') && !p.includes('boys') && !p.includes('kurti'))) {
  productInstruction = 'GARMENT - MEN\'S KURTA: traditional Indian menswear kurta with mandarin collar or band-collar, full-length sleeves to the wrist, knee-length hem with side slits at the hip, button placket from collar to mid-chest. Loose comfortable fit. The print runs continuously across the front panel without seam disruption. Pair with a churidar, pyjama or straight-cut trouser.';
} else if (p.includes('pathani')) {
  productInstruction = 'GARMENT - PATHANI SUIT: long kurta (mid-thigh to knee length) with mandarin collar, full sleeves, matching Pathani-cut trousers (tapered ankle, wider at hip). Subtle structured look, traditional Pathan-Afghan silhouette.';
} else if (p.includes('3 piece suit') || p.includes('three piece')) {
  productInstruction = 'GARMENT - 3-PIECE FORMAL SUIT: matching jacket + waistcoat + trouser set. Jacket with notch lapels rolled crisply, single-breasted two-button closure, jacket buttoning at the natural waist, single back vent. Waistcoat fitted at the torso with five buttons. Trousers with slight break at the shoe. No bunching at the buttons.';
} else if (p.includes('2 piece suit') || p.includes('two piece')) {
  productInstruction = 'GARMENT - 2-PIECE FORMAL SUIT: jacket + trouser set. Jacket with notch or peak lapels, single-breasted, jacket button at the natural waist, side vents. Trousers tailored with slight break. Crease lines straight on the trouser front.';
} else if (p.includes('blazer')) {
  productInstruction = 'GARMENT - BLAZER: tailored single-breasted blazer with notch lapels, two-button front, structured shoulder line, working sleeve buttons, side vents. Worn open or closed naturally. The print on the body and lapels lines up correctly.';
} else if (p.includes('waistcoat')) {
  productInstruction = 'GARMENT - WAISTCOAT: fitted V-neck waistcoat with five buttons, welt pockets at the waist, adjustable strap at the back, snug across the torso with no pulling. Worn over a shirt of complementary colour. The model ALSO wears a complete, fully-covering coordinated LOWER garment (trousers or jeans for men; leggings, palazzo, churidar or skirt for women) in a clean complementary solid colour - the model is fully clothed, NEVER bare-legged and NEVER shown without a lower garment.';
} else if (p.includes('hoodie')) {
  productInstruction = 'GARMENT - HOODIE: relaxed casual hoodie with drawstring hood, kangaroo pocket at the front, ribbed cuffs and bottom band, dropped shoulder for a contemporary streetwear silhouette. Fleece interior visible at the hood lining. The model ALSO wears a complete, fully-covering coordinated LOWER garment (trousers or jeans for men; leggings, palazzo, churidar or skirt for women) in a clean complementary solid colour - the model is fully clothed, NEVER bare-legged and NEVER shown without a lower garment.';
} else if (p.includes('co-ord') || p.includes('cord set') || p.includes('cord')) {
  productInstruction = 'GARMENT - CO-ORD SET: matching top + bottom (shirt + pant, or kurti + pant) in the same print. The two pieces clearly belong together. Pattern continuity respected even across the waistband break.';

// == APPAREL: LADIES ==
} else if (p.includes('saree')) {
  productInstruction = 'GARMENT - SAREE (reproduce the blouse, body and pallu DIRECTLY from the uploaded LAYOUT - do not invent or default any part): the uploaded artwork is a COMPLETE saree layout. ANALYSE the image yourself and identify its zones, then build each part FROM THE DESIGN ITSELF. (1) BLOUSE: look at the layout and find the BLOUSE PANEL - usually a narrow lengthwise strip of small repeating buti / motifs along one edge, or a distinct separate piece - and make the fitted blouse EXACTLY from that panel, matching its real print, motifs and colours. Do NOT replace the blouse with a plain colour of your own choosing; the blouse must reflect whatever the design blouse panel actually shows. If (and only if) the design blouse panel is itself a plain solid, then a plain blouse is correct - otherwise reproduce its print. (2) SAREE BODY: the large central field (for example the striped or all-over area framed by its border) forms the pleats and the body of the drape. (3) PALLU: the wide, heavily ornamented band of borders at the OPPOSITE end is the pallu, draped over the LEFT shoulder so its rich motif is clearly visible. Render an authentic Indian saree drape - 5.5 m pleated neatly at the waist (5-7 pleats tucked in), the body print flowing across the drape, and the pallu over the left shoulder. PRESERVE every zone of the print EXACTLY per RULE #0 - same colours, motifs and pattern scale, nothing recoloured or simplified. The underskirt edge stays concealed.';
} else if (p.includes('lehenga')) {
  productInstruction = 'GARMENT - LEHENGA CHOLI SET: three-piece ensemble. Ghagra (long flared skirt) with natural pleated flare reaching ankle-length, fitted choli (blouse) with proper bust dart shaping, and a dupatta draped across one shoulder or held in the hand. The print continuity is preserved across the lehenga panels (typically 12-16 kalis / panels). Heavier border at the hem.';
} else if (p.includes('salwar') || p.includes('kameez') || p.includes('anarkali') || p.includes('ladies suit')) {
  productInstruction = 'GARMENT - INDIAN SALWAR SUIT (authentic 3-piece): a proper traditional ladies salwar suit. The kameez top falls to the knee or below (longer flared kameez for Anarkali). The bottom MUST be a genuine LOOSE Indian SALWAR - wide and softly pleated at the waist, tapering to a gathered cuff at the ankle (Patiala / regular salwar volume). It is STRICTLY FORBIDDEN to render skin-tight churidar, leggings, jeggings, tights, pyjama-bottoms or western trousers - the lower must clearly read as a flowing traditional Indian salwar. A matching dupatta is draped naturally over one shoulder or across the chest. All three pieces share one coordinated colour story and fabric weight.';
} else if (p.includes('kurti')) {
  productInstruction = 'GARMENT - KURTI: women\'s tunic hitting mid-thigh, fitted or A-line silhouette, round or boat-neck neckline, three-quarter or full sleeves. The model MUST wear a coordinated lower garment (churidar, leggings or palazzo) in a SOLID colour pulled from the kurti print palette - the model is NEVER bare-legged and NEVER shown without a lower. The kurti print is the hero of the front panel while the lower stays a clean complementary solid.';
} else if (p.includes('sharara')) {
  productInstruction = 'GARMENT - SHARARA SUIT: short kurti or peplum top paired with wide-flared sharara pants that flare dramatically from the knee. Pant volume falls beautifully to the floor. Dupatta included.';
} else if (p.includes('palazzo')) {
  productInstruction = 'GARMENT - PALAZZO SUIT: kurti or kurta paired with wide-leg palazzo pants flared from the waist down. Pants fall in soft folds to the ankle. Comfortable elegant silhouette.';
} else if (p.includes('gown')) {
  productInstruction = 'GARMENT - GOWN: floor-length women\'s gown with a fitted bodice and flared or A-line skirt. Visible neckline cut, waist seam if applicable, hem falling naturally without floating. Indo-Western styling acceptable. The fabric drape obeys gravity.';
} else if (p.includes('dress') && !p.includes('frock')) {
  productInstruction = 'GARMENT - WESTERN DRESS: knee-length or midi dress, fitted bodice with waist seam, A-line or sheath skirt, visible neckline (round / V / square / boat), sleeve length as the pattern best suits. Hem falls naturally with gravity creases.';
} else if (p.includes('blouse')) {
  productInstruction = 'GARMENT - SAREE BLOUSE: fitted choli with princess seams or darts for a custom-tailored fit. Short or three-quarter sleeves, back closure (hook or tie), neckline cut as the design suggests (round / sweetheart / boat). Visible stitching at darts and seams. The model is fully draped in a coordinated plain saree with a petticoat so the lower body is FULLY covered - never shown in just the blouse, never bare-legged, never with an exposed lower body.';
} else if (p.includes('dupatta') || p.includes('stole') || p.includes('scarf')) {
  productInstruction = 'GARMENT - DUPATTA / STOLE / SCARF: long fabric rectangle draped naturally - over one shoulder, across the chest, or held in the hand. Length 2.0-2.5 m. The print and the border are both visible. Subtle drape creases.';

// == SUDAN WEAR (international niche: same engine, Sudanese garment rules) ==
} else if (p.includes('toub') || p.includes('thobe') || p.includes('thawb')) {
  productInstruction = 'GARMENT - SUDANESE TOUB (authentic full-length draped wrap, the ENTIRE garment made from the uploaded print): dress an elegant Sudanese female model in a traditional Sudanese Toub created ENTIRELY from the uploaded textile design. The fabric is wrapped authentically around the whole body and gracefully draped up and over the HEAD and SHOULDERS in genuine Sudan Toub draping style, falling FULL-LENGTH to the floor with realistic fabric flow, soft draping folds and true textile texture. The uploaded print stays UNCHANGED and clearly visible across the ENTIRE garment - same colours, motifs and pattern placement per RULE #0. The fabric is OPAQUE and substantial like a real garment: it is STRICTLY NOT a thin see-through dupatta or chunri, and STRICTLY NOT a plain / solid dress with a separate scarf - the uploaded print must cover the WHOLE draped garment (body and head-drape together), not merely a scarf. Full body visible, sophisticated pose, premium luxury ethnic-fashion catalogue presentation.';
  garmentNegatives = 'saree drape, abaya cut, hijab-only styling, salwar suit, churidar, leggings, lehenga, western dress, plain dress with a separate scarf, see-through dupatta or chunri over a bare dress, print only on a scarf, extra embroidery not in the uploaded design, extra prints not in the uploaded design, fabric colour changed, pattern modified, cropped body, distorted hands';
} else if (p.includes('jalabiya') || p.includes('jalabia') || p.includes('jellabiya')) {
  productInstruction = 'GARMENT - SUDANESE JALABIYA: a loose, flowing ankle-length womens gown cut in one relaxed silhouette from shoulder to hem, with a round or lightly embroidered neckline, long full sleeves, and an unfitted comfortable body that skims (never clings to) the figure. The uploaded print covers the FULL jalabiya as one continuous cloth, flowing without interruption down the front; any decorative border sits at the neckline, cuffs and hem. Soft vertical drape folds true to a lightweight festive fabric. Modest, elegant, occasion-wear presentation.';
} else if (p.includes('abaya')) {
  productInstruction = 'GARMENT - ABAYA (modest overlayer robe): a full-length, floor-skimming robe with a straight columnar silhouette falling cleanly from the shoulders, long sleeves and a graceful vertical drape. The uploaded print covers the entire abaya as a single continuous cloth; where the design suits, the print may be concentrated as an elegant front panel and along the sleeve openings while the body stays in a coordinated tone. Worn over an inner garment with a matching hijab head-covering framing the face. Refined, modest, premium styling.';
} else if (p.includes('bridal')) {
  productInstruction = 'GARMENT - SUDANESE BRIDAL LOOK: present the uploaded print as a luxurious bridal toub or jalabiya in rich ceremonial fabric, draped gracefully over the bride with full modest coverage. Style with tasteful gold jewellery (earrings, necklace, bangles), subtle henna on the hands and a warm regal posture. The print stays the hero and reads as one continuous luxurious cloth across the drape. Warm golden wedding-photography tones - elegant and celebratory, never gaudy.';
} else if (p.includes('pant set') || (p.includes('sudan') && p.includes('pant'))) {
  productInstruction = 'GARMENT - SUDANESE PANT SET (embellished 3-piece, modest): a complete coordinated set in the uploaded print made of THREE matching pieces - (1) a loose draped CAPE-STYLE TOP with wide BATWING sleeves that fall in soft fabric wings from the shoulders down along the arms; (2) full HAREM / DHOTI PANTS that are relaxed and generously draped through the hip and thigh and softly GATHERED at each ankle (clearly TWO separate trouser legs, NEVER a skirt and NEVER a single wrapped cloth), ending just above flat or wedge sandals; (3) a matching attached HEAD-SCARF / hijab draping over the hair and one shoulder while leaving the face open. The uploaded print flows as ONE continuous coordinated fabric across the cape top, both pant legs and the scarf, preserved exactly per RULE #0 - same colours, motifs and pattern scale. A tasteful vertical decorative panel of gold / stone embroidery may run down the centre-front and along one thigh if the design suits, but the uploaded print always stays the hero. Full-length modest coverage. Present on a poised Sudanese / Middle-Eastern female model, FULL-BODY framing so the entire set is visible (cape sleeves, BOTH gathered pant legs and the sandals), elegant catalogue pose, clean studio background.';

// == KIDS ==
} else if (p.includes('boys shirt')) {
  productInstruction = 'GARMENT - BOYS\' SHIRT: child-sized formal shirt with turn-down collar, full sleeves with single-button cuff, front placket. Age 6-10. Snug fit appropriate to a child.';
} else if (p.includes('boys kurta') || (p.includes('kids') && p.includes('kurta'))) {
  productInstruction = 'GARMENT - BOYS\' KURTA: child-sized traditional Indian kurta with mandarin collar, knee-length, full sleeves, side slits, paired with a churidar or pyjama. Age 6-10.';
} else if (p.includes('girls top') || (p.includes('top') && p.includes('jean')) || p.includes('jeans')) {
  productInstruction = 'GARMENT - GIRLS\' TOP & JEANS SET: a girls smart-casual two-piece - a printed top (the uploaded design is the hero on the top) paired with well-fitted blue denim jeans. Age 4-10. Modest, wholesome kidswear styling.';
} else if (p.includes('girls t-shirt') || (p.includes('girls') && (p.includes('t-shirt') || p.includes('tshirt')))) {
  productInstruction = 'GARMENT - GIRLS\' T-SHIRT: child-sized girls jersey-knit tee, ribbed crew or round neck, short or cap sleeves, age 4-10, paired with a coordinated skirt/shorts/leggings in a solid complementary colour. Print clear on the front panel. Wholesome catalogue presentation.';
} else if (p.includes('girls frock') || (p.includes('frock'))) {
  productInstruction = 'GARMENT - GIRLS\' FROCK: child-sized A-line frock dress, gathered or pleated skirt, age-appropriate modest neckline, sleeves can be puffed/short/full. Age 4-10. Wholesome catalogue presentation.';
} else if (p.includes('kids t-shirt') || (p.includes('kids') && p.includes('tshirt'))) {
  productInstruction = 'GARMENT - KIDS\' T-SHIRT: jersey-knit children\'s tee, ribbed crew-neck collar, short sleeves, age 4-10. Print clear on the front panel.';
} else if (p.includes('kids suit')) {
  productInstruction = 'GARMENT - KIDS\' SUIT: study the uploaded design image carefully and reproduce the SAME kids outfit style and silhouette shown in it (whether it is an ethnic kurta-pyjama set, an indo-western set, or a formal 2-piece suit), applying the uploaded print faithfully per RULE #0. Child-sized, age 6-12, neatly tailored, smart occasion look.';
} else if (p.includes('night suit')) {
  productInstruction = 'GARMENT - KIDS\' NIGHT SUIT: 2-piece pyjama set for children - short or full-sleeve top + drawstring pant. Soft cotton fabric look. Age 4-10. Comfortable home-wear presentation, not bedroom-suggestive.';
} else if (p.includes('tshirt') || p.includes('t-shirt')) {
  productInstruction = 'GARMENT - T-SHIRT: cotton jersey-knit tee with realistic drape, ribbed crew collar, sleeve hem and bottom hem clearly visible, shoulder seam at the shoulder point. Print on the front panel. The model ALSO wears a complete, fully-covering coordinated LOWER garment (trousers or jeans for men; leggings, palazzo, churidar or skirt for women) in a clean complementary solid colour - the model is fully clothed, NEVER bare-legged and NEVER shown without a lower garment.';
} else if (p.includes('trouser')) {
  productInstruction = 'GARMENT - TROUSER: tailored mens trouser with waistband, belt loops, front zip closure, side pockets, straight or slim leg, slight break at the shoe. Crease line straight down the front.';

// == HOME TEXTILE ==
} else if (p.includes('bedsheet') || p.includes('luxury bedroom')) {
  productInstruction = 'HOME TEXTILE - BEDSHEET / BEDDING SET: a fitted bedsheet draped over a king-size or queen-size bed, with two matching pillow covers tucked under, the top edge folded back slightly to show contrast piping if any. The print covers the entire visible surface. Natural soft creases from being lived in, not factory-flat. The bed sits in a tastefully styled bedroom corner.';
} else if (p.includes('curtain')) {
  productInstruction = 'HOME TEXTILE - CURTAIN: curtain panel hung from a real rod (with grommets, eyelets, or pinch-pleat header - pick the most elegant for the print), reaching from ceiling to floor with hem brushing or pooling slightly. Natural gravity folds - not perfectly straight. Daylight filtering through suggests the actual fabric weight. Print runs vertically and the repeat is respected.';
} else if (p.includes('pillow cover') || (p.includes('pillow') && !p.includes('cushion'))) {
  productInstruction = 'HOME TEXTILE - PILLOW COVER: rectangular bed pillow (50x75 cm typical) with the printed cover envelope-style or with hidden zipper, placed against the headboard of a styled bed. The print is fully visible on the front face. Soft natural compression where the head would rest.';
} else if (p.includes('cushion')) {
  productInstruction = 'HOME TEXTILE - CUSHION COVER: square cushion (45x45 cm) placed naturally on a sofa or accent chair. Subtle compression where it meets the seat, slight tilt, real-world arrangement - not perfectly squared. Piping or contrast border visible if any.';
} else if (p.includes('sofa cover')) {
  const _seatNum = (() => { const m = String(sofaSeater).match(/(\d+)/); return m ? parseInt(m[1], 10) : 3; })();
  const _seatLabel = _seatNum + '-seater';
  const _seatLayout = _seatNum >= 6
    ? ('a large L-shaped / sectional sofa with EXACTLY ' + _seatNum + ' separate seat cushions')
    : ('a single straight-row sofa with EXACTLY ' + _seatNum + ' separate seat cushions placed side by side');
  productInstruction = 'HOME TEXTILE - SOFA COVER on a ' + _seatLabel + ' sofa. CRITICAL SEAT COUNT (non-negotiable): the sofa MUST be ' + _seatLayout + ' - count the cushions: exactly ' + _seatNum + ', no more and no fewer. Do NOT silently change it to a different size. The fitted slipcover stretches over the frame with the print covering all ' + _seatNum + ' seat cushions, the full backrest and both arms, with correct proportions for a ' + _seatLabel + ' frame. Natural fabric tension and minor wrinkles where the cover meets the cushions.';
} else if (p.includes('table cover') || p.includes('table cloth')) {
  productInstruction = 'HOME TEXTILE - TABLE COVER: rectangular or round table cover draped over a dining table, hem falling 25-30 cm below the table edge on all sides. Natural fabric weight visible at the drape. Centre piece (e.g. ceramic vase) anchors the composition.';
} else if (p.includes('towel')) {
  const towelLine = towelType ? (' Styled specifically as a ' + towelType.toLowerCase() + ' towel' + (/(boy|girl|kid|baby)/i.test(towelType) ? ' - a smaller kids-size towel with playful, wholesome, child-friendly styling.' : '.')) : '';
  productInstruction = 'HOME TEXTILE - TOWEL: terry-cloth towel with visible loop texture, rolled or folded on a luxury vanity, OR hanging neatly on a chrome/brass hook. Hem and woven label edge visible. Never floating.' + towelLine;
} else if (p.includes('bathrobe')) {
  productInstruction = 'HOME TEXTILE - BATHROBE: terry or waffle-cloth bathrobe shown on a clean hanger against a spa-bathroom wall, OR worn closed by a fully-covered adult model in a refined spa setting. Print clearly visible. Modest tasteful presentation only.';
} else if (p.includes('blanket') || p.includes('quilt')) {
  productInstruction = 'HOME TEXTILE - BLANKET / QUILT: heavy blanket or stitched quilt draped over a bed or sofa, one corner folded back to show a contrast lining or border. Natural soft drape, visible quilt stitching pattern if a quilt. Print covers the full top surface.';
} else if (p.includes('rug') || p.includes('carpet')) {
  productInstruction = 'HOME TEXTILE - RUG / CARPET: rectangular rug lying flat on a wooden, marble or tile floor. Pile direction visible. One corner of the underlying floor showing. Natural shadow from ambient lighting. The print covers the entire pile surface.';
} else if (p.includes('wall fabric') || p.includes('wall panel')) {
  productInstruction = 'HOME TEXTILE - WALL FABRIC PANEL: fabric panel stretched on a wooden frame and mounted as wall art behind a sofa or bed. Print clearly visible flat on the panel. Subtle wall shadow around the panel edges suggesting depth.';
} else if (p.includes('fabric bag') || p.includes('bag')) {
  productInstruction = 'DECOR - FABRIC TOTE BAG: structured cotton or canvas tote with two webbed handles, the print covering both faces. Bag sits upright on a clean surface OR is carried over the shoulder of a model. Top edge of the bag shows interior lining.';
} else if (p.includes('upholstery')) {
  productInstruction = 'HOME TEXTILE - UPHOLSTERY FABRIC: woven upholstery wrapped over a sample accent armchair or footstool, the print covering the visible cushioned surface. Natural fabric tension along the curved frame edges.';

// == UNIVERSAL FABRIC ==
} else if (p.includes('flat fabric')) {
  productInstruction = 'UNIVERSAL FABRIC - FLAT LAYOUT: the fabric laid completely flat on a neutral matte surface (oak wood, marble, or seamless paper), photographed from directly overhead. The print repeat is fully visible across the frame. Natural soft creases acceptable but no hard wrinkles.';
} else if (p.includes('hanging fabric') || p.includes('hanging display')) {
  productInstruction = 'UNIVERSAL FABRIC - HANGING DISPLAY: a length of fabric hanging from a wooden rod against a clean studio wall. Natural gravity folds, soft sheen on the cloth, full pattern visible top to bottom.';
} else if (p.includes('rolled fabric')) {
  productInstruction = 'UNIVERSAL FABRIC - ROLLED BOLT: the fabric rolled neatly on a cardboard tube (a textile bolt) resting on a wooden surface. One end of the roll is unfurled and laid flat to reveal the print clearly. Wholesale-trade aesthetic.';
} else if (p.includes('folded fabric')) {
  productInstruction = 'UNIVERSAL FABRIC - FOLDED STACK: 3-4 different folded fabric stacks of the same print in slightly different colourways, stacked one above the other on a wooden table, retail-display style. Hem edges clean.';
} else if (p.includes('close-up') || p.includes('closeup texture')) {
  productInstruction = 'UNIVERSAL FABRIC - CLOSE-UP MACRO: extreme macro shot of the fabric surface, weave structure clearly visible (warp + weft yarns), thread count perceivable, micro fibres softly catching the light. Print colour and motif are razor-sharp.';

// == OTHER / AUTO-DETECT ==
} else if (autoDetect) {
  productInstruction = 'AUTO-DETECT PRODUCT: the user did not choose a fixed product type. Carefully analyse the uploaded design image and infer what product it is intended for (a specific garment type, or a home-textile / fabric item), then construct THAT product realistically and apply the uploaded print faithfully per RULE #0, with correct stitching, seams and natural drape.' + (otherDesc ? ' User hint about the product: "' + otherDesc + '" - follow this hint.' : '');

// == FALLBACK ==
} else if (!isHomeTextile) {
  productInstruction = 'GARMENT: properly constructed with visible seams, hem stitching, and natural fabric drape that responds to gravity and the model\'s body shape.';
} else {
  productInstruction = 'HOME TEXTILE: realistic fabric weight, drape, and stitching. Placed within a genuine interior context, never floating in space.';
}


// =====================================================================
//  OUTDOOR BACKGROUND THEME (premium - never old / rundown houses)
// =====================================================================
// v24: TRENDING editorial variants per theme (from the AF Updates studio /
// indoor / outdoor reference boards). A fresh variant is picked every
// generation so the same theme never repeats the same basic backdrop.
const __pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const outdoorThemeVariants = {
  'royal palace': [
    'a sunlit Mughal palace hall of ivory marble where a carved jaali screen casts geometric light patterns across the floor, a still reflecting pool in the foreground',
    'a palace courtyard at golden hour with a long mirror-still reflecting pool, symmetrical scalloped arches and floating diyas',
    'a rose-pink Rajasthani palace terrace with carved jharokhas and sheer silk drapes lifting in the breeze under a soft pastel dusk sky',
    'an opulent Sheesh Mahal mirror-mosaic chamber glowing with warm candle-light reflections',
    'a grand symmetrical palace corridor of repeating sandstone arches with golden sunbeams streaming in, deep one-point perspective'
  ],
  'forts': [
    'the monumental honey-sandstone ramparts of a Rajasthani hill fort at golden hour with a sweeping desert valley below, dramatic sense of scale',
    'a towering carved fort gateway with massive arched doors, warm low sun raking across the stone, a strong architectural frame around the subject',
    'a fort rooftop terrace at blue hour with glowing lanterns and chhatri domes silhouetted against a pastel sky',
    'a clean stepped fort courtyard of geometric stone stairs with long dramatic shadows - minimal architectural editorial'
  ],
  'wedding theme': [
    'a modern minimal mandap of sculptural white florals and hanging floral chandeliers over a reflective pool at dusk',
    'a palace-lawn sangeet stage with thousands of warm fairy lights and pastel floral installations, dreamy bokeh glow',
    'a joyful haldi set with sunlit marigold canopies and flowing yellow drapes, refined and editorial',
    'a grand reception with a mirrored aisle, cascading orchid installations and crystal chandeliers',
    'a destination wedding on a clifftop above the sea with a white floral arch and flowing sheer drapes at sunset'
  ],
  'sea face': [
    'a calm pastel-sunset sea with the subject standing on a single dark rock rising from the glassy water',
    'an infinity-edge terrace of minimal white architecture merging into the ocean horizon at golden hour',
    'a pristine white-sand beach with sculptural driftwood and a huge sheer fabric billowing in the sea breeze at dawn',
    'a monumental curved concrete arch on the coast framing the sea with a soft sun flare behind the subject'
  ],
  'forest': [
    'a misty ancient forest of towering trees with a mossy floor and shafts of god-rays',
    'a surreal forest glade with a floating sheer-fabric canopy and softly glowing lanterns',
    'a lush fern-and-monstera jungle with dappled light and deep emerald tones',
    'a golden autumn birch forest with a carpet of fallen leaves and soft warm light'
  ],
  'temple': [
    'a serene carved-stone temple courtyard with tall pillars, brass bells, soft morning mist and rows of lit diyas',
    'a white-marble temple corridor with intricately carved ceilings and soft bounced light',
    'a grand geometric stone step-well (baori) bathed in warm golden light, symmetrical and monumental',
    'a still lotus pond in front of a carved temple gateway at dawn with perfect reflections'
  ],
  'river site': [
    'a tranquil ghat at sunrise with clean stone steps, floating marigold diyas and soft mist over the river',
    'a still dark river dotted with giant lily pads around a wooden rowing boat, shot from above - surreal editorial',
    'a calm river bend with smooth boulders and soft golden light filtering through riverside trees',
    'a minimal pale-wood deck stretching over mirror-still water at dusk'
  ],
  'waterfall': [
    'a majestic multi-tier waterfall in a lush green gorge with soft mist and rainbow haze',
    'a flat rock in front of a silky long-exposure waterfall curtain',
    'a hidden jungle waterfall pool with turquoise water and hanging vines',
    'a dramatic cliff waterfall at golden hour with warm glowing spray'
  ],
  'mountains': [
    'snow-capped peaks above a mirror-still alpine lake with a surreal cosy sofa and floor lamp on the shore',
    'layered blue mountain ridges at sunrise seen from a high minimal stone terrace',
    'a surreal plateau of glossy mirror cubes reflecting the peaks and drifting clouds',
    'a golden alpine meadow in a high valley with a clean hazy horizon'
  ],
  'garden': [
    'a formal garden with clipped hedges, a long reflecting pool and a white pergola dripping with wisteria',
    'a luxury resort poolside with cream parasols, sage-green loungers and tropical palms',
    'an English rose garden with a white wrought-iron chair and dappled leaf shadows',
    'a manicured golf-course green with oversized sculptural white golf balls under a soft sky'
  ]
};
const outdoorThemeMap = Object.fromEntries(Object.entries(outdoorThemeVariants).map(([k, v]) => [k, __pick(v)]));
const __editorialIndoor = [
  'a dark teal-blue set lit by a single hard spotlight from above, the subject on a low glowing white plinth, deep moody vignette',
  'a sunlit ivory Mughal interior with a tall arched doorway and a carved jaali window casting patterned light on a warm stone floor',
  'a rich crimson-red retro room with a mid-century walnut sideboard, a vintage television, a round brass wall clock and a warm lamp',
  'a clean light-grey cyclorama with a sculptural stack of black crates forming a seat and platform',
  'a minimal beige set with taut cream ropes hanging from the ceiling around a round linen-draped podium',
  'a deep olive-green velvet curtain backdrop over an artificial-grass floor with scattered tennis balls - country-club editorial',
  'a warm ivory seamless studio with natural tree-trunk wood slices scattered like stepping stones',
  'a moody warm-grey studio framed by giant pale sculptural boulders',
  'a bright white sculptural interior with a curving staircase and soft window light',
  'a long sandstone corridor of repeating arches with golden sunbeams'
];
const __luxeInterior = [
  'a grand dark-green hall with a sweeping wooden staircase, a chequered marble floor and a glowing chandelier',
  'an ivory marble salon with a single statement artwork, an antique accent chair and tall silk drapes',
  'a warm wood-slat panelled lounge with globe pendant lights and a sculptural sofa',
  'a sunlit Mughal-style ivory hall with carved jaali light patterns'
];
const outdoorThemeKey  = lower(outdoorBackground);
let outdoorThemeDesc = outdoorThemeMap[outdoorThemeKey] || outdoorThemeMap['royal palace'];
// Wedding / festive themes must match the model's region AND the design mood.
if (outdoorThemeKey.includes('wedding')) {
  if (lookKey.includes('western') || lookKey.includes('european')) outdoorThemeDesc = 'an elegant WESTERN wedding setting - a classic church, vineyard or manicured-garden ceremony with white floral arches, soft drapes and warm string lights, refined and premium';
  else if (lookKey.includes('asian'))   outdoorThemeDesc = 'a refined EAST-ASIAN wedding setting - a tasteful modern banquet or garden ceremony with soft florals, lanterns and clean premium decor';
  else if (lookKey.includes('middle'))  outdoorThemeDesc = 'a luxurious MIDDLE-EASTERN wedding setting - an opulent banquet hall with gold-and-ivory drapes, ornate florals and warm chandeliers';
  else if (lookKey.includes('african')) outdoorThemeDesc = 'an elegant AFRICAN wedding celebration - a vibrant yet premium outdoor ceremony with rich florals and warm festive decor';
  else if (lookKey.includes('latin'))   outdoorThemeDesc = 'a romantic LATIN-AMERICAN wedding setting - a warm hacienda or garden ceremony with lush florals and string lights';
  else outdoorThemeDesc = outdoorThemeMap['wedding theme'] + ' - let the decor colours echo the uploaded print and never reuse a generic marigold backdrop';
}
const outdoorSceneInstruction = 'SCENE: a premium outdoor setting - ' + outdoorThemeDesc + '. The background is softly out of focus from the wide lens aperture and complements (never competes with) the textile print. STRICTLY NO old, broken, dilapidated, rundown or shabby houses or walls, NO slums, NO messy streets - the backdrop must always look premium, clean and aspirational, like a high-budget brand campaign.';

// =====================================================================
//  BACKGROUND / SCENE
// =====================================================================
// v25: Studio Professional background picker (website sends studio_background).
// Same sets as the website shoot library; a fresh trending variant per run.
const __studioBgThemes = {
  "warm minimal studio": [
    "a warm beige seamless studio with sculptural ceramic vases, dried pampas stems and soft window light casting long gentle shadows",
    "a soft sand-toned studio with rounded plaster plinths, a single olive branch in a stone vase and diffused daylight",
  ],
  "velvet lounge": [
    "a luxe lounge with deep burgundy walls, a green velvet sofa, brass lamps glowing and botanical art",
    "a moody emerald-green room with gold wall sconces, a velvet armchair, lit candles and blossom branches in a vase",
  ],
  "forest glade": [
    "a misty ancient forest with a mossy floor and shafts of soft morning light",
    "an outdoor forest-glade setting under a canopy of sheer white fabric on a wooden frame, a jute rug on the grass and warm lanterns",
  ],
  "desert canyon": [
    "a dramatic red sandstone canyon at golden hour with warm raking light",
    "an open desert landscape under a clear blue sky with soft rolling dunes and a single vintage carved chair",
  ],
  "mirror lake": [
    "a still mirror-water lake reflecting the product under a soft pastel sky",
    "snowy pink-lit mountain peaks at dusk over a frozen mirror lake with a glowing floor lamp",
  ],
  "stone arch view": [
    "a weathered stone arch framing a calm blue lake and distant mountains, warm sunlight on the stone floor",
    "a white-washed Mediterranean terrace arch overlooking the sea, soft blue shadows and a terracotta pot",
  ],
  "tropical jungle": [
    "a top-down view with the product surrounded by a dense jungle of glossy monstera and palm leaves",
    "a lush greenhouse with tall tropical plants, warm golden sunlight streaming through glass and soft atmospheric mist",
  ],
  "surreal seashell": [
    "a surreal luxury set: a giant white seashell sculpture on a soft beige floor scattered with pearls",
    "a dreamy pastel set with a giant pearl-white clam shell, soft satin drapery and scattered pearls",
  ],
  "grand staircase hall": [
    "a grand dark-green hall with a sweeping wooden staircase, a chequered marble floor and a glowing crystal chandelier",
    "a heritage library hall with tall bookshelves, a curved brass staircase and warm lamp light",
  ],
  "golden meadow": [
    "a golden dry-grass field under a soft overcast sky",
    "a lush green meadow full of wildflowers under a huge billowing translucent fabric sky",
  ],
  "spotlight plinth": [
    "a dark teal-blue studio lit by a single hard spotlight from above, a low glowing white rectangular plinth, deep moody vignette and a long soft shadow",
    "a deep midnight-navy studio with a single overhead spotlight pooling on a glossy black round plinth",
    "a warm terracotta seamless studio with a hard spotlight circle on the floor and a low white box plinth",
  ],
  "retro red room": [
    "a rich crimson-red retro room: a mid-century walnut sideboard with a vintage television and record player, a round brass wall clock and a warm glowing table lamp",
    "a mustard-and-olive 1970s lounge set with a walnut record console, a sunburst mirror and a tall ribbed table lamp",
    "a deep emerald retro study with wood-panelled walls, a leather club chair and a brass floor lamp",
  ],
  "crate stack": [
    "a clean light-grey cyclorama with a sculptural stack of black plastic crates built up behind like a throne",
    "a pale-grey cyclorama with a tall stepped stack of white concrete breeze blocks",
    "a sand-coloured studio with a stepped pyramid of natural wooden pallets",
  ],
  "rope installation": [
    "a minimal warm-beige set with dozens of taut cream ropes hanging from the ceiling to the floor around a round linen-draped podium, soft diffused light",
    "a blush-pink set with long sheer fabric strips hanging from the ceiling around a round white podium",
    "a stone-grey set with hundreds of fine gold threads hanging floor to ceiling around a round plinth",
  ],
  "velvet club": [
    "a deep olive-green velvet curtain backdrop over an artificial-grass floor with a white court line, scattered tennis balls, a vintage leather holdall and a wooden racket \u2014 preppy country-club editorial",
    "a deep burgundy velvet curtain backdrop with a vintage gramophone, a velvet pouf and a patterned rug",
    "a navy velvet curtain backdrop over a polished wooden floor with a vintage trunk and a brass floor lamp",
  ],
  "wood slice set": [
    "a warm ivory seamless studio with irregular natural tree-trunk wood slices scattered across the floor like stepping stones",
    "a warm ivory studio with smooth river stones and dried pampas grass scattered across the floor",
    "a beige set with raw tree stumps of different heights and a single dried branch",
  ],
  "stone boulders": [
    "a moody warm-grey studio framed by giant pale sculptural boulders, a single soft directional light",
    "a giant hollow driftwood arch standing in snowy mountains, a warm-lit wooden bench inside the arch glowing against the cold blue light",
    "a sand-toned set with a monumental smooth sandstone rock formation and soft side light",
  ],
  "arched corridor": [
    "a long sandstone corridor of repeating arches with golden sunlight streaming in and deep one-point perspective",
    "a warm plaster room with a tall pointed arch and a carved jaali lattice window casting dappled patterned light across the floor",
    "a sunlit sculptural ivory interior with a sweeping curved staircase and a long flowing red silk ribbon swirling through the air",
    "a white-washed Mediterranean arcade with soft blue shadows and pink bougainvillea spilling over the arches",
  ],
  "mirror sky": [
    "a surreal sky set of tall glossy mirror panels reflecting drifting white clouds, standing on a still mirror-water floor",
    "a calm pastel pink-and-peach sunset sea with perfectly still water",
    "a twilight rocky seashore with a large glass display cube and polished chrome spheres on the dark sand",
    "snowy pink-lit mountain peaks at dusk over a frozen mirror lake, a lone cream sofa and a glowing floor lamp standing on the ice",
  ],
  "desert dunes": [
    "soft cream desert dunes with a huge sheer ivory fabric billowing in the wind behind the subject",
    "sun-bleached white adobe desert architecture under a deep blue sky, handwoven kilim rugs laid on the ground and hung on the walls",
    "a monumental curved concrete arch framing a clear deep-blue sky with the sun flaring softly behind the head",
    "a luxury resort poolside with cream parasols, sage-green loungers and lush tropical palms",
    "a top-down view of a narrow wooden canoe on dark still water among giant round green lily pads",
  ],
  "red stool studio": [
    "a soft warm-grey studio with a small red-painted wooden step stool",
    "a soft powder-blue studio with a small yellow wooden step stool",
  ],
  "flower cabinet": [
    "a sage-green wall with floating flower heads and a small white cabinet overflowing with fresh flowers",
    "a blush-pink wall with floating paper butterflies and a small white shelf of potted flowers",
  ],
  "boho rattan": [
    "a boho corner with a rattan flower-shaped chair, tall potted palms, a cream curtain and a patterned jute rug",
    "a boho nook with a hanging rattan egg chair, pampas grass and a round jute rug",
  ],
  "white bow dream": [
    "a dreamy all-white set with a giant satin bow, clouds of white hydrangeas and a soft teddy bear",
    "a dreamy pastel-pink set with a giant satin bow, pink peonies and a small vintage white armchair",
  ],
  "wildflower bench": [
    "a warm beige set with tall wildflowers, a small wooden bench and a wicker picnic basket",
    "a soft cream set with tall white poppies, a tiny wooden bench and a lace-lined picnic basket",
  ],
  "daisy rain boots": [
    "a teal painted backdrop with giant white paper daisies, a mossy grass floor and little yellow rain boots",
    "a sky-blue painted backdrop with giant paper tulips, a grassy floor and a tiny watering can",
  ],
  "marigold white": [
    "a bright white set with a tiny white chair, buckets of orange marigolds and falling petals",
    "a bright white set with a tiny white chair, buckets of sunflowers and falling yellow petals",
  ],
  "sage table room": [
    "a soft beige room with a whitewashed wooden floor and a small sage table with a watering can of daisies",
    "a soft cream room with a small wooden table set for a tiny tea party with teddy bears",
  ],
  "meadow butterfly": [
    "a sunny wildflower meadow with rolling green hills and a soft blue sky",
    "a rustic wooden garden fence covered in morning-glory flowers with a small wicker basket on the grass",
  ],
  "bubble window": [
    "a cosy room with a large arched garden window, floating soap bubbles and a little wooden stool with potted blossoms",
    "a sunny playroom with a round window, floating soap bubbles and a small rocking horse",
  ],
};
const __studioBgPool = studioBackground ? (__studioBgThemes[lower(studioBackground)] || []) : [];

let backgroundInstruction = '';
if (isHomeTextile && __studioBgPool.length) {
  backgroundInstruction = 'SCENE: a premium trending campaign set (' + studioBackground + ') - style the product as the hero in ' + __pick(__studioBgPool) + '. The product is shown complete and true to colour; the print appears ONLY on the product. NO studio equipment visible.';
} else if (isHomeTextile) {
  if      (p.includes('curtain'))                       backgroundInstruction = 'SCENE: a contemporary Indian living room or bedroom corner with a window. Daylight streaming through the curtain. Minimal but warm decor - a chair, a side table with a book, perhaps a potted plant.';
  else if (p.includes('bedsheet') || p.includes('blanket') || p.includes('quilt') || p.includes('luxury bedroom'))
                                                        backgroundInstruction = 'SCENE: a styled bedroom - wooden bed frame, soft headboard, bedside lamps switched on for warm glow, a window with sheer curtains in the background. Lived-in but tidy.';
  else if (p.includes('cushion') || p.includes('sofa')) backgroundInstruction = 'SCENE: a styled living room - fabric sofa, low coffee table with a ceramic vase, framed art on the wall behind. The cushions are the visual focus.';
  else if (p.includes('towel') || p.includes('bathrobe')) backgroundInstruction = 'SCENE: a luxury spa-style bathroom - natural stone surfaces, brass fittings, neutral palette, one orchid or plant for life.';
  else if (p.includes('rug') || p.includes('carpet'))   backgroundInstruction = 'SCENE: a modern Indian living room - wooden floor, minimalist sofa, plant in the corner. The rug anchors the room.';
  else if (p.includes('wall'))                          backgroundInstruction = 'SCENE: a contemporary home interior wall as the backdrop, with the panel as a focal art piece. Soft natural light from the side.';
  else if (p.includes('table cover'))                   backgroundInstruction = 'SCENE: a tasteful dining setting - wooden chairs, a centre piece (vase or candle), framed window light. The cover is the visual hero.';
  else                                                  backgroundInstruction = 'SCENE: a tasteful interior context appropriate to the product. Warm, lived-in, never showroom-cold.';
} else if (isWhiteBg)        backgroundInstruction = 'SCENE: E-COMMERCE MARKETPLACE MAIN IMAGE (Amazon / Flipkart / Myntra standard) - a 100% pure white background, exact #FFFFFF (RGB 255,255,255) edge to edge, with no gradient, no grey vignette, no floor line, no texture and no colour spill. Only a very faint natural contact shadow directly under the feet/product is allowed. The product fills roughly 85% of the frame, centred, fully visible and never cropped. Absolutely NO props, NO text, NO logos, NO watermarks, NO badges, NO extra items in the frame.';
else if (isOutdoor)          backgroundInstruction = outdoorSceneInstruction;
else if (isLuxury)           backgroundInstruction = outdoorBackground ? (outdoorSceneInstruction + ' Treat it as a high-end EDITORIAL outdoor scene - refined cinematic mood lighting, but the model and the printed garment stay clearly visible with no crushed blacks over the fabric.') : 'SCENE: ' + __pick(__luxeInterior) + ', restrained editorial styling. Soft directional mood lighting that still keeps the model and the printed garment clearly visible, with no crushed blacks over the fabric.';
else if (isTraditional)      backgroundInstruction = 'SCENE: a tasteful traditional Indian setting - a wooden jharokha window, a courtyard wall with natural texture, brass diyas softly lit, a curtain edge in frame. Culturally accurate but never stereotyped.';
else if (__studioBgPool.length) backgroundInstruction = 'SCENE: a premium trending studio / editorial set (' + studioBackground + ') - ' + __pick(__studioBgPool) + '. Campaign-quality lighting with NO studio equipment (softboxes, stands, umbrellas) visible in the frame.';
else                         backgroundInstruction = 'SCENE: a premium trending editorial set - ' + __pick(__editorialIndoor) + '. Campaign-quality lighting with NO studio equipment (softboxes, stands, umbrellas) visible in the frame.';
if (isWhiteBg) {
  // e-commerce: background must stay pure white, no harmony re-colouring
} else {
  backgroundInstruction += ' BACKGROUND COLOUR HARMONY (CRITICAL): whatever the scene, its colours are chosen to make the PRODUCT the hero - the background is lower in saturation than the garment, clearly separated from it in tone (light product -> deeper backdrop tones, dark product -> lighter airy tones), and never repeats the garment\'s main colour family. The eye must land on the product first.';
}
if (clean(input.reference_scene_url, '')) {
  backgroundInstruction = 'SCENE: use ONLY the user-uploaded scene photo (one of the input images) as the background - keep that scene exactly as it is, do not invent, restyle or replace it. Match its lighting, perspective and shadows so the model and garment look genuinely photographed there.';
}


// =====================================================================
//  ACCESSORIES / STYLING
// =====================================================================
const accessoriesInstruction = accessories && accessories.toLowerCase() !== 'none'
  ? `STYLING: model is accessorised with - ${accessories}. Accessories must look real, not jewellery-store-render shiny; metal has subtle wear, gemstones have real internal refraction.`
  : 'STYLING: NO accessories - no sunglasses (worn or hanging on the shirt), no watch, no bracelet, no rings, no chains, no hat, no bag. Let the textile design be the only hero.';


// =====================================================================
//  ARTICLE NUMBER OVERLAY - FIXED 12pt, post-production layer
// =====================================================================
const articleInstruction = articleNumber
  ? `OVERLAY TEXT - ARTICLE NUMBER (POST-PRODUCTION COMPOSITE LAYER):
This is a separate text layer composited on TOP of the finished
photograph. It is NEVER printed on the fabric, NEVER embedded in the
scene, NEVER part of the garment.

Render the text "${articleNumber}" in the ${articlePosition} corner.

CRITICAL TYPE-SETTING REQUIREMENTS:
- Font family: clean modern sans-serif (Helvetica / Inter / Roboto).
- Font size: NOT rendered by the AI at all - the image must be completely free of any overlay text, label, badge, pill or watermark, because all such text is added later in post-production - small, neat, magazine-
  credit-line size. Never larger.
- Font weight: medium (500-600). Letter-spacing: +25 milli-em.
- Colour: AI chooses between pure white (#FFFFFF) and pure black
  (#0E0E0E) based on highest contrast against the underlying pixels.
- Background pill: soft semi-transparent rectangle behind the text,
  rounded 4px corners, 6px horizontal padding, 3px vertical padding,
  blurred subtle drop shadow. Opacity ~60%.
- Position: 24px inset from both edges of the chosen corner.
- The text must be CRISP, perfectly aligned, fully readable.`
  : 'OVERLAY TEXT: no article number overlay required.';


// =====================================================================
//  COMPANY BRAND OVERLAYS - FIXED 12pt, post-production layer
// =====================================================================
const brandParts = [
  companyName    ? `company name "${companyName}" at the ${companyNamePosition} corner`           : '',
  companyPhone   ? `phone / WhatsApp number "${companyPhone}" at the ${companyPhonePosition} corner` : '',
  companyWebsite ? `website "${companyWebsite}" at the ${companyWebsitePosition} corner`            : '',
  companyAddress ? `address "${companyAddress}" at the ${companyAddressPosition} corner`            : '',
].filter(Boolean);

const brandInstruction = brandParts.length
  ? `CATALOGUE BRANDING TEXT OVERLAY (POST-PRODUCTION COMPOSITE LAYER):
These are SEPARATE text layers composited on top of the finished
photograph. NEVER embedded in fabric. NEVER part of the garment print.

CRITICAL TYPE-SETTING REQUIREMENTS for all branding lines:
- Font family: clean modern sans-serif (Helvetica / Inter / Roboto).
- Font size: NOT rendered by the AI at all - the image must be completely free of any overlay text, label, badge, pill or watermark, because all such text is added later in post-production for EVERY branding line.
  Same size throughout. The company name is NOT bigger than the
  website. The phone is NOT bigger than the address. ALL SAME SIZE.
- Font weight: medium (500). Letter-spacing: +25 milli-em.
- Colour: AI chooses between pure white (#FFFFFF) and dark charcoal
  (#1A1A1A) per element, based on highest contrast at that location.
- Stacked lines in the same corner: 4px line-height between them.
- Position: 24px inset from each edge of the chosen corner.

Render in this manner: ${brandParts.join('; ')}.

The branding text must be crisp, perfectly aligned, never overlap the
model's face or the garment print, and must look like real magazine
catalogue overlay text - clean and professional.`
  : 'CATALOGUE BRANDING TEXT OVERLAY: none.';


// =====================================================================
//  COMPANY LOGO OVERLAY (handled by client-side Canvas - skip in AI)
// =====================================================================
const logoInstruction = logoUrl
  ? `LOGO: the company logo will be composited by the post-production
pipeline AFTER this image is rendered. DO NOT attempt to render any
logo, brand mark, or symbol inside this image. Leave a clean ~25%
area in the ${companyNamePosition} corner free of busy detail so the
logo composite reads cleanly.`
  : 'LOGO OVERLAY: none.';


// =====================================================================
//  CUSTOM INSTRUCTION FROM USER (override)
// =====================================================================
const customLine = customInstruction
  ? `\n\nUSER OVERRIDE INSTRUCTION (highest priority if conflicting with style choices - but RULE #0 PRINT FORENSIC LOCK still wins):\n${customInstruction}`
  : '';


// =====================================================================
//  NEGATIVE PROMPT (Nano-Banana-2 specific failure modes)
// =====================================================================
const negativePrompt = [
  // Modesty / anti-nudity (hard block)
  'nude, nudity, naked, topless, bottomless, bare legs, exposed legs, no pants, no lower garment, missing trousers, missing leggings, underwear only, lingerie only, panties, exposed buttocks, exposed genitals, exposed breasts, bare midriff exposure, partially undressed, undressing, stripping, suggestive undressing, see-through revealing clothing, sexualised pose, pornographic',
  // Plastic AI tell-tales
  'plastic skin, waxy skin, doll skin, airbrushed skin, smooth skin without pores',
  'beauty filter face, snapchat filter, instagram filter, perfect symmetry',
  'mannequin face on a human, dead eyes, doll eyes, glossy lips',
  'decorative border, trim, piping or pattern band added on the cuffs, sleeve ends, sleeves, collar or shoulders that is not in the uploaded design, cuff borders, copied placket border on the cuffs',
  'visible softboxes, octaboxes, light stands, umbrellas, reflectors or any studio lighting equipment in the frame',
  'overexposed highlights on skin, bloomed skin, glowing forehead',
  'porcelain skin, painted skin, illustrated skin',
  'identical twin face stamp, repeated stock-model face',

  // Anatomy
  'extra fingers, missing fingers, fused fingers, malformed hands, six fingers, four fingers',
  'distorted face, asymmetric eyes, crossed eyes, lazy eye, melted features',
  'broken anatomy, dislocated limbs, extra limbs, missing limbs',
  'extra toes, missing toes, fused toes, deformed feet, melted feet, club foot, flipper feet, elongated legs, rubbery limbs, twisted limbs, duplicate limbs, merged bodies, floating limb, disconnected hand, malformed knee, malformed elbow, six fingers, four fingers, fused fingers, bent-back fingers, distorted legs, unnatural leg length',
  'wrong number of teeth, dental row distortion, oversized teeth',
  'ear distortion, missing earlobe, double earlobe',

  // Print integrity (CRITICAL - RULE #0)
  'redrawn pattern, reinterpreted motif, simplified pattern, changed pattern colours',
  'stretched pattern, warped pattern, broken pattern repeat, pixelated pattern',
  'pattern scale enlarged or shrunk beyond source',
  'pattern colour shifted from source',
  'fabric texture invented instead of preserved',
  'AI-generated fabric texture, generic fabric, fake silk shine',
  'embroidery added that is not in the source',
  'sequins, beadwork, or foil added that is not in the source',
  'motif rotated 90 or 180 degrees from source',
  'pattern repeating at wrong frequency, pattern printed on the wall, pattern on the background wall, design on the wall, wallpaper made from the print, repeated motif covering the wall or room, print outside the fabric item, pattern on the floor or ceiling, print bleeding into the scenery or surroundings',

  // Render tells
  'CGI render look, 3D render, octane render, Unreal Engine look, blender render',
  'over-sharpened, oversharpened halos around edges',
  'plastic doll figure, action-figure proportions',
  'cartoon, anime, illustration, painting, drawing, sketch, manga',
  'video-game character, MMO armour look',
  'AI-art signature aesthetic, midjourney signature, stable-diffusion signature',

  // Cheap photo problems
  'harsh on-camera flash, red-eye, blown highlights, crushed shadows',
  'low resolution, blurry, motion blur on face, out of focus subject',
  'banding in gradients, posterised tones',
  'JPEG compression artefacts, chroma noise, colour banding in skies',
  'cluttered background, messy props, random people in background',
  'duplicate model in background, ghost double of model',

  // Lighting failures
  'flat face lighting, ring-light circle in the eyes',
  'two suns, two key shadows in conflict, impossible lighting direction',
  'no contact shadow under feet, floating subject',
  'shadow direction not matching the key light',

  // Text problems
  'random text, gibberish text, watermarks, signatures, copyright symbols',
  'duplicate article number, distorted article text, illegible article number',
'leaf cut in half by buttons, motif bisected by placket, broken motif at button strip, chopped leaf at centre-front, pattern sliced by buttons, leaf under a button, motif crossing the button placket, motif on the button band, half leaf at the centre seam',
  'oversized text, giant logo, text that covers face or garment',
  'text rendered onto the fabric instead of as an overlay',
  'misspelled brand name, garbled text in the overlay',
  'inconsistent font size between branding lines',
  'large watermark text, dominant branding',

  // Indian-market specific failures
  'amateur indian terrace photo, casual home photography',
  'mobile camera look, tourist photography',
  'local boutique low-budget look, basement-shoot vibe',
  'unprepared model, weak makeup, dull expression, ordinary face, tired face',
  'unprofessional styling, ill-fitting garment, badly-tied saree',
  'culturally inappropriate styling',

  // Style consistency
  'multiple style mixed in one frame, half-realistic half-illustration',
  'Never different font sizes',
  'Never oversized branding'
].join(', ') + (garmentNegatives ? ', ' + garmentNegatives : '');


// =====================================================================
//  FINAL ASSEMBLY
// =====================================================================
const aspectLabel = (() => {
  const m = outputSize.match(/(\d+)\s*x\s*(\d+)/i);
  if (!m) return outputSize;
  const a = +m[1], b = +m[2];
  if (a === b) return '1:1 square';
  return a > b ? `${a}:${b} landscape` : `${a}:${b} portrait`;
})();

const prompt = `
${printForensicRule} GARMENT-ONLY PRINT RULE (CRITICAL, NON-NEGOTIABLE): The uploaded textile print appears ONLY on the actual textile product itself - the garment worn by the model, OR the curtain / bedsheet / cushion / sofa cover / table cloth / towel / the specific fabric item being shown. For home textiles (curtains, bedsheets, cushions, etc.) the print is ONLY on that fabric item and NEVER on the walls, window, furniture or room surfaces. The background, scene, walls, floor and surroundings MUST be a real photographic location as described in the SCENE section - they must NEVER show, repeat, echo, tile or contain the textile pattern. Do NOT fill the background with the print. Do NOT place a giant version of the pattern behind the model. Do NOT use the design as wallpaper or scenery. Only the clothes carry the print; everything else is a normal real-world photographic environment. \n\nDESIGN STUDY & THEME COHERENCE (do this FIRST): Before composing, visually STUDY the uploaded print - its dominant colours, motif style (floral / geometric / traditional / contemporary / festive) and overall mood. Then build a scene, styling and colour story that genuinely COMPLEMENT this specific design - backdrop, props and model styling must feel intentionally matched to the print, never random or a repeated default. Match the cultural / regional context to the selected model look (Indian model -> Indian setting & styling, Western model -> Western, and likewise for Asian / Middle-Eastern / African / Latin). For any wedding or festive theme, derive the celebration style from BOTH the design and the model's region, and vary it - do not reuse the same decor every time. ${customLine}

SHOOT BRIEF - INDIAN TEXTILE CATALOGUE MOCKUP
QUALITY BENCHMARK: this must look like a high-budget national brand campaign shoot (Raymond / Sabyasachi / Manyavar level) that cost lakhs to produce - flawless clarity, razor-sharp focus, premium lighting and finish, with ZERO compromise on sharpness or detail. The uploaded design/print must remain EXACTLY as provided (see RULE #0) and must never be redrawn, recoloured or altered in any way.
${referenceSpec}

${photorealismBlock}

CAMERA AND LENS:
${cameraSpec}

LIGHTING:
${lightingSpec}

${modelInstruction}

${premiumBeautyDirection}

${productInstruction}

${poseInstruction}

${backgroundInstruction}

${accessoriesInstruction}

OVERLAY TEXT POLICY: ABSOLUTELY DO NOT render any article number, design code, label, pill, badge or text anywhere in the image. Leave every corner completely clean and text-free. This text is composited later by a separate post-production layer.

BRANDING TEXT POLICY: ABSOLUTELY DO NOT render any company name, phone number, website, address, watermark or branding text anywhere in the image. Leave every corner completely clean and text-free. All branding is composited later by a separate post-production layer.

${logoInstruction}

=====================================================================
  OUTPUT REQUIREMENTS
=====================================================================
- Aspect: ${aspectLabel}.
- Quality tier: ${quality} - render with the appropriate level of
  detail, micro-contrast, and finish for this tier.
- ALL overlay text (article number + every company brand line) MUST
  be rendered at NOT rendered by the AI at all - the image must be completely free of any overlay text, label, badge, pill or watermark, because all such text is added later in post-production. Clean modern
  sans-serif. Same size for every text element. Never larger. Never
  varying. Magazine-credit-line scale.
- Output must look like a 14-bit RAW photograph straight out of the
  camera body specified above. A trained photo retoucher opening the
  file in Lightroom should not be able to identify any AI signature.
- RULE #0 (PRINT FORENSIC LOCK) overrides every other instruction in
  this brief. If anything else conflicts with print fidelity, the
  print wins.

DO NOT:
${negativePrompt}
`.trim();

// ===== AgentForge face/scene lock injection (v20) =====
var __NL = String.fromCharCode(10);
var __FACE_LOCK = "=== CRITICAL — REAL MODEL FACE LOCK (HIGHEST PRIORITY, OVERRIDES EVERYTHING) ===\nOne of the input images is a REAL photograph of the actual customer/model (the virtual try-on reference). This is a VIRTUAL TRY-ON of that EXACT same human being now wearing/showing the uploaded item. You MUST keep this person's face 100% IDENTICAL to that reference photo: same face shape, bone structure, jawline, cheekbones, eye shape and eye colour, eyebrows, nose, lips, skin tone and complexion, hairline, hairstyle, age and gender. Do NOT invent or generate a new face. Do NOT beautify, slim, smooth, re-shape, lighten, age or change the ethnicity of the face. Treat the face and head as a LOCKED, unchangeable identity that is simply re-photographed now wearing the new item/garment. If the output face does not clearly look like the SAME person as the reference photo, it is a FAILED result. Only the garment/jewellery, pose and background may change — the person's identity must be preserved exactly.";
var __HOME_MODEL_LOCK = "=== CRITICAL REAL MODEL IN ROOM (HIGHEST PRIORITY, OVERRIDES EVERYTHING) === One of the input images is a REAL photograph of an actual person (the customer or model). Place THIS EXACT person, FULLY and tastefully CLOTHED in their OWN normal everyday outfit, naturally INTO the styled room as a human model posing WITH the home-textile product. Keep the face 100 percent IDENTICAL to the reference photo: same face shape, bone structure, jawline, eyes, eyebrows, nose, lips, skin tone, hairline, hairstyle, age and gender. Do NOT invent, beautify, slim, smooth, reshape, age or change the ethnicity of the face; it is the SAME person simply re-photographed in this room. ABSOLUTELY CRITICAL: the person must NEVER wear, drape, wrap or be dressed in the textile product. The curtain, sofa cover, bedsheet, cushion, table cover or towel stays exactly where it belongs as a normal home item; the model ONLY poses near it and never wears it. INTERACTION (mandatory): the person must interact with the product exactly as: " + modelUsage + ". SITTING means genuinely SEATED on or with the product (for example sitting on the sofa or bed); HOLDING means holding it in the hands; POINTING means pointing toward it; STANDING BESIDE means standing right next to it and gesturing to it. Place the person CLOSE to and clearly engaged with the product, never far off in a corner. NO INVENTED PROPS OR ACTIVITY: the model holds NOTHING in the hands and performs NO invented action. Do NOT add tea, coffee, chai, cups, mugs, teapots, kettles, glasses, bottles, food, plates, trays, phones, laptops, books, flowers or ANY other object to the hands or the scene. Do NOT create a tea or coffee serving scene, do NOT pour or drink anything, and do NOT place any foreground tableware, refreshments or staged props. The ONLY featured item is the textile product; the hands simply rest naturally or touch the product per the interaction above. CRITICAL SCALE: render the person at correct real-world human proportions for the room, with natural perspective, depth and grounded contact shadows; never oversized, never zoomed-in, never larger than the furniture. Fully dressed, realistic and tasteful: absolutely NO nudity, NO undressing, NO swimwear or underwear, and NO inappropriate content.";
var __SCENE_LOCK = "=== CRITICAL — USER-UPLOADED SCENE COMPOSITE (HIGHEST PRIORITY) ===\nOne of the input images is the user's OWN background scene/photo. Place the product naturally INTO this EXACT scene, replacing any existing product/placeholder in it. Match the scene's real lighting direction, perspective, shadows, depth of field, reflections and colour temperature so the product looks genuinely photographed there. Keep the uploaded scene itself UNCHANGED — do NOT redraw, restyle or regenerate the background. Only the product is inserted/relit realistically into the user's scene.";
var __modelPhotoUrl = clean(input.model_photo_url || input.model_image_url, '');
var __referenceSceneUrl = clean(input.reference_scene_url, '');
var __finalPrompt = prompt;
// v25: framing lock at the very top so the image model never ignores it.
if (poseKey.includes('half body')) {
  __finalPrompt = '=== FRAMING LOCK (CRITICAL, READ FIRST) === ' + poseInstruction + __NL + __NL + __finalPrompt;
}
if (__modelPhotoUrl) { __finalPrompt = (isHomeTextile ? __HOME_MODEL_LOCK : __FACE_LOCK) + __NL + __NL + __finalPrompt; }
if (__referenceSceneUrl) { __finalPrompt = __SCENE_LOCK + __NL + __NL + __finalPrompt; }

return [
  {
    json: {
      ...meta,
      ...input,
      generation_id: generationId,
      design_url:    designUrl,
      textile_category: category,
      category, product_type: productType, model_usage: modelUsage,
      model_type: modelLook, model_look: modelLook,
      pose, face_expression: expression,
      shoot_style: shootStyle, output_size: outputSize, quality,
      article_number: articleNumber, article_position: articlePosition,
      company_name: companyName, company_phone: companyPhone,
      company_website: companyWebsite, company_address: companyAddress,
      company_name_position:    companyNamePosition,
      company_phone_position:   companyPhonePosition,
      company_website_position: companyWebsitePosition,
      company_address_position: companyAddressPosition,
      logo_url: logoUrl,
      final_prompt: __finalPrompt,
      model_photo_url: __modelPhotoUrl,
      reference_scene_url: __referenceSceneUrl,
      negative_prompt: negativePrompt,
      credit_cost: meta.credit_cost,
      user_id: meta.user_id
    }
  }
];
