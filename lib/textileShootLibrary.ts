// ============================================================
// Textile agent — shoot library (distilled from the
// "AF Updates refers" reference boards: Men's / Ladies / Kids wear,
// mannequins, studio set designs and Home-textile scenes).
//
// buildShootHints() turns the user's selections into short, high-priority
// prompt briefs that are folded into custom_instruction. A fresh random
// pick is made on every generation so repeat shoots never look the same.
// The uploaded print is never described or altered here.
// ============================================================

export const pickOne = <T,>(list: T[]): T =>
  list[Math.floor(Math.random() * list.length)];

type Pools = { standing: string[]; seated: string[]; walking: string[]; bust: string[] };

// ── Mannequins (type + posture only; scene comes from the Shoot Style) ──
const MANNEQUINS: Record<"men" | "ladies" | "kids", Pools> = {
  men: {
    standing: [
      "a headless tailor's dress form on a black turned-wood tripod stand with a slim chrome neck post (upper body only)",
      "a glossy black abstract full-body mannequin with a mirror-chrome faceless head, standing confidently with one hand on the hip",
      "a matte-white faceless full-body display mannequin standing relaxed with one hand in the trouser pocket and a slight hip shift",
      "a matte-black abstract faceless full-body mannequin standing tall with arms relaxed, weight on one leg",
      "TWO identical matte-black abstract faceless full-body mannequins side by side — one facing the camera showing the FRONT of the garment, the other turned away showing the BACK",
    ],
    seated: [
      "a matte-black abstract faceless full-body mannequin SEATED on a low bench, leaning forward with forearms resting on the knees",
      "a glossy black abstract mannequin with a mirror-chrome faceless head SEATED on a tall stool, one foot on the rung and one leg extended",
      "a matte-white faceless full-body mannequin SEATED back in a chair with legs crossed at the knee and hands resting on the armrests",
    ],
    walking: [
      "an articulated matte-black abstract faceless full-body mannequin posed mid-stride as if walking, arms swinging naturally",
      "an articulated matte-white faceless full-body mannequin posed in a confident walking stride",
    ],
    bust: [
      "a glossy black abstract upper-body bust mannequin (no legs) with a mirror-chrome faceless head, cut off at the hips",
      "a headless tailor's dress form with a slim chrome neck post, framed from shoulders to hips",
    ],
  },
  ladies: {
    standing: [
      "a matte-white abstract faceless female full-body mannequin in a fashion stance — one hand on the hip, one foot stepped forward on slim heels",
      "a matte-white abstract faceless female full-body mannequin with one arm raised lightly to the collar and the other relaxed, soft hip tilt",
      "a vintage ivory linen female dress form on an ornate curved brass tripod stand (upper body only), against a mottled painted-canvas backdrop",
      "a glossy black abstract faceless female full-body mannequin standing elegantly with one knee softly bent",
    ],
    seated: [
      "a matte-white abstract faceless female full-body mannequin SEATED gracefully on a round stool with legs crossed at the ankle",
      "a matte-white abstract faceless female full-body mannequin SEATED sideways on a low bench, one hand resting on the knee",
    ],
    walking: [
      "an articulated matte-white abstract faceless female full-body mannequin posed mid-stride like a runway walk",
    ],
    bust: [
      "a vintage ivory linen female dress form on an ornate brass stand, framed from shoulders to hips",
      "a matte-white abstract faceless female upper-body bust mannequin (no legs), cut off at the hips",
    ],
  },
  kids: {
    standing: [
      "a glossy white abstract faceless CHILD full-body mannequin standing on a clear glass base plate",
      "a glossy white faceless CHILD full-body mannequin standing relaxed with arms by the sides on a round white base",
      "a pair of glossy white faceless CHILD mannequins on white cube podiums — one standing, one sitting on the edge",
    ],
    seated: [
      "a polished chrome faceless CHILD full-body mannequin SEATED on a small wooden bench, hands resting on the knees",
      "a glossy white faceless CHILD full-body mannequin SEATED on a white cube podium, legs dangling",
    ],
    walking: [
      "a glossy white faceless CHILD full-body mannequin posed in a playful walking step",
    ],
    bust: ["a small white CHILD dress form on a turned wooden stand, framed from shoulders to hips"],
  },
};

function mannequinFor(cat: "men" | "ladies" | "kids", poseText: string): string {
  const pools = MANNEQUINS[cat];
  const p = poseText.toLowerCase();
  if (/sit|seat|stool|chair/.test(p)) return pickOne(pools.seated);
  if (/walk|stride/.test(p)) return pickOne(pools.walking);
  if (/close|half/.test(p)) return pickOne(pools.bust);
  // Kids: the board shows full-body child statues, so Auto skips the bust form.
  if (!p || /auto/.test(p))
    return pickOne(cat === "kids" ? [...pools.standing, ...pools.seated] : [...pools.standing, ...pools.seated, ...pools.bust]);
  return pickOne(pools.standing);
}

