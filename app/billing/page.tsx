"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";
import { supabase } from "@/lib/supabase";

export default function BillingPage() {
  const { darkMode } = useTheme();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const currentPlan = "Free Trial";

  const plans = [
    {
      name: "Starter",
      audience: "Small Shops & Creators",
      price: "₹1,999",
      unit: "/ month",
      credits: "2,400 Credits",
      popular: false,
      features: [
        "Up to 100+ standard generations",
        "15 credits per standard image",
        "All AgentForge AI agents access",
        "1080×1080 exports",
        "Watermark-free outputs",
        "Standard queue speed",
        "Basic support",
      ],
    },
    {
      name: "Pro Creator",
      audience: "Sellers, Agencies & Growing Brands",
      price: "₹9,999",
      unit: "/ month",
      credits: "16,000 Credits",
      popular: true,
      features: [
        "Up to 650+ standard generations",
        "Faster generation queue",
        "Premium styles included",
        "Mobile portrait / story outputs",
        "Variation regenerate support",
        "Priority support",
        "Best plan for regular production",
      ],
    },
    {
      name: "Empire",
      audience: "Factories, Wholesalers & Teams",
      price: "₹39,999",
      unit: "/ month",
      credits: "60,000 Credits",
      popular: false,
      features: [
        "Up to 2500+ standard generations",
        "Bulk upload mode",
        "Bulk generate at discounted credits",
        "Fastest queue priority",
        "Team workflow ready",
        "Dedicated business support",
        "Best for large monthly production",
      ],
    },
  ];

  const creditRules = [
    { label: "Standard Square 1080×1080", value: "15 Credits" },
    { label: "Mobile Portrait / Story", value: "17 Credits" },
    { label: "HD Premium Output", value: "20 Credits" },
    { label: "Ultra HD / Print Quality", value: "30 Credits" },
    { label: "Bulk Generate (Standard) — Empire Only", value: "15 Credits / image" },
    { label: "Bulk Ultra HD / Print Quality — Empire Only", value: "20 Credits / image" },
  ];

  const faqs = [
    {
      q: "When are credits deducted?",
      a: "Credits are reserved when generation starts, but they are deducted only after a successful output is created.",
    },
    {
      q: "What happens if a generation fails?",
      a: "If generation fails, reserved credits are automatically refunded back to the user balance.",
    },
    {
      q: "Why do some image types cost more credits?",
      a: "Higher quality outputs, print-ready images, and larger mobile portrait formats use more processing and therefore cost more credits.",
    },
    {
      q: "Does bulk generation reduce credit cost?",
      a: "Yes. Bulk generation is available only in the Empire plan and gives lower per-image credit usage for high-volume users.",
    },
    {
      q: "Do signup users get free credits?",
      a: "Yes. Every new signup gets 100 bonus credits to test AgentForge before upgrading.",
    },
    {
      q: "Can I buy extra credits separately?",
      a: "Yes. You can offer top-up credit packs in addition to monthly plans for users who need extra generations.",
    },
  ];

  useEffect(() => {
    async function loadCredits() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setCredits(profile.credits ?? 0);
          } else {
            setCredits(0);
          }
        } else {
          setCredits(0);
        }
      } catch (err) {
        console.error("Error loading credits:", err);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    }

    loadCredits();
  }, []);

  const bg = darkMode
    ? "bg-[#070b14] text-white"
    : "bg-[#fff8e8] text-[#111827]";

  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";

  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div
        className={`fixed inset-0 ${
          darkMode ? "opacity-[0.06]" : "opacity-[0.14]"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10">
        <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">
              Billing
            </div>
            <h2 className="text-4xl font-black md:text-5xl">
              Billing &amp; Credits
            </h2>
            <p className={`mt-3 ${muted}`}>
              Manage your credits, understand deduction rules, and upgrade your
              plan.
            </p>
          </div>

          <div className="mb-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-8 text-center backdrop-blur-xl">
              <p className={`text-sm font-bold uppercase tracking-widest ${muted}`}>
                Credit Balance
              </p>
              <p className="mt-3 text-6xl font-black text-cyan-500">
                🪙 {loading ? "..." : credits}
              </p>
              <p className={`mt-3 text-sm ${muted}`}>
                Standard square generation uses 20 credits
              </p>
            </div>

            <div
              className={`flex flex-col items-center justify-center rounded-[2rem] border p-8 text-center shadow-xl backdrop-blur-xl ${card}`}
            >
              <p className={`text-sm font-bold uppercase tracking-widest ${muted}`}>
                Current Plan
              </p>
              <p className="mt-3 text-3xl font-black">{currentPlan}</p>
              <p className={`mt-3 text-sm ${muted}`}>
                100 bonus credits on signup
              </p>
              <Link
                href="/pricing"
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105"
              >
                View All Plans
              </Link>
            </div>
          </div>

          <div className="mb-12 rounded-[2rem] border border-cyan-400/20 bg-cyan-400/5 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-5 text-center">
              <h3 className="text-3xl font-black">Credit Deduction Rules</h3>
              <p className={`mt-2 ${muted}`}>
                Different output types use different credits based on quality and
                size.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {creditRules.map((rule) => (
                <div
                  key={rule.label}
                  className={`rounded-[1.5rem] border p-5 shadow-lg ${card}`}
                >
                  <p className="text-sm font-semibold text-cyan-600">
                    {rule.label}
                  </p>
                  <p className="mt-3 text-2xl font-black">{rule.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 text-center">
            <h3 className="text-3xl font-black">Upgrade Your Plan</h3>
            <p className={`mt-2 ${muted}`}>
              Choose the plan that fits your creative volume.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card} ${
                  plan.popular ? "border-cyan-400" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-1 text-xs font-black text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm font-semibold text-cyan-600">
                    {plan.audience}
                  </p>
                  <h4 className="mt-2 text-2xl font-black">{plan.name}</h4>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className={`pb-1 text-sm ${muted}`}>{plan.unit}</span>
                  </div>
                  <p className="mt-2 rounded-full bg-white px-3 py-1.5 text-center text-xs font-black text-black">
                    {plan.credits}
                  </p>
                </div>

                <div className="mt-5 flex-1">
                  <div className={`space-y-2.5 text-sm ${muted}`}>
                    {plan.features.map((f) => (
                      <p key={f} className="flex gap-2">
                        <span className="mt-0.5 text-cyan-500">✓</span>
                        <span>{f}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full rounded-2xl py-3.5 font-black shadow-lg transition active:scale-[0.98] ${
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

          <div className="mt-14">
            <div className="mb-6 text-center">
              <h3 className="text-3xl font-black">Frequently Asked Questions</h3>
              <p className={`mt-2 ${muted}`}>
                Everything users need to know about billing and credits.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={faq.q}
                    className={`overflow-hidden rounded-[1.75rem] border shadow-xl backdrop-blur-xl ${card}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaq(isOpen ? null : index)
                      }
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="text-base font-black md:text-lg">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-cyan-500 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-80"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`px-6 pb-5 text-sm leading-7 ${muted}`}>
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}