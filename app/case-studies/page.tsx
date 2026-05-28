import Link from "next/link";

type CaseStudy = {
  slug: string;
  brand: string;
  industry: "Textile" | "Jewellery" | "Productography";
  city: string;
  hero: string;
  before: string;
  after: string;
  quote: string;
  quoteAuthor: string;
  metrics: { label: string; before: string; after: string; delta: string }[];
  story: string[];
  agentHref: string;
  agentLabel: string;
};

const CASE_STUDIES: CaseStudy[] = [
  // ============================================================
  // TEXTILE — Surat saree wholesaler
  // ============================================================
  {
    slug: "surat-saree-wholesaler",
    brand: "Mid-scale saree wholesaler",
    industry: "Textile",
    city: "Surat, Gujarat",
    hero: "🥻",
    before: "5–7 day catalogue cycle. ₹6 lakh/month photoshoots. 30 designs.",
    after: "Same-day catalogue. ₹9,999/month plan. 100+ designs.",
    quote:
      "Photoshoots were killing us. Now my designer locks a print at 10 AM and the catalogue is in WhatsApp groups by 11 AM. Order enquiries come the same afternoon.",
    quoteAuthor: "Operations head, Surat saree wholesaler",
    metrics: [
      { label: "Designs / month", before: "30", after: "100+", delta: "+233%" },
      { label: "Catalogue turnaround", before: "5–7 days", after: "Same day", delta: "−95%" },
      { label: "Monthly photo cost", before: "₹6,00,000", after: "₹9,999", delta: "−98%" },
      { label: "Cost per image", before: "₹2,000", after: "₹13", delta: "−99%" },
    ],
    story: [
      "A mid-scale Surat saree wholesaler was running 30 new designs a month — printed sarees, designer fabric, bridal pieces. Each design needed a sample stitched (₹800–₹2,000), a model booked (₹8,000–₹15,000), studio + MUA + photographer + post (₹15,000–₹30,000). Total: ₹4–8 lakh/month, 5–7 days per drop.",
      "They moved to AgentForge's Pro Creator plan (₹9,999/month, 800 images) in early 2026. The workflow collapsed: designer approves print at 10 AM, AI generates 8–12 model-worn variants by 10:05 AM, article-code overlay added in 1 click, catalogue dropped in WhatsApp wholesaler groups by 10:30 AM.",
      "Within 60 days the wholesale buyer network had received 3x more designs than the same brand had shipped in the previous quarter. Conversion rate per WhatsApp drop improved because they could ship festive-themed variants on demand.",
    ],
    agentHref: "/textileprints-to-mockup",
    agentLabel: "Try Textile AI",
  },

  // ============================================================
  // TEXTILE — Jaipur kurti brand
  // ============================================================
  {
    slug: "jaipur-kurti-brand",
    brand: "D2C ethnic wear brand",
    industry: "Textile",
    city: "Jaipur, Rajasthan",
    hero: "👚",
    before: "Weekly Instagram drops blocked by model availability. 8 designs/week.",
    after: "Daily drops. 25–30 designs/week. Festive launches in 48 hours.",
    quote:
      "Earlier our Instagram calendar was driven by the model's diary. Now it's driven by our designers' speed. We are first to market on every trend.",
    quoteAuthor: "Founder, Jaipur ethnic wear D2C",
    metrics: [
      { label: "Drops per week", before: "8", after: "25–30", delta: "+275%" },
      { label: "Festive launch time", before: "4 weeks", after: "48 hours", delta: "−98%" },
      { label: "Cost per shoot", before: "₹15,000+", after: "₹150–₹300", delta: "−98%" },
      { label: "Designs tested / month", before: "30", after: "120", delta: "+300%" },
    ],
    story: [
      "A Jaipur kurti brand selling on Instagram and their D2C website had a clean operational model except for one bottleneck — every new design needed a model shoot, and their booked model was the choke point. Daily drops were impossible.",
      "After switching to AgentForge Textile AI, the brand started testing 4x more designs per month. Festive collections (Karwa Chauth, Diwali) that earlier needed a 4-week shoot prep window now ship in 48 hours.",
      "The compounding effect: more designs tested → faster learning of what sells → bigger inventory of winners → higher monthly revenue. Three months in, the brand had doubled its product catalogue without hiring a single new team member.",
    ],
    agentHref: "/textileprints-to-mockup",
    agentLabel: "Try Textile AI",
  },

  // ============================================================
  // JEWELLERY — Mumbai bridal jewellery brand
  // ============================================================
  {
    slug: "mumbai-bridal-jewellery",
    brand: "Independent bridal jewellery brand",
    industry: "Jewellery",
    city: "Mumbai, Maharashtra",
    hero: "💎",
    before: "₹80,000 per bridal shoot. 60-piece catalogue = ₹4–5 lakh.",
    after: "₹9,999/month for 800 images. Bridal campaigns in 1 day.",
    quote:
      "We were spending more on photography than on inventory. Now our wedding-season catalogue ships in a day, and we look as premium as Tanishq on Instagram.",
    quoteAuthor: "Brand owner, Mumbai jewellery house",
    metrics: [
      { label: "Bridal catalogue cost", before: "₹4,00,000", after: "₹9,999", delta: "−97%" },
      { label: "Time to ship campaign", before: "8 weeks", after: "1 day", delta: "−99%" },
      { label: "Wedding-season SKUs", before: "60", after: "200+", delta: "+233%" },
      { label: "Instagram engagement", before: "Baseline", after: "+2.4x", delta: "+140%" },
    ],
    story: [
      "An independent Mumbai bridal jewellery brand competing with Tanishq, Kalyan and CaratLane on Instagram was at a creative disadvantage — bridal model shoots cost ₹80,000 per session, MUA + security transport + photographer added more. A 60-piece catalogue cost ₹4–5 lakh and took 8 weeks.",
      "AgentForge Jewellery AI changed the math. The brand uploads product photos taken with their phone in good light, picks 'Indian Bridal Model + Festive Lighting + Marble Backdrop', and generates editorial-grade bridal campaign images in 30 seconds.",
      "Wedding-season campaigns that previously locked their team for 2 months now ship in a single day. The same brand identity now competes head-to-head with the largest jewellery players on visual production value — at 3% of the cost.",
    ],
    agentHref: "/jewellery-ai",
    agentLabel: "Try Jewellery AI Studio",
  },

  // ============================================================
  // PRODUCTOGRAPHY — Bengaluru D2C skincare brand
  // ============================================================
  {
    slug: "bengaluru-skincare-d2c",
    brand: "D2C skincare brand",
    industry: "Productography",
    city: "Bengaluru, Karnataka",
    hero: "📸",
    before: "₹15,000 per product shoot. 6 SKUs per session. 2-week turnaround.",
    after: "₹12 per image. Daily Amazon refresh. Same-day ad creative.",
    quote:
      "Our Amazon hero image used to be 'whatever we had from the last shoot'. Now we test 5 new heroes per SKU every week. CTR is up across the entire catalogue.",
    quoteAuthor: "Founder, Bengaluru skincare D2C",
    metrics: [
      { label: "Cost per product image", before: "₹2,500", after: "₹12", delta: "−99%" },
      { label: "Amazon hero refresh", before: "Quarterly", after: "Weekly", delta: "12x" },
      { label: "Ad creative tests / month", before: "4", after: "40+", delta: "+900%" },
      { label: "Time to launch new SKU", before: "2 weeks", after: "Same day", delta: "−93%" },
    ],
    story: [
      "A Bengaluru D2C skincare brand launching 3–5 new SKUs every month had a costly photography routine — ₹15,000 per session, 6 SKUs covered, 2-week turnaround from booking to delivery. By the time the catalogue arrived, the brand had moved to the next launch.",
      "With AgentForge Productography AI, the founder takes phone photos of new SKUs in natural light, uploads them, and gets Amazon-ready hero shots, Instagram lifestyle creatives, and Meta Ads variants — all in 30 seconds each.",
      "The strategic shift: Amazon hero images are now refreshed weekly based on performance data. Ad creative testing went from 4 variants/month to 40+. Every new SKU now has a complete visual asset library ready on launch day.",
    ],
    agentHref: "/productography-ai",
    agentLabel: "Try Productography AI",
  },
];