// ── Shoot LOOKS = set design + the pose that set was shot with ──
// Distilled 1:1 from the reference boards (Studio Backgrounds indoor /
// outdoor, male + ladies fashion poses, kids studio backgrounds). When the
// user leaves Pose on "Auto" the look's own pose is used, so the output
// matches the reference; a pose the user picks always wins.
type Look = { set: string; pose: string; who?: "men" | "ladies" };

const STUDIO_LOOKS: Look[] = [
  // Indoor sets
  { set: "a dark teal-blue studio lit by a single hard spotlight from above, a low glowing white rectangular plinth, deep moody vignette and a long soft shadow", pose: "standing tall on the plinth, one hand relaxed in the pocket, weight on one leg, calm direct gaze — full body" },
  { set: "a rich crimson-red retro room: a mid-century walnut sideboard with a vintage television and record player, a round brass wall clock and a warm glowing table lamp", pose: "standing and leaning one elbow casually on the sideboard, the other hand relaxed, legs loosely crossed at the ankle — full body" },
  { set: "a clean light-grey cyclorama with a sculptural stack of black plastic crates built up behind like a throne", pose: "seated on the crates with one foot raised on a lower crate, forearm resting on the knee, relaxed confident look — full body" },
  { set: "a minimal warm-beige set with dozens of taut cream ropes hanging from the ceiling to the floor around a round linen-draped podium, soft diffused light", pose: "standing on the podium between the ropes, hands in the pockets, relaxed shoulders — full body" },
  { set: "a deep olive-green velvet curtain backdrop over an artificial-grass floor with a white court line, scattered tennis balls, a vintage leather holdall and a wooden racket — preppy country-club editorial", pose: "seated back in a vintage wooden armchair, legs crossed, one hand resting on the armrest — full body", who: "men" },
  { set: "a warm ivory seamless studio with irregular natural tree-trunk wood slices scattered across the floor like stepping stones", pose: "standing on one wood slice, one hand in the pocket and the other relaxed, slight hip shift, confident gaze — full body" },
  { set: "a moody warm-grey studio framed by giant pale sculptural boulders, a single soft directional light", pose: "walking slowly in profile between the boulders, gaze ahead, garment moving naturally — full body, the print still readable" },
  { set: "a sunlit sculptural ivory interior with a sweeping curved staircase and a long flowing red silk ribbon swirling through the air around the subject", pose: "standing on the lower steps turned three-quarters to camera, looking back over the shoulder, the ribbon swirling around — full body", who: "ladies" },
  { set: "a long sandstone corridor of repeating arches with golden sunlight streaming in and deep one-point perspective", pose: "walking toward the camera down the centre of the corridor, arms relaxed, fabric in motion — full body" },
  { set: "a warm plaster room with a tall pointed arch and a carved jaali lattice window casting dappled patterned light across the floor", pose: "standing in the arched doorway, three-quarter turn toward the light, head turned softly to camera — full body" },
  // Outdoor sets
  { set: "a surreal sky set of tall glossy mirror panels reflecting drifting white clouds, standing on a still mirror-water floor", pose: "standing tall and still, arms relaxed by the sides, calm direct gaze, crisp reflection below — full body" },
  { set: "a calm pastel pink-and-peach sunset sea, perfectly still water", pose: "standing on a single rock rising out of the glassy water, arms by the sides, head turned slightly to one side — full body with the reflection" },
  { set: "a monumental curved concrete arch framing a clear deep-blue sky with the sun flaring softly just behind the head", pose: "low-angle hero stance, feet apart, one hand in the pocket, confident chin-up look — full body" },
  { set: "a luxury resort poolside with cream parasols, sage-green loungers and lush tropical palms, turquoise water in the foreground", pose: "walking barefoot along the pool edge in profile, relaxed natural stride, soft smile — full body", who: "ladies" },
  { set: "sun-bleached white adobe desert architecture under a deep blue sky, handwoven kilim rugs laid on the ground and hung on the walls", pose: "walking toward the camera along the rug path, strong confident stride — full body" },
  { set: "soft cream desert dunes with a huge sheer ivory fabric billowing in the wind behind the subject", pose: "standing with one hand in the pocket, looking off to the side, the fabric flowing behind — full body" },
  { set: "a top-down view of a narrow wooden canoe floating on dark still water among giant round green lily pads", pose: "lying back in the canoe, arms folded above the head, eyes softly closed, the garment spread out and fully visible — shot from directly above", who: "ladies" },
  { set: "a giant hollow driftwood arch standing in snowy mountains, a warm-lit wooden bench inside the arch glowing against the cold blue light", pose: "seated on the glowing bench inside the arch, relaxed posture, hands on the knees — full body" },
  { set: "a twilight rocky seashore with a large glass display cube and polished chrome spheres on the dark sand", pose: "standing inside the glass cube, poised and still, soft sunset rim light — full body" },
  { set: "snowy pink-lit mountain peaks at dusk over a frozen mirror lake, a lone cream sofa and a glowing floor lamp standing on the ice", pose: "seated relaxed on the sofa on the ice, one arm along the backrest — full body" },
];

