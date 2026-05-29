import type { Metadata } from "next";
import Link from "next/link";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "Data Protection — AgentForge AI (DPDP Act 2023 compliant)",
  description:
    "How AgentForge protects your data — encryption, storage, retention, and your rights under India's Digital Personal Data Protection Act 2023. Grievance officer details.",
  keywords: [
    "AgentForge data protection",
    "DPDP Act compliance India",
    "AI data security India",
    "data principal rights India",
    "AgentForge grievance officer",
  ],
  alternates: { canonical: `${SITE}/data-protection` },
  openGraph: {
    title: "Data Protection — AgentForge AI",
    description:
      "DPDP Act-aligned data handling, encryption, retention and grievance redress.",
    url: `${SITE}/data-protection`,
    type: "website",
  },
};

const SECURITY = [
  {
    title: "Encryption in transit",
    body: "All connections to AgentForge are forced HTTPS (TLS 1.2 or higher). Uploads, generations and account API calls travel over TLS.",
  },
  {
    title: "Encryption at rest",
    body: "Uploaded images, generated outputs and account metadata are stored on Supabase Storage and Postgres, both encrypted at rest with AES-256.",
  },
  {
    title: "Row-level security (RLS)",
    body: "Every database table that holds user data has Postgres Row-Level Security policies enabled. A logged-in user can only see their own rows — never anyone else's.",
  },
  {
    title: "Atomic credit operations",
    body: "Credit deduction and refunds run through SECURITY DEFINER Postgres functions accessed only by our service role. Clients cannot tamper with credit balances directly.",
  },
  {
    title: "Authentication safeguards",
    body: "Sign-in uses Supabase Auth — bcrypt password hashes, JWT session tokens, OAuth via Google. Sessions are refreshed and revocable at any time.",
  },
  {
    title: "Webhook signature verification",
    body: "Payment webhooks (Razorpay) verify HMAC signatures before any credit grant is processed. Duplicate webhooks are blocked by a unique-payment-id constraint.",
  },
];

const DATA_TYPES = [
  {
    title: "Account data",
    body: "Email, optional full name, hashed password (Supabase Auth), profile photo URL if you sign in with Google. Phone number if you choose to add it.",
  },
  {
    title: "Generation data",
    body: "Uploaded source images, your prompts/settings, generated outputs, generation timestamps and status. Credits used and refunded.",
  },
  {
    title: "Payment data",
    body: "Razorpay order ID, payment ID, signature, plan name, amount. Card numbers and bank details are never seen by us — they're handled by Razorpay under their own security policies.",
  },
  {
    title: "Usage data",
    body: "Anonymous analytics (Google Analytics 4, Microsoft Clarity heatmaps, Meta Pixel) and server logs. No raw input data is sent to analytics — only event metadata.",
  },
];

const RETENTION = [
  {
    title: "Active accounts",
    body: "All data is retained while your account is active so your gallery, generations and billing history stay available.",
  },
  {
    title: "Account deletion",
    body: "When you delete your account (Profile → Settings → Delete Account), we permanently remove your profile, generations and uploaded images within 30 days. Some billing records may be retained for tax/legal purposes per Indian law (typically 7 years).",
  },
  {
    title: "Inactive accounts",
    body: "Accounts inactive for 24 months may be archived. We send an email warning 30 days before any archival action.",
  },
  {
    title: "Audit logs",
    body: "Credit transactions (deductions, refunds) are retained for as long as the account exists, for dispute resolution.",
  },
];

const DPDP_RIGHTS = [
  {
    title: "Right to information",
    body: "You can request a copy of all personal data we hold about you. Email info@aiagentforge.in with the subject \"DPDP Information Request\" — we respond within 30 days.",
  },
  {
    title: "Right to correction & erasure",
    body: "You can edit your profile data directly in-app or request correction/erasure for fields you can't edit yourself. Account-wide erasure is available via Profile → Settings → Delete Account.",
  },
  {
    title: "Right to grievance redressal",
    body: "Any data-related complaint can be filed with our Grievance Officer (details below). We acknowledge within 7 days and resolve within 30 days as required by the DPDP Act 2023.",
  },
  {
    title: "Right to withdraw consent",
    body: "You may withdraw consent for analytics tracking at any time using your browser's privacy controls. Service-essential data (account, generations) cannot be withdrawn without account deletion since they are required to operate the service.",
  },
  {
    title: "Right to nominate",
    body: "Under the DPDP Act, you may nominate a person to exercise your rights in the event of your death or incapacity. To register a nomination, email info@aiagentforge.in.",
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
      name: "Data Protection",
      item: `${SITE}/data-protection`,
    },
  ],
};