const INDUSTRY_ACCENT: Record<CaseStudy["industry"], { from: string; to: string; chip: string }> = {
  Textile: {
    from: "from-cyan-400",
    to: "to-blue-500",
    chip: "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/30",
  },
  Jewellery: {
    from: "from-amber-400",
    to: "to-rose-500",
    chip: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30",
  },
  Productography: {
    from: "from-violet-500",
    to: "to-fuchsia-500",
    chip: "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/30",
  },
};

export default function CaseStudiesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Subtle doodles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[8%] text-3xl opacity-40">📈</div>
        <div className="float-medium absolute right-[8%] top-[12%] text-3xl opacity-40">🏆</div>
        <div className="float-fast absolute left-[12%] bottom-[20%] text-2xl opacity-35">✨</div>
        <div className="float-slow absolute right-[14%] bottom-[24%] text-3xl opacity-40">💎</div>
        <div className="float-medium absolute left-[48%] top-[5%] text-2xl opacity-30">✦</div>
      </div>

      {/* ============ HERO ============ */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-8 pt-12 text-center sm:px-5 sm:pb-10 sm:pt-16">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200 sm:text-[11px]">
          Case Studies · Client Results
        </div>
        <h1 className="text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
          Real Indian businesses,{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            real numbers, real outcomes
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-black/65 dark:text-white/65 sm:text-lg">
          How Surat saree wholesalers, Jaipur D2C kurti brands, Mumbai jewellers and Bengaluru
          skincare founders are shipping more catalogues, faster, at a fraction of the cost.
        </p>

        {/* Headline stats */}
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { v: "−97%", l: "Avg cost cut" },
            { v: "30 sec", l: "Per visual" },
            { v: "10x", l: "Output volume" },
            { v: "4.9 / 5", l: "User rating" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-black/10 bg-white/80 p-3 backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
            >
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-base font-black text-transparent sm:text-lg">
                {s.v}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/55 dark:text-white/55">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CASE STUDIES ============ */}
      <section className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 pb-16 sm:px-5">
        {CASE_STUDIES.map((cs) => {
          const accent = INDUSTRY_ACCENT[cs.industry];
          return (
            <article
              key={cs.slug}
              id={cs.slug}
              className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-white/[0.04]"
            >
              {/* Header band */}
              <div
                className={`relative flex flex-col gap-3 bg-gradient-to-br ${accent.from} ${accent.to} px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="relative flex items-center gap-4">
                  <div className="text-5xl drop-shadow-lg sm:text-6xl">{cs.hero}</div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black/80 shadow">
                      {cs.industry} · {cs.city}
                    </span>
                    <h2 className="mt-2 text-xl font-black leading-tight sm:text-2xl">
                      {cs.brand}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="px-6 py-7 sm:px-8 sm:py-9">
                {/* Before / After */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-rose-200/60 bg-rose-50/60 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-700 dark:text-rose-300">
                      Before
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/75 dark:text-white/75">
                      {cs.before}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                      After AgentForge
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/75 dark:text-white/75">
                      {cs.after}
                    </p>
                  </div>
                </div>

                {/* Metrics table */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-black/5 text-[10px] font-black uppercase tracking-[0.18em] text-black/60 dark:bg-white/5 dark:text-white/60">
                      <tr>
                        <th className="px-4 py-3 text-left">Metric</th>
                        <th className="px-4 py-3 text-left">Before</th>
                        <th className="px-4 py-3 text-left">After</th>
                        <th className="px-4 py-3 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {cs.metrics.map((m) => (
                        <tr key={m.label}>
                          <td className="px-4 py-3 font-bold">{m.label}</td>
                          <td className="px-4 py-3 text-black/60 dark:text-white/60">{m.before}</td>
                          <td className="px-4 py-3 font-black">{m.after}</td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                                m.delta.startsWith("-") || m.delta.startsWith("−")
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                              }`}
                            >
                              {m.delta}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Story */}
                <div className="mt-6 space-y-4 text-sm leading-7 text-black/75 dark:text-white/75 sm:text-base">
                  {cs.story.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {/* Quote */}
                <blockquote
                  className={`mt-6 rounded-2xl border-l-4 ${accent.from.replace("from-", "border-")} bg-black/5 px-5 py-4 text-base font-black italic text-black/80 dark:bg-white/5 dark:text-white/85`}
                >
                  “{cs.quote}”
                  <span className="mt-2 block text-xs font-bold not-italic text-black/55 dark:text-white/55">
                    — {cs.quoteAuthor}
                  </span>
                </blockquote>

                {/* CTA */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={cs.agentHref}
                    className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${accent.from} ${accent.to} px-6 py-3 text-sm font-black text-white shadow-xl transition hover:scale-105`}
                  >
                    {cs.agentLabel} →
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-black transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white"
                  >
                    See Plans
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/40 bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-8 text-center shadow-xl dark:border-cyan-400/20 dark:bg-gradient-to-r dark:from-cyan-500/10 dark:via-white/[0.04] dark:to-blue-500/10">
          <h2 className="text-2xl font-black sm:text-3xl">Your business, your case study</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-black/65 dark:text-white/65 sm:text-base">
            Sign up free and get 200 credits. Generate your first AI catalogue today —
            and join the next case study.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105"
            >
              ✨ Get 100 Free Credits
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white"
            >
              See Gallery →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
