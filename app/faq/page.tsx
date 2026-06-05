import type { Metadata } from "next";
import Link from "next/link";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions | AgentForge AI",
  description:
    "Answers to the most common questions about AgentForge AI — pricing, credits, image quality, commercial usage, data privacy and supported platforms.",
  keywords: [
    "AgentForge FAQ",
    "AI mockup generator FAQ",
    "AI catalogue questions",
    "AI textile mockup FAQ India",
    "AI jewellery photoshoot FAQ",
    "AI productography FAQ",
  ],
  alternates: { canonical: `${SITE}/faq` },
  openGraph: {
    title: "FAQ — Frequently Asked Questions | AgentForge AI",
    description:
      "Honest answers about credits, pricing, quality, commercial use, data security and more.",
    url: `${SITE}/faq`,
    type: "website",
  },
};

// ────────────────────────────────────────────────────────────
// FAQ data — grouped by section. Edit here; schema + UI both
// pull from this single source of truth.
// ────────────────────────────────────────────────────────────

type QA = { q: string; a: string };
type Section = { title: string; emoji: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    title: "About AgentForge",
    emoji: "🚀",
    items: [
      {
        q: "What is AgentForge AI?",
        a: "AgentForge is India's AI visual studio. We turn flat product photos into model-worn fashion mockups, jewellery photoshoots and catalogue-ready product images in 30 seconds — without models, studios or traditional photo shoots.",
      },
      {
        q: "Who is AgentForge built for?",
        a: "Indian textile manufacturers, jewellery brands, D2C sellers, Amazon / Flipkart / Meesho sellers, WhatsApp wholesalers and creative agencies. If your business needs catalogue images at scale, AgentForge is built for you.",
      },
      {
        q: "Which AI agents are live today?",
        a: "Three live agents: (1) TextilePrints to Mockup AI — model-worn fashion mockups, (2) Jewellery AI Studio — bridal and daily-wear jewellery photoshoots, (3) Productography AI — product photos and ad creatives. More agents (UGC, TrendForge) are in private beta.",
      },
      {
        q: "Where is AgentForge based?",
        a: "We operate across India — remote-first team. Email support: info@aiagentforge.in.",
      },
    ],
  },
  {
    title: "Pricing & Credits",
    emoji: "💰",
    items: [
      {
        q: "How do credits work?",
        a: "Every generation costs credits depending on output size, quality and add-ons (logo overlay, brand text). A standard 1080×1080 jewellery or textile mockup costs around 15 credits. Bulk and large-format outputs cost more.",
      },
      {
        q: "What plans do you offer?",
        a: "Starter (₹1,999 — 1,800 credits ≈ 120 generations), Pro Creator (₹9,999 — 12,000 credits ≈ 800 generations), Empire (₹39,999 — 50,000 credits with bulk-studio access). See /pricing for the full breakdown.",
      },
      {
        q: "Do credits expire?",
        a: "Credits remain available within your active subscription period. We recommend using them during your billing cycle for the most predictable balance.",
      },
      {
        q: "Do I get free credits to try?",
        a: "Yes — new signups receive 100 free credits, no credit card required. Enough to test all three live agents.",
      },
      {
        q: "Is there a money-back guarantee?",
        a: "Subscription fees are non-refundable per our Refund Policy. However, credits are refunded automatically when a generation fails on our side — without you having to ask.",
      },
    ],
  },
  {
    title: "Generation & Quality",
    emoji: "🎨",
    items: [
      {
        q: "How long does one generation take?",
        a: "Most generations finish in 25–40 seconds. Bulk generations process in parallel — 50 SKUs typically complete in around 12 minutes.",
      },
      {
        q: "What output resolution do I get?",
        a: "Standard output is HD 1080×1080 (perfect for Amazon, Flipkart, Meesho, Instagram). 9:16 vertical and 16:9 horizontal sizes are available for Stories, Reels and ads. Empire-plan users can request HD+ formats.",
      },
      {
        q: "Will the AI change my product's appearance?",
        a: "No. AgentForge preserves your product's shape, colour, fabric pattern and brand text. The AI transforms only the background, lighting and the model wearing/holding the product.",
      },
      {
        q: "Can I add my logo and brand details automatically?",
        a: "Yes. Every agent supports a brand overlay block — your company name, logo, phone, website and address can be placed at configurable corners on every output. Free accounts also carry an AgentForge watermark.",
      },
      {
        q: "What if I don't like the result?",
        a: "Generations consume credits regardless of taste fit. If the output has a clear technical issue (broken composition, distorted product), email info@aiagentforge.in with your generation ID and we'll review for a credit refund.",
      },
    ],
  },
  {
    title: "Commercial Use",
    emoji: "🛍️",
    items: [
      {
        q: "Can I use the generated images commercially?",
        a: "Yes. You own the outputs you generate on AgentForge — full commercial rights for catalogues, ads, social media, e-commerce listings, packaging and printed marketing. See /commercial-usage-policy for the complete rights statement.",
      },
      {
        q: "Are the images watermarked?",
        a: "Paid plans deliver watermark-free images. Free accounts include a small AgentForge watermark on the output.",
      },
      {
        q: "Can I resell AgentForge as my own white-label tool?",
        a: "No. Re-selling the platform, scraping our APIs, or training competing AI models on our outputs is not allowed. Selling the IMAGES themselves (as part of a catalogue, ad, or product listing) is absolutely allowed.",
      },
    ],
  },
  {
    title: "Data & Privacy",
    emoji: "🔒",
    items: [
      {
        q: "Where are my uploaded images stored?",
        a: "Uploads are stored on Supabase Storage (a SOC 2-certified cloud) in encrypted form. Your private uploads are not publicly displayed, sold or shared with third parties.",
      },
      {
        q: "Do you train AI models on my uploads?",
        a: "No. Your uploads and outputs are used only to fulfil your generation requests. We do not train, fine-tune or share AI models using customer content.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. Visit your profile → Settings → Delete Account. All your generations, uploads and account data are removed. For GDPR-style data export, email info@aiagentforge.in.",
      },
      {
        q: "Are you DPDP Act 2023 compliant?",
        a: "Yes. We follow India's Digital Personal Data Protection Act 2023 — including data principal rights, consent management, retention transparency and grievance officer disclosure. See /data-protection for the full policy.",
      },
    ],
  },
  {
    title: "Technical",
    emoji: "⚙️",
    items: [
      {
        q: "Which file formats do you accept for uploads?",
        a: "JPG, PNG, WebP and AVIF up to 10 MB per file. For best results, upload the highest-resolution photo you have — well-lit, sharp, with the product clearly visible.",
      },
      {
        q: "Do you have an API for bulk generation?",
        a: "Empire-plan users get bulk studio access through the web UI (batch up to 100 items per run). A dedicated REST API for programmatic generation is on our roadmap — contact info@aiagentforge.in if you want early access.",
      },
    ],
  },
];