// Extra looks from the Men's fashion-pose board (moody studio portraits).
const MEN_LOOKS: Look[] = [
  { set: "a clean bright-white studio with a simple dark wooden chair", pose: "seated leaning back on the chair, legs apart and extended, one forearm resting on the knee, head tilted back slightly — high-fashion editorial, full body" },
  { set: "a modern plaza of glass skyscrapers and white geometric architecture under a soft overcast sky, shot from a low angle", pose: "mid-stride walking past the buildings, one hand lightly in the pocket, coat and trousers in motion — full body" },
  { set: "a warm off-white seamless studio", pose: "standing tall with the arms folded across the chest, weight on one leg, direct confident look — full body" },
  { set: "a pale textured grey plaster wall with a polished concrete floor", pose: "three-quarter stance, one hand in the trouser pocket and the other hand open mid-gesture, looking just off camera — full body" },
  { set: "a moody charcoal mottled painted-canvas backdrop", pose: "perched on a tall wooden bar stool, one foot on the rung and the other leg extended, hands resting on the knee — full body portrait" },
  { set: "a light-grey minimal studio with a black tubular cantilever lounge chair", pose: "reclining casually in the lounge chair, one leg extended forward, elbows on the armrests — full body" },
  { set: "a dark charcoal studio backdrop with a black bentwood chair", pose: "standing and leaning lightly on the back of the bentwood chair with one hand, weight shifted, relaxed shoulders — full body" },
];

// Extra looks from the Ladies fashion-pose board.
const LADIES_LOOKS: Look[] = [
  { set: "a manicured golf-course green under a soft sky with oversized sculptural white golf balls", pose: "seated on the grass leaning back on one hand, the other arm resting on a giant golf ball, warm natural smile — full body" },
  { set: "a lush close-cropped emerald lawn shot from above with scattered small white balls", pose: "reclining elegantly on her side propped on one elbow, legs in a long line — full body from above" },
  { set: "a sunlit garden lawn with a white wrought-iron chair and a small round glass table", pose: "seated on the wrought-iron chair with legs crossed, one hand resting on the knee, poised — full body" },
  { set: "a clean pale-grey studio with a soft diagonal beam of light", pose: "standing straight with both hands in the pockets, calm gaze to camera — full body" },
  { set: "a softly lit high-fashion runway with a polished grey floor and white walls", pose: "mid-stride walking down the runway toward the camera, confident catwalk step — full body" },
  { set: "a warm ochre-and-sand hand-painted plaster backdrop", pose: "standing in profile turned slightly away, head bowed looking back over the shoulder, long elegant line — full body, garment front still readable" },
  { set: "a soft warm-grey seamless studio", pose: "minimal clean standing pose, arms relaxed by the sides, soft direct gaze — modern catalogue, full body" },
  { set: "a Parisian patisserie doorway at dusk with warm chandeliers and a glass pastry display", pose: "leaning against the door frame laughing candidly, one hand near the chin — three-quarter body" },
];

// Kids studio board — each set with the pose it was shot with.
const KIDS_LOOKS: Look[] = [
  { set: "a soft warm-grey studio with a small red-painted wooden step stool", pose: "standing proudly on the stool holding a small potted orchid, big curious eyes — full body" },
  { set: "a sage-green wall with floating flower heads and a small white cabinet overflowing with fresh flowers", pose: "cheeky confident stance beside the cabinet, arms folded and one foot forward, playful grin — full body" },
  { set: "a boho corner with a rattan flower-shaped chair, tall potted palms, a cream curtain and a patterned jute rug", pose: "sitting in the rattan chair, hands in the lap, sweet smile — full body" },
  { set: "a dreamy all-white set with a giant satin bow, clouds of white hydrangeas and a soft teddy bear", pose: "sitting on a little white bench, hands on the knees, gentle smile — full body" },
  { set: "a warm beige set with tall wildflowers, a small wooden bench and a wicker picnic basket", pose: "sitting on the little wooden bench, legs dangling, holding a flower — full body" },
  { set: "a teal painted backdrop with giant white paper daisies, a mossy grass floor and little yellow rain boots", pose: "standing and holding a small soft toy, curious happy look — full body" },
  { set: "a bright white set with a tiny white chair, buckets of orange marigolds and falling petals", pose: "standing holding a big bouquet of marigolds against the chest — full body" },
  { set: "a soft beige room with a whitewashed wooden floor and a small sage table with a watering can of daisies", pose: "standing at the little table with both hands resting on it, looking at the camera — full body" },
  { set: "a sunny wildflower meadow with rolling green hills and a soft blue sky", pose: "running playfully through the flowers reaching toward a butterfly — full body, joyful motion" },
  { set: "a rustic wooden garden fence covered in morning-glory flowers with a small wicker basket on the grass", pose: "standing by the fence on tiptoes peeking over it, turned three-quarters so the garment front is visible — full body" },
  { set: "a cosy room with a large arched garden window, floating soap bubbles and a little wooden stool with potted blossoms", pose: "standing by the window blowing soap bubbles, candid innocent moment — full body" },
];

