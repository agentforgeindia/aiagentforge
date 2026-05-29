import type { Metadata } from "next";
import Link from "next/link";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "Commercial Usage Policy — AgentForge AI",
  description:
    "Full commercial rights for every AI output you generate on AgentForge. Allowed uses, restrictions, and licensing clarity for textile, jewellery and product brands in India.",
  keywords: [
    "AgentForge commercial usage",
    "AI image commercial rights",
    "AI mockup commercial use India",
    "AI generated image license",
    "commercial AI catalogue",
  ],
  alternates: { canonical: `${SITE}/commercial-usage-policy` },
  openGraph: {
    title: "Commercial Usage Policy — AgentForge AI",
    description:
      "What you can do with the AI images you generate on AgentForge. Clear, founder-signed.",
    url: `${SITE}/commercial-usage-policy`,
    type: "website",
  },
};

const ALLOWED = [
  {
    title: "E-commerce listings",
    body: "Amazon, Flipkart, Meesho, Myntra, Ajio, Tata Cliq, Nykaa — main images, secondary images, A+ Content, brand store banners, sponsored ad creatives. Marketplace policies still apply (e.g. Amazon's main-image purity rules), but the AI generation rights are yours.",
  },
  {
    title: "WhatsApp Business catalogue & wholesale drops",
    body: "Daily catalogue drops, wholesale group images, single-product cards with brand overlay — all fully permitted commercial use.",
  },
  {
    title: "Social media content",
    body: "Instagram feed, Reels, Stories, Facebook, LinkedIn, Pinterest, X, YouTube thumbnails. Both organic and paid ad creatives — fully allowed.",
  },
  {
    title: "Print marketing",
    body: "Brochures, lookbooks, catalogues, festive collection mailers, in-store posters, billboards, magazine inserts. AI images can scale to print without licence fees.",
  },
  {
    title: "Packaging & POS",
    body: "Carton inserts, product labels, point-of-sale displays, hangtags, swatch cards — all permitted, including for goods you resell or wholesale.",
  },
  {
    title: "Brand websites and PDP",
    body: "Your D2C site, your Shopify, WooCommerce, Magento or custom storefront. Product detail pages, hero banners, blog visuals — full rights.",
  },
];

const NOT_ALLOWED = [
  {
    title: "Reselling the AgentForge platform itself",
    body: "You can't take AgentForge, wrap it as 'YourCompany AI Studio' and resell it. White-label and reseller arrangements need a separate written agreement — email info@aiagentforge.in.",
  },
  {
    title: "Training competing AI models",
    body: "AgentForge outputs cannot be used as training data for a competing image-generation model, fine-tune, LoRA or adversarial study.",
  },
  {
    title: "Scraping or automated bulk export",
    body: "Programmatic scraping of the platform, of your own output gallery beyond reasonable use, or coordinated multi-account abuse are not allowed.",
  },
  {
    title: "Counterfeit and impersonation",
    body: "Mockups designed to deceive a buyer into thinking your product is a different brand's product (counterfeit Nike, Louis Vuitton etc.) are not permitted under this policy or under Indian trademark law.",
  },
  {
    title: "Illegal goods and unsafe claims",
    body: "Drugs, weapons, fraudulent product claims, or anything our AI Safety Policy already prohibits — even if the visual is technically generated, the commercial use is not allowed.",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    {
      "@type": "ListItem",
      position: 2,
      name: "Commercial Usage Policy",
      item: `${SITE}/commercial-usage-policy`,
    },
  ],
};

export default function CommercialUsagePolicyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee40,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf640,transparent_32%)]" />

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
        {/* Hero */}
        <div className="mb-10 rounded-[2.2rem] border border-black/10 bg-white/85 p-7 shadow-2xl backdrop-blur-xl md:p-10 dark:border-white/10 dark:bg-white/[0.07]">
          <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
            Commercial Rights
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            You own every image you generate
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-black/60 dark:text-white/65 md:text-lg">
            AgentForge is built for commercial use. Every output you generate on
            a paid plan is yours — to sell, ship, print, ad-spend or paste on
            your packaging. No royalties, no per-image licence, no surprises.
          </p>
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
              Founder-signed promise
            </p>
            <p className="mt-1 text-sm text-black/70 dark:text-white/75">
              We will never come back asking for usage fees on images you
              generated under an active plan. If your subscription lapses, the
              images you already generated stay yours.
            </p>
          </div>
        </div>

        {/* Allowed */}
        <h2 className="mb-5 text-2xl font-black md:text-3xl">
          ✅ Fully allowed commercial uses
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {ALLOWED.map((a) => (
            <section
              key={a.title}
              className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-50/40 p-5 dark:border-emerald-400/20 dark:bg-emerald-500/10"
            >
              <h3 className="flex items-start gap-2 text-base font-black">
                <span className="mt-0.5 text-emerald-500">✓</span>
                {a.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
                {a.body}
              </p>
            </section>
          ))}
        </div>

        {/* Not allowed */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          ❌ What's not allowed
        </h2>
        <div className="space-y-3">
          {NOT_ALLOWED.map((n) => (
            <section
              key={n.title}
              className="rounded-[1.5rem] border border-rose-300/30 bg-rose-50/40 p-6 dark:border-rose-400/20 dark:bg-rose-500/10"
            >
              <h3 className="flex items-start gap-2 text-base font-black md:text-lg">
                <span className="mt-0.5 text-rose-500">✕</span>
                {n.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
                {n.body}
              </p>
            </section>
          ))}
        </div>

        {/* Watermark + free vs paid */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Watermarks — free vs paid
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-[1.7rem] border border-black/10 bg-white/85 p-6 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
            <h3 className="text-base font-black md:text-lg">
              Free account (100 starter credits)
            </h3>
            <p className="mt-2 text-sm leading-7 text-black/65 dark:text-white/65">
              Outputs include a small "AgentForge" watermark on a corner. You
              can use these images for testing, internal preview, or any
              non-commercial purpose. For commercial deployment, upgrade to any
              paid plan and re-generate watermark-free.
            </p>
          </section>
          <section className="rounded-[1.7rem] border border-cyan-300/40 bg-cyan-50/40 p-6 shadow-md backdrop-blur dark:border-cyan-400/30 dark:bg-cyan-500/10">
            <h3 className="text-base font-black md:text-lg">
              Paid plans (Starter, Pro Creator, Empire)
            </h3>
            <p className="mt-2 text-sm leading-7 text-black/65 dark:text-white/65">
              Watermark-free. You can place your own brand overlay (logo, phone,
              website, address) at any configurable corner instead — included
              for every generation.
            </p>
          </section>
        </div>

        {/* CTA */}
        <section className="mt-12 rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-7 shadow-xl backdrop-blur-xl md:p-9">
          <h2 className="text-2xl font-black md:text-3xl">
            Questions about a specific commercial use case?
          </h2>
          <p className="mt-3 leading-8 text-black/70 dark:text-white/75">
            Enterprise, agency, white-label or reseller use cases — email{" "}
            <a
              href="mailto:info@aiagentforge.in"
              className="font-black text-cyan-600 underline"
            >
              info@aiagentforge.in
            </a>{" "}
            with details and we'll respond within 2 working days. See also our{" "}
            <Link
              href="/ai-safety-policy"
              className="font-black text-cyan-600 underline"
            >
              AI Safety Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms"
              className="font-black text-cyan-600 underline"
            >
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </section>
      </section>
    </main>
  );
}
