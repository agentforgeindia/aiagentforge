import type { Metadata } from "next";
import Link from "next/link";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "Supported Industries — AgentForge AI",
  description:
    "Industries AgentForge serves — textile, jewellery, ecommerce, wholesale, F&B, beauty, electronics, and more. Built for Indian businesses shipping AI catalogues at scale.",
  keywords: [
    "AgentForge supported industries",
    "AI mockup for textile",
    "AI catalogue for jewellery",
    "AI product photography for ecommerce",
    "AI catalogue for wholesale",
    "AI mockup for D2C India",
  ],
  alternates: { canonical: `${SITE}/supported-industries` },
  openGraph: {
    title: "Supported Industries — AgentForge AI",
    description:
      "Where AgentForge shines — from Surat sarees to Coimbatore jewellery to Amazon D2C catalogues.",
    url: `${SITE}/supported-industries`,
    type: "website",
  },
};

type Industry = {
  emoji: string;
  title: string;
  desc: string;
  useCases: string[];
  agent: { label: string; href: string };
  accent: "cyan" | "amber" | "violet" | "emerald" | "rose" | "indigo";
};

const INDUSTRIES: Industry[] = [
  {
    emoji: "👕",
    title: "Textile & Fashion",
    desc: "Saree, kurti, kurta, lehenga, kidswear, home textile, men's wear, women's wear. The largest user base on AgentForge — Surat, Jaipur, Tirupur, Ludhiana, Mumbai, Delhi.",
    useCases: [
      "Model-worn saree drapes with festive lighting",
      "Kurti catalogue images for WhatsApp wholesale",
      "Kurta and Sherwani groom-wear mockups",
      "Lehenga bridal shoots without booking a model",
      "Kidswear cute family-safe lifestyle visuals",
      "Home textile (curtains, bedsheets) lifestyle scenes",
    ],
    agent: { label: "TextilePrints to Mockup AI", href: "/textileprints-to-mockup" },
    accent: "cyan",
  },
  {
    emoji: "💎",
    title: "Jewellery",
    desc: "Bridal sets, daily-wear pieces, gold, diamond, kundan, polki, pearl, silver. Used by Coimbatore manufacturers, Mumbai bridal houses, and D2C jewellery brands across India.",
    useCases: [
      "Bridal set hero shots (necklace + earrings + maang tikka)",
      "Necklace on model — multi-look in 30 seconds",
      "Daily-wear ring / earring close-up lifestyle",
      "Editorial luxury campaign visuals",
      "Wholesale catalogue with article codes",
      "Festive (Karwa Chauth, Diwali, Akshaya Tritiya) collections",
    ],
    agent: { label: "Jewellery AI Studio", href: "/jewellery-ai" },
    accent: "amber",
  },
  {
    emoji: "🛒",
    title: "E-commerce & D2C",
    desc: "Amazon, Flipkart, Meesho, Myntra, Ajio, Tata Cliq, Nykaa, JioMart sellers. AI-generated main images, A+ Content lifestyle scenes, brand store banners and ad creatives.",
    useCases: [
      "Amazon main image (pure white, marketplace-compliant)",
      "A+ Content lifestyle variants",
      "Brand store hero banners (1500×600)",
      "Sponsored Brand ad creatives — A/B variants",
      "Flipkart Plus / Quick Listings",
      "Meesho main + secondary images at scale",
    ],
    agent: { label: "Productography AI", href: "/productography-ai" },
    accent: "violet",
  },
  {
    emoji: "💬",
    title: "WhatsApp wholesale & retail",
    desc: "WhatsApp Business catalogue creation and wholesale group drops — the #1 sales channel for Indian textile and jewellery wholesalers.",
    useCases: [
      "Daily catalogue drops with brand overlay",
      "Wholesale group images (10–20 per drop)",
      "Single-product cards with article code + phone",
      "Festive collection mailers via WhatsApp",
      "Resell-ready images for retailers",
    ],
    agent: { label: "Productography AI", href: "/productography-ai" },
    accent: "emerald",
  },
  {
    emoji: "💄",
    title: "Beauty & Personal Care",
    desc: "Skincare, haircare, cosmetics, fragrance brands. Hero shots, lifestyle pours, ingredient close-ups, and gift-set photography.",
    useCases: [
      "Skincare lifestyle (hand pour, vanity, morning routine)",
      "Cosmetic packshots on premium backgrounds",
      "Fragrance bottle hero with editorial mood",
      "Ingredient close-ups for A+ Content",
      "Gift-set multi-pack flat lays",
    ],
    agent: { label: "Productography AI", href: "/productography-ai" },
    accent: "rose",
  },
  {
    emoji: "📱",
    title: "Electronics & Gadgets",
    desc: "Earbuds, phone accessories, smartwatches, home electronics. Clean catalogue shots plus lifestyle in-use scenes.",
    useCases: [
      "Earbuds and headphones on premium surfaces",
      "Smartwatch wrist-shot lifestyle",
      "Home electronics (speakers, lights) in real interior scenes",
      "Charger and accessory packshots",
      "Tech ad creatives for Meta and Google ads",
    ],
    agent: { label: "Productography AI", href: "/productography-ai" },
    accent: "indigo",
  },
  {
    emoji: "🍫",
    title: "Food & Beverage",
    desc: "Packaged food, beverages, snacks, festive sweets. Lifestyle in-context, hero pack shots, and Amazon-compliant main images.",
    useCases: [
      "Packaged snack and chocolate hero packshots",
      "Beverage lifestyle (chilled glass, festive table)",
      "Festive sweets and gift-box mockups",
      "Multi-pack catalogue shots for wholesale",
      "Recipe/usage suggestion lifestyle visuals",
    ],
    agent: { label: "Productography AI", href: "/productography-ai" },
    accent: "amber",
  },
  {
    emoji: "🏠",
    title: "Home, Decor & Lifestyle",
    desc: "Home decor, kitchen tools, lifestyle accessories, planters. Real interior-scene mockups without booking a home shoot.",
    useCases: [
      "Decor pieces in styled living room scenes",
      "Kitchen tools in real cooking setups",
      "Planters and indoor garden mockups",
      "Wall art and prints in room contexts",
      "Bedding and bath products in lifestyle scenes",
    ],
    agent: { label: "Productography AI", href: "/productography-ai" },
    accent: "emerald",
  },
];