// Scene-independent poses from the fashion-pose boards (Outdoor / White /
// uploaded scene, when Pose is left on "Auto").
const AUTO_POSES: Record<"men" | "ladies" | "kids", string[]> = {
  men: [
    "standing tall with the arms folded across the chest, weight on one leg, direct confident look — full body",
    "three-quarter stance, one hand in the trouser pocket and the other hand open mid-gesture, looking just off camera — full body",
    "low-angle hero stance, feet apart, one hand in the pocket, confident chin-up look — full body",
    "confident mid-stride walk toward the camera, one hand lightly in the pocket, garment in natural motion — full body",
    "relaxed standing pose, both hands in the pockets, head turned slightly to one side — full body",
  ],
  ladies: [
    "standing straight with both hands in the pockets or relaxed by the sides, calm gaze to camera — full body",
    "one foot stepped forward, one hand lightly on the hip, shoulders back, chin slightly lifted — full body",
    "standing in profile turned slightly away, looking back over the shoulder, long elegant line — full body, garment front still readable",
    "graceful mid-stride walk toward the camera, fabric in natural motion — full body",
    "candid moment laughing naturally, one hand near the chin, body turned three-quarters — full body",
  ],
  kids: [
    "cheeky confident stance with the arms folded and one foot forward, playful grin — full body",
    "standing and holding a small bunch of fresh flowers against the chest, sweet smile — full body",
    "happy standing pose, hands clasped in front, big curious eyes — full body",
    "playful skipping step toward the camera, joyful natural motion — full body",
  ],
};

function looksFor(cat: "men" | "ladies" | "kids"): Look[] {
  if (cat === "kids") return KIDS_LOOKS;
  const studio = STUDIO_LOOKS.filter((l) => !l.who || l.who === cat);
  return cat === "men" ? [...studio, ...MEN_LOOKS] : [...studio, ...LADIES_LOOKS];
}

// ── Home-textile scenes per product (from the Home textile boards) ──
type Scene = { text: string; model?: boolean };
const HOME_SCENES: Record<string, Scene[]> = {
  bed: [
    { text: "a surreal luxury set: the bed shaped like a giant white seashell on a soft beige studio floor scattered with pearls" },
    { text: "an outdoor forest-glade bedroom: the bed under a canopy of sheer white fabric on a wooden frame, a jute rug on the grass, lanterns and trees around" },
    { text: "an elegant bedroom with a deep green wall, cream upholstered headboard, brass bedside lamps, sheer curtains and a polished marble floor" },
    { text: "a top-down view of the bed floating in a dense jungle of glossy monstera leaves" },
    { text: "a modern minimal bedroom with raw concrete walls, a glass wall opening onto an indoor garden of trees and soft globe lamps" },
  ],
  rug: [
    { text: "a warm beige living room with sculptural curved lines, a low round brass coffee table and dried pampas in a vase" },
    { text: "a cosy corner on a herringbone wooden floor with boho cushions, a rattan basket and soft slippers" },
    { text: "the rug laid in an open desert landscape under a clear blue sky with a single vintage carved chair on it" },
    { text: "a pale studio where the rug is draped over a hidden form like a soft dune, a model seated calmly in front of it", model: true },
    { text: "the rug hung as a backdrop and laid on the floor, a model seated on it holding a vibrant bouquet of flowers", model: true },
    { text: "a gallery of richly patterned rugs hung on the wall, the featured rug laid on the floor with a model seated on it (the model never wears or wraps the rug)", model: true },
  ],
  curtain: [
    { text: "a warm luxury living room with tall windows, a cream armchair, a walnut console and soft golden daylight" },
    { text: "a modern lounge with a cove-lit ceiling, a sheer inner layer and heavy outer drapes, soft evening glow" },
    { text: "a bright white room with the curtains on a slim black rod, an industrial side table and framed prints" },
    { text: "a double-height window wall with the curtains, a model in a flowing gown gently drawing one panel aside", model: true },
    { text: "a zen gallery set: the curtain hung on a minimal wooden frame with bamboo, a rattan chair and soft shadows" },
  ],
  cushion: [
    { text: "a luxe velvet sofa styled with the cushions, a gold table lamp, lit candles and a vase of blossoms" },
    { text: "a tropical plant-filled nook with a wooden daybed where a model arranges the cushions", model: true },
    { text: "a sage-green studio with the cushions stacked on a wooden stool beside a ceramic vase and floor poufs" },
    { text: "a teal-curtained corner with a cream armchair and the cushions scattered on the floor beside a green glass lantern" },
    { text: "a deep burgundy wall with a green velvet sofa and botanical art, the cushions styled in a relaxed row" },
  ],
  sofa: [
    { text: "a warm wood-slat panelled lounge with globe pendant lights and a soft textured rug" },
    { text: "a misty ancient forest with a mossy floor and shafts of soft light" },
    { text: "a grand dark-green hall with a sweeping wooden staircase, a chequered marble floor and a glowing chandelier" },
    { text: "a dramatic red sandstone canyon at golden hour" },
    { text: "a golden dry-grass field under a soft overcast sky" },
    { text: "a weathered stone arch framing a calm lake and blue mountains" },
    { text: "a surreal shoreline with a crashing sea wave foaming around the furniture" },
    { text: "a still mirror-water lake reflecting the furniture under a pastel sky" },
    { text: "a soft pink-sand dune studio with sculptural dried branches" },
    { text: "a lush green meadow under a billowing translucent fabric sky" },
  ],
  table: [
    { text: "a sunny garden lunch with fruit bowls, wildflowers and rattan chairs" },
    { text: "a minimal beige studio with a round table draped to the floor and sculptural vases" },
    { text: "a textured ochre plaster wall with a rustic wooden table, a ceramic teapot and cups" },
    { text: "a bright dining room with French doors, fruit plates and dried flowers" },
    { text: "a soft sunlit corner with a round draped table, white ceramics and leafy shadows" },
  ],
};
function homeSceneKey(product: string): string {
  const p = product.toLowerCase();
  if (/bed|quilt|blanket|luxury bedroom|pillow/.test(p)) return "bed";
  if (/carpet|rug/.test(p)) return "rug";
  if (/curtain/.test(p)) return "curtain";
  if (/cushion/.test(p)) return "cushion";
  if (/sofa/.test(p)) return "sofa";
  if (/table/.test(p)) return "table";
  return "";
}

