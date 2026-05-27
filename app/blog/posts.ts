// ============================================================
// BLOG POST DATA — Industry-specific, not generic AI fluff.
// ============================================================
// Each post is written for a real Indian textile/jewellery/D2C
// audience and touches actual industry pain points:
//   • stitching & sampling cost
//   • model hiring & studio budget
//   • catalogue turnaround delay
//   • WhatsApp wholesale selling
//   • festive launch speed
//
// Add new posts to the BLOG_POSTS array below. They are picked
// up automatically by /blog and /blog/[slug] + the sitemap.
// ============================================================

export type BlogSection =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  keywords: string[];
  category: "Textile" | "Jewellery" | "Productography" | "Guide";
  author: string;
  publishedAt: string; // ISO date
  readMinutes: number;
  heroEmoji: string;
  ctaLabel: string;
  ctaHref: string;
  body: BlogSection[];
};

export const BLOG_POSTS: BlogPost[] = [
  // ============================================================
  // TEXTILE — 4 posts
  // ============================================================
  {
    slug: "how-ai-is-changing-textile-marketing-india",
    title: "How AI Is Changing Textile Marketing in India",
    description:
      "AI is replacing model shoots, sampling rounds and 7-day catalogue cycles for Indian textile brands. Inside the new playbook for Surat, Jaipur, Ludhiana and Tirupur sellers.",
    excerpt:
      "Surat saree manufacturers, Jaipur kurti brands and Tirupur knitwear factories are quietly throwing away their model shoot calendar. Here's what's actually happening on the ground.",
    keywords: [
      "AI textile marketing India",
      "textile marketing automation",
      "saree marketing AI",
      "Surat textile market AI",
      "Indian fashion AI marketing",
      "textile catalogue automation India",
    ],
    category: "Textile",
    author: "AgentForge Team",
    publishedAt: "2026-05-26T00:00:00.000Z",
    readMinutes: 8,
    heroEmoji: "🧵",
    ctaLabel: "Try TextilePrints to Mockup AI",
    ctaHref: "/textileprints-to-mockup",
    body: [
      {
        type: "p",
        text: "If you sell sarees in Surat, kurtis in Jaipur, or knitwear out of Tirupur, your marketing calendar used to look like this: design the print, stitch a sample, book a model, lock a studio, wait for edits, hit print, send to wholesalers. Five to seven days per drop. Sometimes more if the model fell sick or the photographer rescheduled.",
      },
      {
        type: "p",
        text: "In 2026, that calendar is dead. A new generation of AI textile tools is letting Indian sellers skip the sample, skip the model, skip the studio — and ship the catalogue the same evening the design is approved.",
      },

      { type: "h2", text: "The old workflow was bleeding money" },
      {
        type: "p",
        text: "Let's do the math the way a real textile wholesaler thinks about it. Per design:",
      },
      { type: "ul", items: [
        "Sample stitching — ₹500–₹2,000 (saree, kurti, kurta, lehenga)",
        "Model fee — ₹5,000–₹15,000 (junior to mid-tier)",
        "MUA — ₹3,000–₹8,000",
        "Studio rental + lights — ₹4,000–₹12,000 per half-day",
        "Photographer + post-production — ₹6,000–₹20,000",
        "Logistics, runner, food — ₹1,500–₹3,000",
      ]},
      {
        type: "p",
        text: "A mid-scale Surat wholesaler shipping 30 new designs a month was spending ₹4–8 lakh on photography alone. And it took 5–7 days from design lock to WhatsApp drop. By that time, the trend had moved.",
      },
      { type: "quote", text: "Trend pakad ne ke liye 7 din bahut zyada hain. Tab tak buyer next vendor pe ja chuka hota hai." },

      { type: "h2", text: "What changed in 2026" },
      {
        type: "p",
        text: "AI textile mockup tools now generate a model-worn saree, kurti or lehenga in 30 seconds from a flat fabric photo. Article code overlay, brand name and WhatsApp number are added automatically. The output is HD, festive-lit, and ready for WhatsApp wholesale groups.",
      },
      { type: "h3", text: "The new marketing flow looks like this" },
      { type: "ul", items: [
        "Designer approves the print at 10 AM",
        "AI generates 8–12 model-worn variants by 10:05 AM",
        "Brand overlay added in 1 click",
        "Catalogue dropped in WhatsApp groups by 10:30 AM",
        "First enquiries come in before lunch",
      ]},

      { type: "h2", text: "Where the real impact shows up" },
      { type: "h3", text: "1. Festive launches" },
      {
        type: "p",
        text: "Diwali, Karwa Chauth, Eid, Navratri — these are the launch deadlines that decide your year. Earlier, brands locked photo shoots 6 weeks in advance. Now you launch 6 days in advance, follow the trend, and iterate creative through the festive window.",
      },
      { type: "h3", text: "2. Wholesale WhatsApp catalogues" },
      {
        type: "p",
        text: "WhatsApp is still the #1 sales channel for Indian textile wholesale. The brands shipping the most designs are the ones who win. AI lets you ship 10–20 designs per WhatsApp drop instead of 2–3 — without any extra production cost.",
      },
      { type: "h3", text: "3. Bridal and high-ticket collections" },
      {
        type: "p",
        text: "Bridal lehengas and designer sarees used to demand the most expensive shoots. Now AI handles the editorial mood, festive lighting and Indian bridal model look in 30 seconds. Designers retain control over the print and silhouette — AI handles the model and studio.",
      },
      { type: "h3", text: "4. D2C and Instagram brands" },
      {
        type: "p",
        text: "If your daily Instagram drop slipped because the model wasn't free, AI mockups remove that bottleneck entirely. Your social calendar becomes design-led, not shoot-led.",
      },

      { type: "h2", text: "What AI still cannot do" },
      {
        type: "p",
        text: "AI can give you the model, studio, lighting and pose. It cannot replace your design sense, fabric sourcing, stitching quality or wholesale relationships. The brands winning with AI are using it where it makes sense — for catalogue volume and speed — while keeping their craft, sampling and 1–2 flagship campaigns traditional.",
      },

      { type: "h2", text: "The honest summary" },
      {
        type: "p",
        text: "Textile marketing in India has shifted from a calendar problem to an execution problem. The brands that pick up AI mockups in 2026 will ship 5–10x more designs at 1/20th the cost — and the ones that don't will find their wholesale buyers moving on to competitors who can.",
      },
    ],
  },

  {
    slug: "ai-mockups-vs-traditional-photoshoots",
    title: "AI Mockups vs Traditional Photoshoots: Honest 2026 Comparison",
    description:
      "Real cost, time, quality and risk comparison between AI mockups and traditional photoshoots for Indian textile, jewellery and product brands. No marketing fluff.",
    excerpt:
      "Should you do an AI mockup or hire a model? Here is the honest comparison — cost per image, turnaround, quality benchmarks, and the cases where traditional still wins.",
    keywords: [
      "AI mockup vs photoshoot",
      "AI mockup vs studio shoot",
      "AI fashion shoot cost India",
      "traditional vs AI photoshoot",
      "saree shoot cost India",
    ],
    category: "Textile",
    author: "AgentForge Team",
    publishedAt: "2026-05-25T00:00:00.000Z",
    readMinutes: 6,
    heroEmoji: "⚖️",
    ctaLabel: "Try It Free",
    ctaHref: "/textileprints-to-mockup",
    body: [
      {
        type: "p",
        text: "Every textile, jewellery and product seller in India asks the same question in 2026: do I still need a traditional model shoot, or can AI handle it? Here is the honest answer — with real Indian rupee numbers and the cases where each one still wins.",
      },

      { type: "h2", text: "Cost per image" },
      { type: "h3", text: "Traditional shoot" },
      { type: "ul", items: [
        "Sample stitching: ₹500–₹2,000 per piece",
        "Model fee: ₹5,000–₹15,000 (junior to mid)",
        "MUA + hair: ₹3,000–₹8,000",
        "Studio half-day: ₹4,000–₹12,000",
        "Photographer + post: ₹6,000–₹20,000",
        "Per 30-image catalogue: ₹400–₹1,200 per image (best case)",
      ]},
      { type: "h3", text: "AI mockup" },
      { type: "ul", items: [
        "No stitching needed — work from flat fabric or design file",
        "No model fee, MUA, studio or photographer",
        "AgentForge plans: ₹1,999 (Starter) → 1,800 credits → 120 images",
        "Per image: ₹12–₹17 (Starter), ₹12 (Pro Creator), ₹13 (Empire)",
      ]},
      { type: "quote", text: "₹400/image vs ₹15/image. That's the conversation that ends the meeting." },

      { type: "h2", text: "Turnaround time" },
      { type: "ul", items: [
        "Traditional: 5–14 days end-to-end (sample, book, shoot, edit, deliver)",
        "AI mockup: 30 seconds per image. A 30-piece catalogue ready in 15 minutes.",
      ]},
      {
        type: "p",
        text: "For festive launches (Diwali, Karwa Chauth, Eid, Navratri) the turnaround difference is the whole game. AI lets you launch in 6 days instead of 6 weeks.",
      },

      { type: "h2", text: "Quality benchmarks" },
      {
        type: "p",
        text: "For 95% of catalogue use cases — WhatsApp wholesale, Instagram, Amazon listings, Meesho, Flipkart — AI output is indistinguishable from a real shoot to the end buyer. Where traditional still wins:",
      },
      { type: "ul", items: [
        "Hoarding-size print campaigns (4K+ enlargement requirements)",
        "Magazine editorials with named celebrity models",
        "Brand storytelling films where the model's personality is the asset",
        "Real product texture demos (fabric drape feel, jewellery weight)",
      ]},

      { type: "h2", text: "Risk profile" },
      { type: "h3", text: "Traditional shoot risks" },
      { type: "ul", items: [
        "Model cancellation (weather, sick day, double-booking)",
        "Sample stitching delays",
        "Post-production turnaround slip",
        "Sunk cost if a design doesn't sell",
      ]},
      { type: "h3", text: "AI mockup risks" },
      { type: "ul", items: [
        "Occasional anatomy or drape artefact (regenerate fixes it)",
        "Cannot show ultra-fine fabric texture at extreme close-up",
        "AI is not a replacement for your design taste",
      ]},

      { type: "h2", text: "When AI is the obvious choice" },
      { type: "ul", items: [
        "Daily WhatsApp wholesale catalogues",
        "Festive launches under tight deadlines",
        "Marketplace listing refreshes (Amazon, Flipkart, Meesho)",
        "Ad creative A/B testing",
        "D2C Instagram daily drops",
        "Bulk catalogue generation for factories",
      ]},

      { type: "h2", text: "When to still book a traditional shoot" },
      { type: "ul", items: [
        "Flagship bridal campaigns (1–2 per year)",
        "Print advertising on hoardings or magazines",
        "Brand films with face / personality storytelling",
        "Founder / lookbook portraits",
      ]},

      { type: "h2", text: "The smart 2026 stack" },
      {
        type: "p",
        text: "The best Indian textile and jewellery brands now run a 95/5 split — 95% of all catalogue work on AI, 5% reserved for flagship traditional shoots that build brand. Everything else moves to AI by default.",
      },
    ],
  },

  {
    slug: "how-saree-brands-generate-catalogues-instantly",
    title: "How Saree Brands Can Generate Catalogues Instantly with AI",
    description:
      "Practical workflow for Surat, Varanasi, Kanjeevaram and designer saree brands to ship daily WhatsApp catalogues using AI — no model, no stitching, no studio.",
    excerpt:
      "Surat saree manufacturers are shipping 20-design WhatsApp catalogues every morning. Here is the exact workflow they use — from design lock to wholesaler delivery in 30 minutes.",
    keywords: [
      "saree catalogue AI India",
      "Surat saree manufacturer workflow",
      "instant saree catalogue",
      "WhatsApp saree catalogue maker",
      "saree mockup AI",
      "designer saree catalogue",
    ],
    category: "Textile",
    author: "AgentForge Team",
    publishedAt: "2026-05-22T00:00:00.000Z",
    readMinutes: 6,
    heroEmoji: "🥻",
    ctaLabel: "Generate Saree Mockups",
    ctaHref: "/ai-saree-mockup",
    body: [
      {
        type: "p",
        text: "Saree wholesale is a daily-drop business. The brands shipping the most designs to the most WhatsApp groups every morning win the day. Here is the exact workflow that Surat, Varanasi, Kanjeevaram and designer saree brands are using in 2026 to compress a 5-day catalogue cycle into 30 minutes.",
      },

      { type: "h2", text: "The pain you already know" },
      { type: "ul", items: [
        "Sample stitching for every new saree — ₹800–₹2,000 per piece",
        "Model unavailable when you need to launch the festive collection",
        "Photographer schedule is locked 2 weeks out",
        "By the time the photoshoot is delivered, the trend has shifted",
        "Wholesale buyers have already seen 50 designs from competitors this week",
      ]},

      { type: "h2", text: "The new flow — step by step" },
      { type: "h3", text: "Step 1: Lock the design (Day 0)" },
      {
        type: "p",
        text: "Designer or buyer approves the print, pallu pattern and border. No need to stitch a sample. You don't even need the physical fabric in hand — a high-resolution flat photo of the saree spread or the digital design file is enough.",
      },
      { type: "h3", text: "Step 2: Upload to AgentForge" },
      {
        type: "p",
        text: "Open TextilePrints to Mockup AI. Upload the flat saree photo. The system reads the print, drape behaviour and texture.",
      },
      { type: "h3", text: "Step 3: Pick the look (30 seconds)" },
      { type: "ul", items: [
        "Saree category: Banarasi, Kanjeevaram, Chiffon, Georgette, Net, designer, bridal",
        "Model look: Indian model, bridal, Festive, daily wear, Western",
        "Pose: standing, walking, side-pose",
        "Backdrop: festive, studio, marble, outdoor, party",
      ]},
      { type: "h3", text: "Step 4: Add brand overlay" },
      {
        type: "p",
        text: "Article code, company name, WhatsApp number and website overlay get added automatically — exactly the way Indian saree wholesalers ship catalogues. Saved once, reused on every output.",
      },
      { type: "h3", text: "Step 5: Generate (30 seconds per image)" },
      {
        type: "p",
        text: "Generate 1–4 mockups of the same saree with different model looks for variation. Bulk plan (Empire) lets you queue 20+ at once.",
      },
      { type: "h3", text: "Step 6: Drop to WhatsApp" },
      {
        type: "p",
        text: "Download as 1080×1080 HD square (perfect for WhatsApp + Instagram). Drop straight into your wholesaler groups. Tag with article number for instant ordering.",
      },

      { type: "h2", text: "Real numbers — a Surat case study shape" },
      {
        type: "p",
        text: "A Surat manufacturer running 30 designs/month with traditional shoots:",
      },
      { type: "ul", items: [
        "Old: ₹4–8 lakh/month on photoshoots + 5–7 day delay per drop",
        "New: ₹9,999/month (Pro Creator plan, 800 images) + same-day delivery",
        "Designs shipped per month: 30 → 80+",
        "Catalogue freshness: weekly → daily",
      ]},

      { type: "h2", text: "Tips for the cleanest saree mockups" },
      { type: "ul", items: [
        "Use high-resolution flat photos with even lighting",
        "Shoot the saree spread on a contrasting background",
        "Mention fabric weight + drape style in custom instructions if specific",
        "Use 'Bridal Model + Festive Lighting' for wedding-season campaigns",
        "Use 'Indian Model + Studio' for daily-wear and routine drops",
        "Regenerate a variant if the pallu placement isn't right",
      ]},

      { type: "h2", text: "What about the buyers — will they tell?" },
      {
        type: "p",
        text: "For WhatsApp wholesale catalogues, buyers care about the design, fabric, price and article code. They don't care if the image is AI or studio — they care if the design will sell. The brands shipping the most options, fastest, win. AI just made that easier.",
      },
    ],
  },

  {
    slug: "best-ai-tool-for-textile-manufacturers-india",
    title: "Best AI Tool for Textile Manufacturers: What to Look For in 2026",
    description:
      "A practical buyer's guide for Indian textile manufacturers picking an AI mockup tool. Article code overlay, bulk mode, Indian models, WhatsApp-ready output — what actually matters.",
    excerpt:
      "Picking an AI textile tool? Don't fall for generic global products. Here is what actually matters for an Indian factory, wholesaler or D2C brand.",
    keywords: [
      "best AI textile tool India",
      "AI for textile manufacturers",
      "textile AI software India",
      "AI catalogue tool India",
      "factory AI textile",
      "wholesale catalogue AI",
    ],
    category: "Textile",
    author: "AgentForge Team",
    publishedAt: "2026-05-20T00:00:00.000Z",
    readMinutes: 5,
    heroEmoji: "🏭",
    ctaLabel: "Start Free Trial",
    ctaHref: "/textileprints-to-mockup",
    body: [
      {
        type: "p",
        text: "There are dozens of AI image tools now. Most are generic and built for Western fashion. If you run a textile factory, wholesale operation or D2C brand in India, you need a tool built for how your business actually works. Here is the checklist.",
      },

      { type: "h2", text: "1. Indian product categories baked in" },
      {
        type: "p",
        text: "Saree drape, salwar kameez, kurti, kurta-pyjama, lehenga, kidswear, home textile (bedsheet, curtain, cushion, quilt) — your tool must handle these as first-class categories, not generic 'dress' or 'top'. Surat, Jaipur and Tirupur sellers cannot use a tool that drapes a saree like a Western gown.",
      },

      { type: "h2", text: "2. Article code overlay (non-negotiable for wholesale)" },
      {
        type: "p",
        text: "Indian textile wholesale runs on article codes. Every mockup you ship must carry your article number, company name, WhatsApp and website — overlaid cleanly on the image. If you have to manually add this to every image after generation, the tool is wasting your time.",
      },

      { type: "h2", text: "3. Indian model looks" },
      {
        type: "p",
        text: "Bridal Indian, festive Indian, daily wear Indian, family scenes — Western AI tools produce models that look wrong for an Indian catalogue. The right tool gives you Indian skin tones, hair, body language and traditional poses out of the box.",
      },

      { type: "h2", text: "4. WhatsApp + marketplace output" },
      { type: "ul", items: [
        "1080×1080 square — WhatsApp & Instagram",
        "9:16 portrait — Stories & Reels",
        "White-background mode — Amazon, Flipkart, Meesho catalogue rules",
        "Editorial mode — D2C site hero shots and brand campaigns",
      ]},

      { type: "h2", text: "5. Bulk catalogue mode" },
      {
        type: "p",
        text: "A factory or wholesaler shipping 100+ designs a month needs bulk generation — queue 20–50 designs at once, process in parallel, download as a zip. Per-image credit pricing should drop on bulk plans.",
      },

      { type: "h2", text: "6. Credit-based pricing, not 'per minute'" },
      {
        type: "p",
        text: "Indian businesses prefer monthly credit packs over per-second or per-token pricing. You want to budget. AgentForge: Starter ₹1,999 → 1,800 credits → 120 images. Pro Creator ₹9,999 → 12,000 credits → 800 images. Empire ₹39,999 → 50,000 credits → 3,000+ images for factories.",
      },

      { type: "h2", text: "7. Local support" },
      {
        type: "p",
        text: "WhatsApp support, Hindi/English communication, GST invoicing, INR payment via Razorpay — these all matter. International tools usually skip them.",
      },

      { type: "h2", text: "Why AgentForge" },
      {
        type: "p",
        text: "AgentForge AI is the only Indian-built AI textile platform that covers every checkbox above. Saree drape, article overlay, Indian models, bulk catalogue mode, marketplace-ready output, WhatsApp support and INR pricing — all baked in. Used by manufacturers in Surat, Jaipur, Ludhiana and beyond.",
      },
    ],
  },

  // ============================================================
  // JEWELLERY — 2 posts
  // ============================================================
  {
    slug: "ai-jewellery-photography-indian-brands",
    title: "AI Jewellery Photography for Indian Brands: Bridal, Daily Wear & D2C",
    description:
      "How Indian jewellery brands are shooting bridal sets, diamond rings, kundan and daily-wear catalogues without ₹80,000 model shoots. Real workflow + cost breakdown.",
    excerpt:
      "A traditional bridal jewellery shoot in India costs ₹40,000–₹80,000 once you add up model, MUA, security transport and the rest. Here's how brands are doing the same work with AI for ₹500.",
    keywords: [
      "AI jewellery photography India",
      "AI jewellery catalogue Indian brands",
      "bridal jewellery photoshoot AI",
      "diamond ring photoshoot AI",
      "jewellery model AI India",
    ],
    category: "Jewellery",
    author: "AgentForge Team",
    publishedAt: "2026-05-24T00:00:00.000Z",
    readMinutes: 6,
    heroEmoji: "💎",
    ctaLabel: "Try Jewellery AI Studio",
    ctaHref: "/jewellery-ai",
    body: [
      {
        type: "p",
        text: "Indian jewellery brands have always paid a premium for photography. Bridal model + MUA + studio + security transport + photographer + post-production puts a single jewellery shoot at ₹40,000–₹80,000. For a 60-piece catalogue, that easily crosses ₹3–5 lakh. In 2026, the math is changing.",
      },

      { type: "h2", text: "What's actually possible now" },
      { type: "ul", items: [
        "Bridal sets on Indian models for wedding-season campaigns",
        "Diamond ring close-ups with accurate stone reflections",
        "Necklace and pendant lifestyle shots",
        "Earring catalogue images on white background for Amazon, Flipkart, Meesho",
        "Pearl, gold and kundan sets on marble, velvet or studio-lit backgrounds",
        "Bridal editorial campaigns for Instagram and Meta Ads",
      ]},

      { type: "h2", text: "The cost cut, in real rupees" },
      { type: "h3", text: "Old: traditional bridal shoot (per session)" },
      { type: "ul", items: [
        "Bridal model (mid-tier) — ₹15,000–₹40,000",
        "MUA + hair styling — ₹8,000–₹15,000",
        "Studio half-day — ₹6,000–₹15,000",
        "Photographer + post — ₹10,000–₹25,000",
        "Security transport + insurance — ₹3,000–₹8,000",
        "Total: ₹42,000–₹103,000 for 1 session, 15–25 images",
      ]},
      { type: "h3", text: "New: AgentForge plan" },
      { type: "ul", items: [
        "Pro Creator ₹9,999/month → 800 images",
        "Per image: ~₹12",
        "60-piece catalogue cost: ~₹750",
      ]},
      { type: "quote", text: "1 traditional bridal shoot session = a year of AI catalogue for most jewellery brands." },

      { type: "h2", text: "Where jewellery AI shines" },
      { type: "h3", text: "1. Wedding-season campaigns" },
      {
        type: "p",
        text: "Indian wedding season runs October–February. Earlier, jewellery brands had to lock bridal model shoots 8 weeks in advance. Now you launch campaigns 6 days in advance — adjusting jewellery, models and looks based on what's selling.",
      },
      { type: "h3", text: "2. Marketplace listings" },
      {
        type: "p",
        text: "Amazon, Flipkart and Meesho require specific image formats (white background, product centred, no props). AgentForge's 'No Model + White Background' mode produces marketplace-compliant images in 30 seconds — letting you refresh hundreds of SKUs in a day.",
      },
      { type: "h3", text: "3. Festive Instagram drops" },
      {
        type: "p",
        text: "Karwa Chauth, Diwali, Rakhi, Akshaya Tritiya — every festive drop demands new creative. AI generates festive-lit bridal, daily-wear and gifting visuals on demand.",
      },
      { type: "h3", text: "4. Wholesalers shipping daily WhatsApp catalogues" },
      {
        type: "p",
        text: "Jewellery wholesale runs on WhatsApp the same way textile does. AI lets you ship 5x more catalogue images per drop, with brand overlay and pricing tag built in.",
      },

      { type: "h2", text: "What you upload, what you get" },
      { type: "ul", items: [
        "Upload: clear product photo of the jewellery (phone or studio camera)",
        "Pick: jewellery type (ring, necklace, earring, bridal set), model look, shoot style",
        "Output: HD catalogue image with brand overlay, ready for WhatsApp/Amazon/Instagram",
      ]},

      { type: "h2", text: "The categories handled natively" },
      { type: "ul", items: [
        "Diamond — solitaire, eternity, halo, cocktail",
        "Gold — temple, antique, daily-wear",
        "Kundan, polki, jadau — bridal editorial",
        "Pearl — single-line, multi-strand, drops",
        "Oxidised silver — fusion and contemporary",
        "Brass and artificial — gifting and festive",
      ]},

      { type: "h2", text: "What hasn't changed" },
      {
        type: "p",
        text: "Your craftsmanship, your stones, your designs, your customer relationships — these are still the business. AI just took the photography bill out of the equation.",
      },
    ],
  },

  {
    slug: "how-local-jewellers-create-luxury-campaigns",
    title: "How Local Jewellers Can Create Luxury Campaigns Without a Brand Agency",
    description:
      "Small-town and city jewellers can now ship campaigns that look like Tanishq — without paying agency retainers. Here's the AI-first playbook for independent Indian jewellers.",
    excerpt:
      "Your local jeweller is competing with Tanishq's catalogue, Kalyan's billboards and CaratLane's Instagram. AI just made it possible to compete on creative — without a brand agency on retainer.",
    keywords: [
      "local jeweller AI campaign",
      "small jeweller marketing AI",
      "independent jewellery brand campaign",
      "jewellery shop catalogue AI",
      "luxury jewellery AI campaign India",
    ],
    category: "Jewellery",
    author: "AgentForge Team",
    publishedAt: "2026-05-19T00:00:00.000Z",
    readMinutes: 5,
    heroEmoji: "👑",
    ctaLabel: "Build Your Campaign",
    ctaHref: "/jewellery-ai",
    body: [
      {
        type: "p",
        text: "Walk into any Tier-2 or Tier-3 city in India and you will find 30 jewellery shops competing on the same street. They all have similar designs, similar pricing, similar customer base. The only thing that separates them is presentation — and presentation has always cost ₹2–5 lakh per campaign, which independents could not afford.",
      },
      {
        type: "p",
        text: "In 2026, that's no longer true. A local jeweller in Jaipur, Indore, Coimbatore, Surat or Lucknow can now ship a wedding-season campaign that looks indistinguishable from Tanishq, Kalyan or CaratLane — without an agency, without a model, without a studio.",
      },

      { type: "h2", text: "What 'luxury campaign' actually means" },
      { type: "p", text: "A luxury jewellery campaign is built from 4 ingredients:" },
      { type: "ul", items: [
        "An Indian bridal model with the right look (skin tone, hair, expression, jewellery suitability)",
        "Studio-grade lighting that flatters gold, diamond or kundan",
        "A festive or editorial backdrop (marble, velvet, lifestyle scene)",
        "Editorial composition — close-ups, layered framing, story arc across the campaign",
      ]},
      {
        type: "p",
        text: "AgentForge Jewellery AI Studio generates all four ingredients from a single product photo — in 30 seconds.",
      },

      { type: "h2", text: "The 1-day campaign workflow" },
      { type: "h3", text: "Morning: upload + generate" },
      { type: "ul", items: [
        "Photograph your collection (8–15 pieces) with phone camera in good light",
        "Upload to AgentForge",
        "Pick bridal model + festive lighting + marble or velvet backdrop",
        "Generate 3 variants per piece (close-up, half-portrait, full editorial) — 90 seconds per piece",
      ]},
      { type: "h3", text: "Afternoon: review + brand overlay" },
      { type: "ul", items: [
        "Review the 24–45 generated images",
        "Regenerate any that aren't quite right",
        "Add your brand name, address, phone and Instagram handle as overlay",
      ]},
      { type: "h3", text: "Evening: campaign live" },
      { type: "ul", items: [
        "Drop into WhatsApp customer groups",
        "Schedule Instagram posts for the week",
        "Send catalogue to local print for shop window display",
        "Launch Meta Ads with the strongest hero shot",
      ]},

      { type: "h2", text: "What independents can now do that they couldn't before" },
      { type: "ul", items: [
        "Run a 30-piece bridal campaign for ₹400, not ₹4 lakh",
        "Refresh the catalogue every week instead of every 6 months",
        "Test 3 different bridal looks for the same necklace to see which sells",
        "Launch festive collections in 2 days instead of 8 weeks",
        "Compete with national brands on Instagram with the same production value",
      ]},

      { type: "h2", text: "The strategic shift" },
      {
        type: "p",
        text: "Independent jewellers have always had the design and craftsmanship to compete. What they lacked was distribution — and distribution today is photography. Anyone scrolling Instagram or browsing your WhatsApp catalogue is deciding in 2 seconds whether your brand looks 'serious'. AI takes that decision in your favour, every time.",
      },
      { type: "quote", text: "Your craftsmanship deserves the same presentation as Tanishq. Now you can afford it." },
    ],
  },

  // ============================================================
  // PRODUCTOGRAPHY — 1 post
  // ============================================================
  {
    slug: "mobile-photo-to-professional-product-shoot-ai",
    title: "Mobile Photo to Professional Product Shoot Using AI",
    description:
      "How D2C brands and ecommerce sellers across India are turning iPhone product photos into Amazon-ready hero shots in 30 seconds. Real workflow + before/after.",
    excerpt:
      "Your phone camera is already enough. Here is exactly how Indian D2C brands are skipping ₹15,000 product shoots and shipping Amazon-ready hero images from their phone in 30 seconds.",
    keywords: [
      "mobile photo to product shoot AI",
      "phone photo to Amazon hero",
      "AI product photography mobile",
      "iPhone product photo AI",
      "D2C product shoot from mobile",
      "ecommerce product photo AI India",
    ],
    category: "Productography",
    author: "AgentForge Team",
    publishedAt: "2026-05-23T00:00:00.000Z",
    readMinutes: 5,
    heroEmoji: "📱",
    ctaLabel: "Try Productography AI",
    ctaHref: "/productography-ai",
    body: [
      {
        type: "p",
        text: "Indian D2C brands and ecommerce sellers used to spend ₹5,000–₹25,000 per product shoot session — covering 6–10 SKUs in a half-day. By the time the catalogue arrived, half the products had moved to the next season. In 2026, you don't need that shoot. You need a phone, a clean surface and AgentForge Productography AI.",
      },

      { type: "h2", text: "The categories where this works incredibly well" },
      { type: "ul", items: [
        "Skincare and cosmetics — bottles, jars, sachets, packaging",
        "Perfume and fragrance — luxury bottles, premium boxes",
        "Watches and sunglasses — fashion accessories",
        "Mobile, electronics, gadgets — tech hero shots",
        "Food and beverage — packaged products, hero plates",
        "Home decor and lifestyle products",
      ]},

      { type: "h2", text: "The 3-minute workflow" },
      { type: "h3", text: "Step 1: Phone photo (60 seconds)" },
      { type: "ul", items: [
        "Place product on a clean surface near a window for natural light",
        "Take 2–3 photos from different angles",
        "Make sure the brand label is readable",
        "Don't worry about background — AI will replace it",
      ]},
      { type: "h3", text: "Step 2: Upload + pick style (30 seconds)" },
      { type: "ul", items: [
        "Open Productography AI on phone or laptop",
        "Upload the best photo",
        "Pick category (cosmetics, perfume, watch, etc.)",
        "Pick shoot style: luxury studio, lifestyle scene, plain white, festive editorial, outdoor premium",
      ]},
      { type: "h3", text: "Step 3: Generate (30 seconds)" },
      { type: "p", text: "AI produces a DSLR-grade hero shot with your product positioned, lit and composed for the chosen use case." },
      { type: "h3", text: "Step 4: Ship (60 seconds)" },
      { type: "ul", items: [
        "Download in 1080×1080 for Amazon, Flipkart, Meesho, Instagram",
        "Or 9:16 for Stories, Reels and Meta Ads",
        "Brand overlay (your logo, website, WhatsApp) added automatically",
      ]},

      { type: "h2", text: "What gets preserved, what gets transformed" },
      { type: "h3", text: "Preserved (your product stays your product)" },
      { type: "ul", items: [
        "Brand label and packaging text",
        "Product shape, colour and silhouette",
        "Logo, batch number, regulatory text",
        "Distinguishing design features",
      ]},
      { type: "h3", text: "Transformed (the AI does the studio work)" },
      { type: "ul", items: [
        "Background and surface",
        "Lighting direction and quality",
        "Shadow and reflection placement",
        "Composition and framing",
      ]},

      { type: "h2", text: "Use cases by channel" },
      { type: "ul", items: [
        "Amazon main image — Plain White, product centred, marketplace compliant",
        "Flipkart top card — White background, slight angle for depth",
        "Meesho thumbnail — Bright, lifestyle-leaning",
        "Instagram feed — Festive or lifestyle backdrop, brand-storied",
        "Meta Ads creative — Bold composition, high contrast, scroll-stopping",
        "WhatsApp business catalogue — Clean, square, brand overlay",
      ]},

      { type: "h2", text: "The honest take" },
      {
        type: "p",
        text: "If you're a D2C brand, ecommerce seller, or running a small product line, you no longer need to budget thousands for product photography. Your phone + AgentForge = a complete in-house product photography setup. Spend the photography budget on better products instead.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
