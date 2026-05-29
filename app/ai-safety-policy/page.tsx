import type { Metadata } from "next";
import Link from "next/link";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "AI Safety Policy — AgentForge AI",
  description:
    "What content AgentForge AI blocks, our safety guardrails, user responsibilities, reporting flow, and consequences for misuse. Built for responsible AI use in India.",
  keywords: [
    "AgentForge AI safety policy",
    "AI content moderation India",
    "AI safety guardrails",
    "AI ethics India",
    "responsible AI use",
  ],
  alternates: { canonical: `${SITE}/ai-safety-policy` },
  openGraph: {
    title: "AI Safety Policy — AgentForge AI",
    description:
      "What we block, why, and how to report misuse. Our public commitment to responsible AI.",
    url: `${SITE}/ai-safety-policy`,
    type: "website",
  },
};

const BLOCK_LIST = [
  {
    title: "Nudity, sexual or adult content",
    body: "We block generation of nude, semi-nude, sexualised or adult-themed content. Any prompt or image that attempts to bypass this guardrail is rejected and may trigger an account review.",
  },
  {
    title: "Minors in unsafe scenarios",
    body: "We do not permit generations that depict minors in mature, sexualised, dangerous, or otherwise unsafe contexts. Kidswear product mockups are fully supported in family-safe settings — that is a different category.",
  },
  {
    title: "Celebrities, public figures and politicians",
    body: "We do not allow impersonation of named celebrities, public figures or political leaders. The AI flags both prompts (\"in the style of [name]\") and uploaded portrait images of recognisable figures.",
  },
  {
    title: "Deepfake or non-consensual identity use",
    body: "Uploading someone's face/identity without their consent is strictly prohibited. UGC Forge requires confirmation that you have the creator's permission before generation begins.",
  },
  {
    title: "Hate, harassment, violence and weapons",
    body: "Content that promotes hatred against a community, harasses individuals, glorifies violence, or depicts weapons in harmful contexts is blocked.",
  },
  {
    title: "Illegal goods or activities",
    body: "Mockups for illegal substances, counterfeit goods, fake brand impersonation (\"make this look like the real Nike logo\"), or fraudulent product claims are not supported.",
  },
  {
    title: "Misinformation or impersonation of real entities",
    body: "We don't generate visuals that misrepresent real news events, fake government communications, or impersonate trusted institutions.",
  },
];

const GUARDRAILS = [
  {
    title: "Prompt-level filtering",
    body: "Every prompt is screened by an upstream safety classifier before it reaches the generation model. Unsafe instructions never enter the pipeline.",
  },
  {
    title: "Image-level checks",
    body: "Uploaded images are scanned for nudity, minor faces in unsafe contexts, and known public-figure faces. Matches are blocked at upload, not after generation.",
  },
  {
    title: "Post-generation moderation",
    body: "Outputs go through a final NSFW + identity check. If the model produces unsafe content despite the upstream filters, it's blocked from being shown or downloaded.",
  },
  {
    title: "Human review for flagged content",
    body: "Flagged generations are queued for human review. Confirmed violations result in credit forfeit, account warning, and — for repeated cases — account suspension.",
  },
];

const RESPONSIBILITIES = [
  "You must have legal rights to every image you upload — product photos, designs, brand assets, and creator references.",
  "You must not attempt to bypass safety filters via obfuscated prompts, image steganography, or coordinated abuse.",
  "You agree not to use AgentForge outputs to mislead consumers, impersonate brands you don't own, or violate consumer protection law.",
  "If you operate AgentForge on behalf of clients, you are responsible for ensuring their use complies with this policy.",
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    {
      "@type": "ListItem",
      position: 2,
      name: "AI Safety Policy",
      item: `${SITE}/ai-safety-policy`,
    },
  ],
};

export default function AISafetyPolicyPage() {
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
            AI Safety
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            AI Safety Policy
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-black/60 dark:text-white/65 md:text-lg">
            AgentForge is built for responsible commercial use — product
            photography, fashion mockups and catalogue creation. This page
            explains what content we block, what guardrails sit between you and
            the model, your responsibilities as a user, and how to report
            misuse.
          </p>
          <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5">
            <p className="text-sm font-black text-rose-700 dark:text-rose-300">
              Last updated
            </p>
            <p className="mt-1 text-sm text-black/65 dark:text-white/65">
              May 2026 · This policy may evolve as we add new agents and
              capabilities.
            </p>
          </div>
        </div>

        {/* What we block */}
        <h2 className="mb-5 text-2xl font-black md:text-3xl">
          What AgentForge blocks
        </h2>
        <div className="space-y-3">
          {BLOCK_LIST.map((b) => (
            <section
              key={b.title}
              className="rounded-[1.5rem] border border-rose-300/30 bg-rose-50/40 p-6 dark:border-rose-400/20 dark:bg-rose-500/10"
            >
              <h3 className="flex items-start gap-2 text-base font-black md:text-lg">
                <span className="mt-0.5 text-rose-500">✕</span>
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
                {b.body}
              </p>
            </section>
          ))}
        </div>

        {/* Guardrails */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Our guardrails
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {GUARDRAILS.map((g) => (
            <div
              key={g.title}
              className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-50/40 p-5 dark:border-emerald-400/20 dark:bg-emerald-500/10"
            >
              <h3 className="flex items-start gap-2 text-base font-black">
                <span className="mt-0.5 text-emerald-500">🛡️</span>
                {g.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
                {g.body}
              </p>
            </div>
          ))}
        </div>

        {/* User responsibilities */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Your responsibilities as a user
        </h2>
        <div className="rounded-[1.7rem] border border-black/10 bg-white/85 p-6 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05] md:p-7">
          <ul className="space-y-3">
            {RESPONSIBILITIES.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-sm leading-7 text-black/70 dark:text-white/75 md:text-base md:leading-8"
              >
                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consequences */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Consequences of misuse
        </h2>
        <div className="space-y-3">
          <section className="rounded-[1.5rem] border border-black/10 bg-white/85 p-6 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
            <h3 className="text-base font-black md:text-lg">First offence</h3>
            <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
              Generation blocked. Credits used in the attempt are forfeit. Email
              warning sent to the account holder.
            </p>
          </section>
          <section className="rounded-[1.5rem] border border-black/10 bg-white/85 p-6 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
            <h3 className="text-base font-black md:text-lg">Repeated abuse</h3>
            <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
              Account suspended pending review. In severe cases (CSAM,
              identity-fraud rings, hate campaigns), we cooperate with Indian
              law enforcement and report under applicable provisions of the IT
              Act 2000 and DPDP Act 2023.
            </p>
          </section>
        </div>

        {/* Reporting */}
        <section className="mt-12 rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-7 shadow-xl backdrop-blur-xl md:p-9">
          <h2 className="text-2xl font-black md:text-3xl">Report misuse</h2>
          <p className="mt-3 leading-8 text-black/70 dark:text-white/75">
            If you encounter content generated on AgentForge that violates this
            policy — or believe your likeness has been used without consent —
            email{" "}
            <a
              href="mailto:info@aiagentforge.in"
              className="font-black text-cyan-600 underline"
            >
              info@aiagentforge.in
            </a>{" "}
            with as much detail as you can share (URL, screenshot, generation
            ID if visible). We acknowledge reports within 72 hours.
          </p>
          <p className="mt-3 leading-8 text-black/70 dark:text-white/75">
            For broader privacy and data-rights questions, see our{" "}
            <Link
              href="/data-protection"
              className="font-black text-cyan-600 underline"
            >
              Data Protection
            </Link>{" "}
            page.
          </p>
        </section>
      </section>
    </main>
  );
}