// ── Lower-garment colour from the uploaded design's own palette ──
type Lab = [number, number, number];
const toLab = (r: number, g: number, b: number): Lab => {
  const f = (c: number) => {
    c /= 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  };
  const R = f(r), G = f(g), B = f(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const h = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * h(y) - 16, 500 * (h(x) - h(y)), 200 * (h(y) - h(z))];
};
const labDist = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const LOWER_PALETTE: { name: string; rgb: [number, number, number] }[] = [
  { name: "jet black", rgb: [20, 20, 22] },
  { name: "charcoal grey", rgb: [58, 60, 64] },
  { name: "deep navy blue", rgb: [28, 38, 68] },
  { name: "dark olive green", rgb: [70, 74, 44] },
  { name: "chocolate brown", rgb: [78, 52, 38] },
  { name: "mid-wash indigo denim", rgb: [62, 88, 128] },
  { name: "khaki", rgb: [176, 158, 118] },
  { name: "stone beige", rgb: [206, 192, 168] },
  { name: "light grey", rgb: [196, 198, 200] },
  { name: "off-white cream", rgb: [238, 232, 218] },
];
const CLASSIC_LOWERS = new Set(["deep navy blue", "charcoal grey", "stone beige", "khaki", "chocolate brown"]);

// Read the design once (48×48 sample) → its 4 most-used colours in Lab.
const paletteCache = new Map<string, Lab[]>();
async function getDesignPalette(url: string): Promise<Lab[]> {
  const hit = paletteCache.get(url);
  if (hit) return hit;
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const S = 48;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const ctx = c.getContext("2d");
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, S, S);
    const px = ctx.getImageData(0, 0, S, S).data;
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < px.length; i += 4) {
      const key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
      const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      e.n++;
      e.r += px[i];
      e.g += px[i + 1];
      e.b += px[i + 2];
      buckets.set(key, e);
    }
    const top = [...buckets.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, 4)
      .map((e) => toLab(e.r / e.n, e.g / e.n, e.b / e.n));
    paletteCache.set(url, top);
    return top;
  } catch {
    return [];
  }
}

export async function suggestLowerColour(url: string): Promise<string> {
  const top = await getDesignPalette(url);
  if (!top.length) return "";
  const base = top[0]; // dominant / ground colour of the print
  let best = { name: "", score: -Infinity };
  for (const cand of LOWER_PALETTE) {
    const lab = toLab(...cand.rgb);
    const lightGap = Math.abs(lab[0] - base[0]);
    const nearest = Math.min(...top.map((t) => labDist(lab, t)));
    const chroma = Math.hypot(lab[1], lab[2]);
    const classic = CLASSIC_LOWERS.has(cand.name) ? 8 : 0;
    const score = Math.min(lightGap, 40) * 1.4 + Math.min(nearest, 40) * 0.8 - chroma * 0.35 + classic;
    if (score > best.score) best = { name: cand.name, score };
  }
  return best.name;
}

