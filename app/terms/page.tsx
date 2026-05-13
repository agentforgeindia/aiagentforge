"use client";

import { useTheme } from "@/app/components/ThemeProvider";

const termsSections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using AgentForge, you agree to comply with these Terms & Conditions and all applicable laws and regulations.",
  },
  {
    title: "2. Use of Services",
    body: "AgentForge provides AI-powered visual generation services for textile, jewellery, productography, and related creative workflows. Users agree to use the platform responsibly and lawfully.",
  },
  {
    title: "3. User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and all activities performed under your account.",
  },
  {
    title: "4. Uploaded Content",
    body: "You retain ownership of uploaded designs, images, and generated outputs. You must have the legal rights to upload any content used on the platform.",
  },
  {
    title: "5. Prohibited Activities",
    body: "Users may not misuse the platform, attempt unauthorized access, upload illegal or harmful content, abuse AI systems, or violate intellectual property rights.",
  },
  {
    title: "6. AI Generated Outputs",
    body: "AI-generated results may vary depending on uploaded images, prompts, and model behavior. AgentForge does not guarantee exact outcomes or commercial success from generated visuals.",
  },
  {
    title: "7. Payments & Credits",
    body: "Subscription fees and credits are billed according to selected plans. Credits used for AI generations are generally non-refundable except in verified technical failure cases.",
  },
  {
    title: "8. Service Availability",
    body: "We may update, modify, suspend, or discontinue parts of the platform at any time without prior notice.",
  },
  {
    title: "9. Limitation of Liability",
    body: "AgentForge shall not be held liable for indirect damages, data loss, business interruption, output inaccuracies, or losses resulting from the use of AI-generated content.",
  },
  {
    title: "10. Intellectual Property",
    body: "The AgentForge brand, platform design, software, workflows, and system architecture remain the intellectual property of AgentForge unless otherwise stated.",
  },
  {
    title: "11. Privacy",
    body: "Use of the platform is also governed by our Privacy Policy, which explains how your information is collected and protected.",
  },
  {
    title: "12. Changes to Terms",
    body: "We may revise these Terms & Conditions from time to time. Updated versions will be posted on this page.",
  },
  {
    title: "13. Contact Us",
    body: "For legal questions, platform concerns, or support requests, contact us at help@aiagentforge.in.",
  },
];

export default function TermsPage() {
  const { darkMode } = useTheme();

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-black/10";

  const muted = darkMode ? "text-white/65" : "text-black/60";

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee40,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf640,transparent_32%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.04))]" />

      <div
        className={`pointer-events-none fixed inset-0 ${
          darkMode ? "opacity-[0.06]" : "opacity-[0.13]"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
        <div
          className={`mb-8 rounded-[2.2rem] border p-7 shadow-2xl backdrop-blur-xl md:p-10 ${card}`}
        >
          <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
            AgentForge Legal
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Terms & Conditions
          </h1>

          <p
            className={`mt-5 max-w-3xl text-base leading-8 md:text-lg ${muted}`}
          >
            These Terms & Conditions govern your use of the AgentForge platform,
            services, AI tools, subscriptions, and generated outputs.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-5">
            <p className="text-sm font-black text-cyan-600">Effective Date</p>
            <p className={`mt-1 text-sm ${muted}`}>Updated: May 2026</p>
          </div>
        </div>

        <div className="space-y-5">
          {termsSections.map((item) => (
            <section
              key={item.title}
              className={`rounded-[1.7rem] border p-6 shadow-xl backdrop-blur-xl md:p-7 ${card}`}
            >
              <h2 className="text-xl font-black md:text-2xl">
                {item.title}
              </h2>

              <p className={`mt-3 leading-8 ${muted}`}>{item.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-[1.7rem] border border-cyan-400/25 bg-cyan-400/10 p-6 text-center md:p-8">
          <h2 className="text-2xl font-black">Need legal or account help?</h2>

          <p className={`mx-auto mt-3 max-w-2xl leading-8 ${muted}`}>
            For legal questions, support, or account concerns, contact us at{" "}
            <a
              className="font-black text-cyan-600 underline"
              href="mailto:help@aiagentforge.in"
            >
              help@aiagentforge.in
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}