const ACCENT_BG: Record<Industry["accent"], string> = {
  cyan: "from-cyan-400/15 to-blue-500/15 border-cyan-300/40",
  amber: "from-amber-400/15 to-orange-500/15 border-amber-300/40",
  violet: "from-violet-400/15 to-fuchsia-500/15 border-violet-300/40",
  emerald: "from-emerald-400/15 to-teal-500/15 border-emerald-300/40",
  rose: "from-rose-400/15 to-pink-500/15 border-rose-300/40",
  indigo: "from-indigo-400/15 to-blue-500/15 border-indigo-300/40",
};

const ACCENT_PILL: Record<Industry["accent"], string> = {
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/30",
  amber:
    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30",
  violet:
    "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/30",
  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30",
  rose:
    "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30",
  indigo:
    "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    {
      "@type": "ListItem",
      position: 2,
      name: "Supported Industries",
      item: `${SITE}/supported-industries`,
    },
  ],
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: INDUSTRIES.map((ind, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: ind.title,
  })),
};

export default function SupportedIndustriesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee40,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf640,transparent_32%)]" />

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-14 md:py-20">
        {/* Hero */}
        <div className="mb-10 rounded-[2.2rem] border border-black/10 bg-white/85 p-7 shadow-2xl backdrop-blur-xl md:p-10 dark:border-white/10 dark:bg-white/[0.07]">
          <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
            Who AgentForge serves
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Industries we{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              ship catalogues for
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-black/60 dark:text-white/65 md:text-lg">
            From Surat saree wholesalers to Coimbatore jewellery houses to
            Mumbai D2C brands — AgentForge powers AI catalogue generation for
            the industries that drive Indian commerce.
          </p>
        </div>

        {/* Industries grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {INDUSTRIES.map((ind) => (
            <article
              key={ind.title}
              className={`flex h-full flex-col overflow-hidden rounded-[2rem] border bg-gradient-to-br p-6 shadow-xl backdrop-blur-xl md:p-7 ${ACCENT_BG[ind.accent]}`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="text-5xl" aria-hidden="true">
                  {ind.emoji}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${ACCENT_PILL[ind.accent]}`}
                >
                  Live
                </span>
              </div>
              <h2 className="text-xl font-black md:text-2xl">{ind.title}</h2>
              <p className="mt-2 text-sm leading-7 text-black/65 dark:text-white/75">
                {ind.desc}
              </p>

              <h3 className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Common use cases
              </h3>
              <ul className="mt-2 space-y-1.5">
                {ind.useCases.map((u) => (
                  <li
                    key={u}
                    className="flex items-start gap-2 text-sm leading-6 text-black/70 dark:text-white/75"
                  >
                    <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-2 pt-2">
                <Link
                  href={ind.agent.href}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-md transition hover:scale-105"
                >
                  Try {ind.agent.label} →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Don't see your industry */}
        <section className="mt-12 rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-7 shadow-xl backdrop-blur-xl md:p-9">
          <h2 className="text-2xl font-black md:text-3xl">
            Don't see your industry?
          </h2>
          <p className="mt-3 leading-8 text-black/70 dark:text-white/75">
            AgentForge's three live agents (Textile, Jewellery, Productography)
            cover most product-photography use cases. If yours has unique
            requirements — pharma, automotive parts, agricultural,
            heritage/artisan — email{" "}
            <a
              href="mailto:info@aiagentforge.in"
              className="font-black text-cyan-600 underline"
            >
              info@aiagentforge.in
            </a>{" "}
            and we'll tell you straight what's possible today and what's on the
            roadmap.
          </p>
        </section>
      </section>
    </main>
  );
}