// Background colour story: keep the scene clearly separated from the product.
function hueFamily(lab: Lab): string {
  const chroma = Math.hypot(lab[1], lab[2]);
  if (chroma < 12) return "";
  const h = ((Math.atan2(lab[2], lab[1]) * 180) / Math.PI + 360) % 360;
  if (h < 35 || h >= 345) return "red / maroon";
  if (h < 70) return "orange / rust";
  if (h < 105) return "yellow / mustard";
  if (h < 165) return "green";
  if (h < 225) return "teal / aqua";
  if (h < 290) return "blue";
  return "purple / magenta";
}
export async function backgroundColourStory(url: string, subject: string): Promise<string> {
  const top = await getDesignPalette(url);
  if (!top.length) return "";
  const base = top[0];
  const tone = base[0] > 68 ? "light" : base[0] < 38 ? "dark" : "mid-tone";
  const hue = hueFamily(top.slice(0, 3).sort((a, b) => Math.hypot(b[1], b[2]) - Math.hypot(a[1], a[2]))[0]);
  const scene =
    tone === "dark"
      ? "light, airy and softly lit (ivory, sand, warm stone, pale sage, soft sky tones)"
      : tone === "light"
        ? "deeper and richer (olive, teal, terracotta, warm walnut, charcoal, dusk tones)"
        : "clearly lighter or darker than the product, never the same tone";
  return `BACKGROUND COLOUR STORY: the ${subject} reads as a ${tone}${hue ? ` ${hue}` : ""} piece — keep the scene's colours ${scene}, lower in saturation than the ${subject}${hue ? `, and avoid ${hue} tones in the backdrop and props` : ""}, so the product is the first thing the eye sees.`;
}


// ── Design readout: Gemini reads the design's colours, motifs and exact
// placement (see /api/textile/analyze) → a strict "copy exactly" brief.
type Readout = {
  design_type?: string;
  base_colour?: string;
  print_colours?: string[];
  elements?: { what?: string; where?: string; count?: number }[];
  sleeves?: string;
  collar_and_cuffs?: string;
  placket?: string;
  summary?: string;
};
const readoutCache = new Map<string, string>();
export async function designReadoutHint(url: string, product: string, apparel: boolean): Promise<string> {
  const key = `${url}|${product}`;
  if (readoutCache.has(key)) return readoutCache.get(key) || "";
  let hint = "";
  try {
    const res = await fetch("/api/textile/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: url, product }),
    });
    const r: Readout | null = (await res.json())?.readout ?? null;
    if (r && r.design_type) {
      const els = (r.elements || [])
        .filter((e) => e && e.what)
        .slice(0, 8)
        .map((e) => `${e.count && e.count > 1 ? `${e.count}× ` : ""}${e.what}${e.where ? ` — ${e.where}` : ""}`)
        .join("; ");
      const lines = [
        `DESIGN READOUT (the uploaded design was studied first — reproduce EXACTLY this, nothing more, nothing less): type = ${r.design_type.toUpperCase()}`,
        r.base_colour ? `base fabric colour = ${r.base_colour}` : "",
        r.print_colours?.length ? `print colours = ${r.print_colours.slice(0, 5).join(", ")}` : "",
        els ? `printed elements = ${els}` : "",
      ];
      if (apparel) {
        const plain = (v?: string) => !v || /plain|not shown/i.test(v);
        lines.push(
          plain(r.sleeves)
            ? "SLEEVES AND CUFFS = completely PLAIN base fabric — NO border, stripe, line, piping or motif anywhere on the sleeves, sleeve ends or cuff bands; the placket border must NOT be copied onto the cuffs"
            : `sleeves = printed exactly as in the design`,
          plain(r.collar_and_cuffs) || plain(r.sleeves) ? "collar and cuff bands = PLAIN base fabric" : "collar and cuffs = as in the design",
          `button placket = ${r.placket && !/same/i.test(r.placket) ? r.placket : "SAME colour and fabric as the body"}`,
        );
      }
      if (r.summary) lines.push(`summary = ${r.summary}`);
      lines.push(
        r.design_type === "placement"
          ? "Every element appears ONLY at its stated position and count. Do not extend, mirror, repeat or add any element anywhere else on the product."
          : "Keep the repeat's scale, colours and motif shapes identical to the upload.",
      );
      hint = lines.filter(Boolean).join(". ") + ".";
    }
  } catch {
    hint = "";
  }
  readoutCache.set(key, hint);
  return hint;
}