// Flatten Q&As for FAQPage schema.
const allQAs: QA[] = SECTIONS.flatMap((s) => s.items);

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: allQAs.map((qa) => ({
    "@type": "Question",
    name: qa.q,
    acceptedAnswer: { "@type": "Answer", text: qa.a },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE}/faq` },
  ],
};

function FaqDoodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Question mark top-left */}
      <svg className="absolute left-6 top-20 h-16 w-16 text-cyan-400/25 dark:text-cyan-400/15" viewBox="0 0 64 64" fill="none">
        <text x="8" y="52" fontSize="52" fontWeight="900" fill="currentColor" fontFamily="serif">?</text>
      </svg>
      {/* Speech bubble top-right */}
      <svg className="absolute right-10 top-14 h-14 w-14 text-purple-400/30 dark:text-purple-400/20" viewBox="0 0 64 64" fill="none">
        <rect x="4" y="4" width="46" height="34" rx="10" stroke="currentColor" strokeWidth="3" />
        <path d="M14 38 L10 52 L26 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Dashed circle mid-left */}
      <svg className="absolute left-8 top-1/2 h-20 w-20 text-blue-400/20" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="3" strokeDasharray="6 8" />
      </svg>
      {/* Dot grid bottom-right */}
      <svg className="absolute bottom-32 right-8 h-16 w-16 text-cyan-400/20" viewBox="0 0 48 48" fill="currentColor">
        {[8,20,32,44].map(y => [8,20,32,44].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" />))}
      </svg>
      {/* Another question mark bottom-left */}
      <svg className="absolute bottom-20 left-16 h-12 w-12 text-purple-400/20 dark:text-purple-400/10 animate-pulse" viewBox="0 0 48 48" fill="none">
        <text x="6" y="40" fontSize="38" fontWeight="900" fill="currentColor" fontFamily="serif">?</text>
      </svg>
      {/* Wavy line */}
      <svg className="absolute right-4 top-1/2 h-10 w-28 text-cyan-400/20" viewBox="0 0 120 40" fill="none">
        <path d="M2 20 Q 20 4, 38 20 T 74 20 T 110 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function FAQPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <FaqDoodles />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee40,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf640,transparent_32%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.04))]" />

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
        {/* Header card */}
        <div className="mb-8 rounded-[2.2rem] border border-black/10 bg-white/85 p-7 shadow-2xl backdrop-blur-xl md:p-10 dark:border-white/10 dark:bg-white/[0.07]">
          <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
            AgentForge Help Centre
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Frequently asked questions
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-black/60 dark:text-white/65 md:text-lg">
            Quick honest answers about credits, pricing, image quality,
            commercial usage, data privacy and platform technicals. Can't find
            your question? Email{" "}
            <a
              href="mailto:info@aiagentforge.in"
              className="font-black text-cyan-600 underline"
            >
              info@aiagentforge.in
            </a>
            .
          </p>

          {/* Quick anchors */}
          <div className="mt-6 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.title}
                href={`#${slug(s.title)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs font-bold text-black/70 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
              >
                <span>{s.emoji}</span>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              id={slug(section.title)}
              className="scroll-mt-24"
            >
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-black md:text-3xl">
                <span aria-hidden="true">{section.emoji}</span>
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((qa) => (
                  <details
                    key={qa.q}
                    className="group rounded-2xl border border-black/10 bg-white/85 p-5 shadow-md backdrop-blur transition open:shadow-xl dark:border-white/10 dark:bg-white/[0.05]"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-black md:text-base">
                      {qa.q}
                      <span className="text-2xl text-cyan-500 transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-black/65 dark:text-white/65 md:text-base md:leading-8">
                      {qa.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA card */}
        <section className="mt-12 rounded-[1.7rem] border border-cyan-400/25 bg-cyan-400/10 p-6 text-center md:p-8">
          <h2 className="text-2xl font-black">Still have questions?</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-8 text-black/60 dark:text-white/65">
            Email{" "}
            <a
              href="mailto:info@aiagentforge.in"
              className="font-black text-cyan-600 underline"
            >
              info@aiagentforge.in
            </a>{" "}
            or read our detailed{" "}
            <Link href="/how-it-works" className="font-black text-cyan-600 underline">
              How It Works
            </Link>{" "}
            and{" "}
            <Link href="/support" className="font-black text-cyan-600 underline">
              Support
            </Link>{" "}
            guides.
          </p>
        </section>
      </section>
    </main>
  );
}

/** Tiny slugifier for in-page anchor IDs. */
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
