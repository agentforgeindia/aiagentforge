"use client";

import Link from "next/link";
import { useTheme } from "@/app/components/ThemeProvider";

type Plan = {
  name: string;
  audience: string;
  price: string;
  credits: string;
  bestFor: string;
  popular?: boolean;
  features: string[];
};


const plans: Plan[] = [
  {
    name: "Starter",
    audience: "For Small Sellers",
    price: "₹1,999",
    credits: "100 images/month",
    bestFor: "Small shops, creators, and local retailers",
    features: [
      "AI mockups from your product or design images",
      "Ready-to-use images for Instagram and WhatsApp",
      "Premium photoshoot-style visuals",
      "Code or article number on output image",
      "1080×1080 high-quality export",
      "Save up to 90% on photoshoot cost",
    ],
  },
  {
    name: "Growth",
    audience: "For Agents & Growing Brands",
    price: "₹17,999",
    credits: "1000 images/month",
    bestFor: "Agents, resellers, wholesalers, and online sellers",
    popular: true,
    features: [
      "1000 AI-generated premium visuals",
      "Multiple styles and pose variations",
      "Catalogue-ready professional images",
      "No watermark output",
      "Code or article number on every image",
      "Faster processing",
      "Premium presentation for client sharing",
    ],
  },
  {
    name: "Scale",
    audience: "For Teams & Businesses",
    price: "₹49,999",
    credits: "3000 images/month",
    bestFor: "Factories, brands, agencies, and large production teams",
    features: [
      "Bulk AI image generation",
      "Priority processing for high-volume work",
      "Consistent branding and visual style",
      "Code or article number on every output",
      "Market-ready catalogue visuals",
      "Dedicated support",
      "Best cost per image for bulk users",
    ],
  },
];

export default function PricingPage() {
  const { darkMode } = useTheme();

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />

      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 py-14 text-center">
          <h2 className="mx-auto max-w-5xl text-5xl font-black leading-tight md:text-7xl">
            One Pricing for
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Every AI Visual Agent
            </span>
          </h2>

          <p className={`mx-auto mt-6 max-w-3xl text-lg leading-8 ${muted}`}>
            Textile mockups, jewellery visuals, and product photography — one simple credit-based pricing system.
            Choose your monthly image volume and start creating premium business visuals.
          </p>

          <div className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 p-5 backdrop-blur-xl">
            <h3 className="text-2xl font-black">Start After Login</h3>
            <p className={`mt-2 ${muted}`}>Login ke baad trial credits activate honge. Pricing simple monthly image volume par based hai.</p>
            <Link href="/login" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 font-black text-white shadow-xl shadow-cyan-500/25">
              Login to Start
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 ${card} ${
                  plan.popular ? "border-cyan-400 xl:scale-105 z-10" : ""
                }`}
              >

                <div className="mb-5 flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm font-semibold text-cyan-600">{plan.audience}</p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight">{plan.name}</h3>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-base font-black text-white shadow-lg shadow-cyan-500/20">
                    AF
                  </div>

                </div>

                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                                  <div className="flex items-end gap-2">
                    <p className="text-5xl font-black tracking-tight">{plan.price}</p>
                    <p className={`pb-2 text-sm ${muted}`}>/ month</p>
                  </div>
                  <p className="mt-4 rounded-full bg-white px-4 py-2 text-center text-sm font-black text-black">
                    {plan.credits}
                  </p>
                </div>

                <div className="mt-6 flex-1">
                  
                  <h4 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
                  
                    What you will get
                  </h4>

                  <div className={`space-y-3 text-sm leading-6 ${muted}`}>
                    {plan.features.map((feature) => (
                      <p key={feature} className="flex gap-3">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-black text-cyan-600">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <p className="text-sm font-black">Best for:</p>
                  <p className={`mt-1 text-sm leading-6 ${muted}`}>{plan.bestFor}</p>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full rounded-2xl py-4 font-black shadow-xl transition active:scale-[0.98] ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-cyan-500/25"
                      : darkMode
                      ? "bg-white text-black"
                      : "bg-black text-white"
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className={`rounded-[2rem] border p-8 text-center backdrop-blur-xl ${card}`}>
            <h3 className="mx-auto max-w-4xl text-3xl font-black leading-tight md:text-4xl">
              One traditional shoot can cost ₹5,000–₹15,000.
            </h3>
            <p className={`mx-auto mt-4 max-w-3xl text-lg leading-8 ${muted}`}>
              With AgentForge, you can create hundreds of premium AI visuals for textile, jewellery, and products at a fraction of the cost.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/login" className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-cyan-500/25">
                Login to Start
              </Link>

              <Link href="/" className={`rounded-full px-8 py-4 font-black ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}>
                Back to Home
              </Link>
            </div>
          </div>
        </section>

      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xl font-black text-white shadow-2xl shadow-cyan-500/40 transition hover:scale-105"
        aria-label="Open AI Chatbot"
      >
        AI
      </button>
    </main>
  );
}