// Exact framing for each pose the user can pick (Front Face / Close-up removed).
const POSE_LOCK: Record<string, string> = {
  "side pose":
    "a clear three-quarter side pose — body turned about 45° from the camera, head turned back toward the lens, full body visible; the printed front of the garment still readable.",
  "walking pose":
    "a natural mid-stride walking pose toward the camera, full body from head to shoes, arms swinging softly, garment moving naturally.",
  "sitting pose":
    "genuinely SEATED on a chair, stool or bench that suits the scene, relaxed posture, the whole garment visible including the lower half, legs and shoes in frame.",
  "half body":
    "a half-body frame from the top of the head to just below the waist — the entire upper garment inside the frame, never cropped into a close-up.",
  "full body":
    "a true full-body frame from the top of the head to the shoes with a little space above and below — the entire outfit visible.",
};

// ── Public entry point ──
export type ShootInput = {
  category: string; // "Men's Wear" | "Ladies Wear" | "Kids Wear" | "Home Textile" | ...
  product: string;
  modelUsage: string;
  pose: string; // resolved pose ("Auto" = not chosen)
  studioPose: string; // "" | "Auto" | chosen studio pose
  shootStyle: string; // resolved shoot style
  customShootStyle: boolean; // user typed their own shoot style
  outdoorBackground: string; // "" when not applicable
  accessories: string; // "None" when nothing picked
  hasReferenceScene: boolean;
  designUrl: string;
};

