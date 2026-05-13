"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export default function PrivacyPolicyPage() {
  const { darkMode } = useTheme();

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-black/10";
  const muted = darkMode ? "text-white/65" : "text-black/60";

  const policyItems = [
    {
      title: "1. Information We Collect",
      body: "We may collect your name, email address, login details, device information, browser type, IP address, pages visited, uploaded images, textile designs, product photos, jewellery photos, and AI-generated outputs. We do not claim ownership of your uploaded content.",
    },
    {
      title: "2. How We Use Your Information",
      body: "We use your information to provide AgentForge services, generate AI visuals, manage accounts, process payments, improve platform performance, provide support, and send important service updates.",
    },
    {
      title: "3. Uploaded Images & Generated Outputs",
      body: "You retain ownership of your uploaded images, designs, and generated outputs. We do not publicly display, sell, or redistribute your private uploads without your permission.",
    },
    {
      title: "4. Data Storage & Security",
      body: "Your data is stored using trusted cloud infrastructure. We use secure authentication and encrypted connections where applicable. No online system can be guaranteed 100% secure, but we take reasonable steps to protect your information.",
    },
    {
      title: "5. Sharing of Information",
      body: "We do not sell your personal data. We may share required information with trusted service providers such as payment gateways, hosting providers, storage providers, AI generation APIs, analytics tools, and support tools only when needed to operate the platform.",
    },
    {
      title: "6. Cookies & Tracking",
      body: "We may use cookies or similar technologies to remember sessions, improve user experience, understand usage patterns, and keep the platform secure. You can control cookies through your browser settings.",
    },
    {
      title: "7. Payments & Billing",
      body: "Payments may be processed by third-party payment providers. AgentForge does not store full card or banking details on its own servers. Payment providers process such information under their own privacy and security policies.",
    },
    {
      title: "8. Data Retention",
      body: "We retain data as long as your account is active or as needed for legal, security, operational, accounting, and support purposes. You may request deletion of your account data by contacting us.",
    },
    {
      title: "9. Children’s Privacy",
      body: "AgentForge is not intended for individuals under 18 years of age. We do not knowingly collect personal data from children.",
    },
    {
      title: "10. Changes to This Policy",
      body: "We may update this Privacy Policy from time to time. Any updates will be posted on this page with a revised effective date.",
    },
    {
      title: "11. Contact Us",
      body: "For privacy-related questions, account deletion requests, or data concerns, contact us at help@aiagentforge.in.",
    },
  ];

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee40,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf640,transparent_32%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.04))]" />
      <div
        className={`pointer-events-none fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.13]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
        <div className={`mb-8 rounded-[2.2rem] border p-7 shadow-2xl backdrop-blur-xl md:p-10 ${card}`}>
          <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
            AgentForge Legal
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Privacy Policy
          </h1>

          <p className={`mt-5 max-w-3xl text-base leading-8 md:text-lg ${muted}`}>
            This Privacy Policy explains how AgentForge collects, uses, stores, and protects your information when you use our AI visual generation platform.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-5">
            <p className="text-sm font-black text-cyan-600">Effective Date</p>
            <p className={`mt-1 text-sm ${muted}`}>Updated: May 2026</p>
          </div>
        </div>

        <div className="space-y-5">
          {policyItems.map((item) => (
            <section
              key={item.title}
              className={`rounded-[1.7rem] border p-6 shadow-xl backdrop-blur-xl md:p-7 ${card}`}
            >
              <h2 className="text-xl font-black md:text-2xl">{item.title}</h2>
              <p className={`mt-3 leading-8 ${muted}`}>{item.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-[1.7rem] border border-cyan-400/25 bg-cyan-400/10 p-6 text-center md:p-8">
          <h2 className="text-2xl font-black">Need help?</h2>
          <p className={`mx-auto mt-3 max-w-2xl leading-8 ${muted}`}>
            For privacy support, data deletion, or account-related questions, email us at{" "}
            <a className="font-black text-cyan-600 underline" href="mailto:help@aiagentforge.in">
              help@aiagentforge.in
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}
