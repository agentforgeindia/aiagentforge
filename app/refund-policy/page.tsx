"use client";

import { useTheme } from "@/app/components/ThemeProvider";

const refundSections = [
  {
    title: "1. General Policy",
    body: "All payments made on AgentForge are generally non-refundable. By purchasing any subscription, credits, or services, you agree to this Refund Policy.",
  },
  {
    title: "2. Credits Usage",
    body: "Once credits are used for AI generations, they cannot be refunded under normal circumstances.",
  },
  {
    title: "3. Unused Credits",
    body: "Unused credits are non-refundable but may remain available within your active subscription period.",
  },
  {
    title: "4. Subscription Plans",
    body: "Subscription fees are billed in advance and are non-refundable. You may cancel future renewals anytime, but refunds will not be issued for partially used periods.",
  },
  {
    title: "5. Failed Generations",
    body: "If an AI generation fails because of a technical issue on our side, credits may be restored or the request may be reprocessed after verification.",
  },
  {
    title: "6. Output Quality",
    body: "AI-generated results depend on uploaded inputs, prompts, and AI behavior. Differences in expectations or output style do not qualify for refunds after credits are consumed.",
  },
  {
    title: "7. Duplicate Payments",
    body: "If you are charged more than once accidentally, contact us within 48 hours for review and possible refund processing.",
  },
  {
    title: "8. Fraudulent Activity",
    body: "Accounts involved in fraudulent transactions, abuse, or unauthorized payment activity may be suspended while investigations are performed.",
  },
  {
    title: "9. Exceptional Cases",
    body: "Refunds may be considered only in exceptional situations after checking payment records, generation logs, technical issues, and account activity.",
  },
  {
    title: "10. Contact Us",
    body: "For refund-related questions or billing concerns, contact us at info@aiagentforge.in.",
  },
];

export default function RefundPolicyPage() {
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
            Refund Policy
          </h1>

          <p
            className={`mt-5 max-w-3xl text-base leading-8 md:text-lg ${muted}`}
          >
            This Refund Policy explains how payments, credits, subscriptions,
            and refund requests are handled on AgentForge.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-5">
            <p className="text-sm font-black text-cyan-600">Effective Date</p>
            <p className={`mt-1 text-sm ${muted}`}>Updated: May 2026</p>
          </div>
        </div>

        <div className="space-y-5">
          {refundSections.map((item) => (
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
          <h2 className="text-2xl font-black">Need billing support?</h2>

          <p className={`mx-auto mt-3 max-w-2xl leading-8 ${muted}`}>
            For refund requests, payment support, or billing questions, contact us at{" "}
            <a
              className="font-black text-cyan-600 underline"
              href="mailto:info@aiagentforge.in"
            >
              info@aiagentforge.in
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}