export async function buildShootHints(o: ShootInput): Promise<string[]> {
  const cat: "men" | "ladies" | "kids" | "home" | "" =
    o.category === "Men's Wear"
      ? "men"
      : o.category === "Ladies Wear"
        ? "ladies"
        : o.category === "Kids Wear"
          ? "kids"
          : o.category === "Home Textile"
            ? "home"
            : "";
  if (!cat) return [];

  const hints: string[] = [];
  const chosenPose = [o.pose, o.studioPose].filter((x) => x && x !== "Auto").join(" ");
  const isStudio = !o.customShootStyle && o.shootStyle === "Studio Professional";
  const noEquipment =
    "Campaign-quality lighting, but NO softboxes, octaboxes, light stands, umbrellas, reflectors or any studio equipment may be visible anywhere in the frame.";

  // ── Home textile: product-specific premium scenes ──
  const readout = await designReadoutHint(o.designUrl, o.product, cat !== "home");
  if (readout) hints.push(readout);

  const isWhiteEcom = !o.customShootStyle && /white/i.test(o.shootStyle);
  if (isWhiteEcom) {
    hints.push(
      `E-COMMERCE MARKETPLACE IMAGE (Amazon / Flipkart / Myntra main-image standard): pure white #FFFFFF (RGB 255,255,255) seamless background with no gradient, texture or colour cast; the ${cat === "home" ? o.product : "garment"} is centred and fills about 85% of the frame, shown COMPLETE (nothing cropped), front-facing and true-to-life in colour; even, soft, shadowless lighting (only a faint natural contact shadow directly underneath is allowed); NO props, NO extra products, NO scenery, NO text, NO logos, NO watermarks. Clean, sharp, catalogue-ready.`,
    );
  } else if (!o.hasReferenceScene) {
    const colourStory = await backgroundColourStory(o.designUrl, cat === "home" ? o.product : "garment");
    if (colourStory) hints.push(colourStory);
  }

  if (cat === "home") {
    const key = homeSceneKey(o.product);
    const withModel = !/no model/i.test(o.modelUsage);
    if (/studio setup/i.test(o.pose) && !o.hasReferenceScene && !isWhiteEcom) {
      hints.push(
        `STUDIO SETUP VIEW (premium product-photography set, NOT a real room): the ${o.product} is styled as the hero of a trending photo-studio vignette — a seamless backdrop and floor in a soft tone that contrasts with the design, one or two sculptural podiums or blocks, a few minimal curated props (a vase with dried stems, a ceramic piece, soft drapery) kept well away from the product, and soft directional light with gentle natural shadows. The product is shown complete, crisp and true to colour; the uploaded design appears ONLY on the ${o.product}. ${noEquipment}`,
      );
    } else if (key && !o.hasReferenceScene && !o.customShootStyle && !o.outdoorBackground && !isWhiteEcom) {
      const pool = HOME_SCENES[key].filter((s) => (withModel ? true : !s.model));
      const scene = pickOne(pool.length ? pool : HOME_SCENES[key]);
      hints.push(
        `SCENE DESIGN (premium trending campaign, overrides any default room): style the ${o.product} in ${scene.text}. Keep the selected view / framing and model interaction; the uploaded design appears ONLY on the ${o.product} and never on walls, floor or props. ${noEquipment}`,
      );
    }
    return hints;
  }

  // ── Apparel (men / ladies / kids) ──
  const isMannequin = /mannequin/i.test(o.modelUsage);
  // A pose the user picked must fit the set, so skip the pose-bound sets.
  const look = pickOne(
    looksFor(cat).filter(
      (l) =>
        (!chosenPose || !/canoe|glass cube|bench inside/i.test(l.set)) &&
        (!/mannequin/i.test(o.modelUsage) || !/canoe/i.test(l.set)),
    ),
  );
  if (isStudio) {
    hints.push(
      `STUDIO SET DESIGN (Studio Professional — premium trending editorial set from the reference board; replaces any plain seamless-paper backdrop): shoot in ${look.set}. Real campaign photography — natural skin, real fabric drape, cinematic but true colour grade. ${noEquipment}`,
    );
  }
  const isHalfBody = /half/i.test(chosenPose);
  if (isMannequin) {
    hints.push(
      `MANNEQUIN SHOOT (overrides the default mannequin look — mannequin type and posture only): present the garment on ${mannequinFor(cat, chosenPose || "auto")}. The mannequin is faceless with no human skin or hair and the garment fits it like a tailored catalogue display. Keep the SCENE, BACKGROUND and LIGHTING exactly as selected in this brief (${o.shootStyle}${o.outdoorBackground ? `, ${o.outdoorBackground}` : ""}) — do NOT switch to a plain studio backdrop unless that is the selected style. The uploaded print stays exactly the same.`,
    );
    if (isHalfBody) {
      hints.push(
        "HALF-BODY MANNEQUIN FRAME (CRITICAL — overrides any full-body wording): use an UPPER-BODY torso / bust display form only — it has NO legs. Frame the shot from just above the neck (or the top of the mannequin head) down to the hips, like a tight catalogue crop. NO trousers, pants, legs, feet, shoes, floor or stand base anywhere in the frame; only the upper garment is shown and it fills most of the frame, completely visible from collar to hem. A result that shows the lower half is a FAILED result.",
      );
    }
  } else if (chosenPose && !/family|couple/i.test(o.modelUsage)) {
    const lock = POSE_LOCK[chosenPose.toLowerCase()];
    if (lock) hints.push(`SELECTED POSE (must be followed exactly): ${lock}`);
  } else if (isWhiteEcom && !/family|couple/i.test(o.modelUsage)) {
    hints.push(
      "E-COMMERCE POSE: straight, relaxed front-facing catalogue stance, arms by the sides, full body from head to shoes, the whole garment clearly visible.",
    );
  } else if (!chosenPose && !/family|couple/i.test(o.modelUsage)) {
    const label = cat === "men" ? "STYLISH MALE POSE" : cat === "ladies" ? "STYLISH FEMALE POSE" : "NATURAL KIDS POSE";
    // Studio: the pose that belongs to the chosen set. Other styles: a pose
    // from the fashion-pose boards that works in any scene.
    const pose = isStudio ? look.pose : pickOne(AUTO_POSES[cat]);
    hints.push(`${label}: ${pose}. Keep the printed garment clearly visible and uncropped.`);
  }

  if ((cat === "men" || cat === "kids") && o.accessories === "None") {
    hints.push(
      "NO EXTRA ACCESSORIES: do not add sunglasses, eyewear, watches, bracelets, jewellery, hats or bags on the model or mannequin.",
    );
  }

  const p = o.product.toLowerCase();
  const isShirtLike =
    (cat === "men" && /shirt/.test(p)) || (cat === "kids" && /boys shirt|t-shirt/.test(p));
  if (isShirtLike) {
    hints.push(
      "UNTUCKED STYLING (CRITICAL, applies to models AND mannequins in every pose): the shirt / t-shirt is worn UNTUCKED — the full hem hangs naturally OUTSIDE and over the waistband, covering the belt line. It is NEVER tucked in, not even partially; a tucked-in shirt is a FAILED result.",
    );
  }

  // Half-body mannequin shows no lower half → no lower-garment brief.
  const needsLower =
    !(isMannequin && isHalfBody) &&
    ((cat === "men" && /shirt|kurta|t-shirt|tee|hoodie|blazer|waistcoat|jacket/.test(p) && !/pathani|suit/.test(p)) ||
    (cat === "ladies" && /kurti/.test(p)) ||
    (cat === "kids" && /boys shirt|boys kurta|t-shirt/.test(p)));
  if (needsLower) {
    const colour = await suggestLowerColour(o.designUrl);
    if (colour) {
      const kinds =
        cat === "men"
          ? "trousers, chinos, jeans, pyjama or churidar"
          : cat === "ladies"
            ? "leggings, churidar, palazzo or straight pants"
            : "shorts, trousers, jeans or leggings";
      hints.push(
        `LOWER GARMENT COLOUR: pair the garment with a plain solid ${colour} lower (${kinds} — whichever suits the product), chosen to complement the uploaded print. Plain fabric, no print, no pattern; the uploaded design stays ONLY on the main garment and is NEVER changed.`,
      );
    }
  }
  return hints;
}