export default function DataProtectionPage() {
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
            Data Protection
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            How we protect your data
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-black/60 dark:text-white/65 md:text-lg">
            AgentForge handles uploaded images, prompts, generations and account
            data. This page details the technical security we apply, what data
            we retain (and for how long), and your rights under India's{" "}
            <span className="font-black">
              Digital Personal Data Protection Act 2023
            </span>
            .
          </p>
          <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5">
            <p className="text-sm font-black text-cyan-700 dark:text-cyan-300">
              DPDP Act 2023 — compliance status
            </p>
            <p className="mt-1 text-sm text-black/70 dark:text-white/75">
              Fully aligned: data principal rights, consent management,
              retention transparency, breach notification protocol and
              grievance officer disclosure are all implemented (see below).
            </p>
          </div>
        </div>

        {/* Security */}
        <h2 className="mb-5 text-2xl font-black md:text-3xl">
          Technical security
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {SECURITY.map((s) => (
            <div
              key={s.title}
              className="rounded-[1.5rem] border border-black/10 bg-white/85 p-5 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
            >
              <h3 className="flex items-start gap-2 text-base font-black">
                <span className="mt-0.5 text-cyan-500">🔒</span>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-black/65 dark:text-white/65">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Data we collect */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Data we collect
        </h2>
        <div className="space-y-3">
          {DATA_TYPES.map((d) => (
            <section
              key={d.title}
              className="rounded-[1.5rem] border border-black/10 bg-white/85 p-6 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
            >
              <h3 className="text-base font-black md:text-lg">{d.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/65 dark:text-white/65">
                {d.body}
              </p>
            </section>
          ))}
        </div>

        {/* Retention */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Retention &amp; deletion
        </h2>
        <div className="space-y-3">
          {RETENTION.map((r) => (
            <section
              key={r.title}
              className="rounded-[1.5rem] border border-black/10 bg-white/85 p-6 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
            >
              <h3 className="text-base font-black md:text-lg">{r.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/65 dark:text-white/65">
                {r.body}
              </p>
            </section>
          ))}
        </div>

        {/* DPDP Rights */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Your rights under the DPDP Act 2023
        </h2>
        <div className="space-y-3">
          {DPDP_RIGHTS.map((r) => (
            <section
              key={r.title}
              className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-50/40 p-6 dark:border-emerald-400/20 dark:bg-emerald-500/10"
            >
              <h3 className="flex items-start gap-2 text-base font-black md:text-lg">
                <span className="mt-0.5 text-emerald-500">✓</span>
                {r.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
                {r.body}
              </p>
            </section>
          ))}
        </div>

        {/* Breach notification */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Data breach notification
        </h2>
        <section className="rounded-[1.7rem] border border-amber-300/40 bg-amber-50/40 p-6 shadow-md backdrop-blur dark:border-amber-400/30 dark:bg-amber-500/10">
          <p className="text-sm leading-7 text-black/70 dark:text-white/75 md:text-base md:leading-8">
            In the event of a personal data breach that may pose a risk to data
            principals, AgentForge will notify the Data Protection Board of
            India and affected users within the timelines required by the DPDP
            Act 2023, with details of: the nature of the breach, the categories
            and approximate number of data principals affected, likely
            consequences, and mitigation actions taken.
          </p>
        </section>

        {/* Grievance Officer */}
        <h2 className="mt-12 mb-5 text-2xl font-black md:text-3xl">
          Grievance Officer
        </h2>
        <section className="rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-7 shadow-xl backdrop-blur-xl md:p-9">
          <p className="text-sm leading-8 text-black/70 dark:text-white/75 md:text-base">
            Per Section 8(10) of the DPDP Act 2023 and Rule 3(11) of the IT
            (Intermediary) Rules 2021, AgentForge has appointed a Grievance
            Officer:
          </p>
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2 md:text-base">
            <div className="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.06]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Name
              </p>
              <p className="mt-1 font-black">AgentForge Grievance Officer</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.06]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Email
              </p>
              <p className="mt-1 font-black">
                <a
                  href="mailto:info@aiagentforge.in"
                  className="text-cyan-600 underline"
                >
                  info@aiagentforge.in
                </a>
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.06]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Acknowledgement window
              </p>
              <p className="mt-1 font-black">Within 7 days of receipt</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.06]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Resolution window
              </p>
              <p className="mt-1 font-black">
                Within 30 days as required by DPDP
              </p>
            </div>
          </div>
          <p className="mt-5 text-xs text-black/55 dark:text-white/55">
            See also our{" "}
            <Link
              href="/privacy-policy"
              className="font-black text-cyan-600 underline"
            >
              Privacy Policy
            </Link>{" "}
            for the full collection-and-use disclosure.
          </p>
        </section>
      </section>
    </main>
  );
}
