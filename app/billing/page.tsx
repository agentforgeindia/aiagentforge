"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

const plans = [
  {
    name: "Launch",
    audience: "For Small Sellers",
    price: "₹20",
    unit: "per image",
    credits: "20 credits/image",
    popular: false,
    features: ["AI-powered premium visuals", "No watermark on output", "1080×1080 high-quality export", "Ready for Instagram and WhatsApp", "Save up to 90% on photoshoot cost"],
  },
  {
    name: "Pro Creator",
    audience: "For Agents & Growing Brands",
    price: "₹17",
    unit: "per image",
    credits: "17 credits/image",
    popular: true,
    features: ["Everything in Launch", "Multiple style variations", "Catalogue-ready professional images", "Faster processing priority", "Premium presentation for clients", "Branding ready output"],
  },
  {
    name: "Empire",
    audience: "For Teams & Businesses",
    price: "₹15",
    unit: "per image",
    credits: "15 credits/image",
    popular: false,
    features: ["Everything in Pro Creator", "Bulk AI image generation", "Priority processing queue", "Consistent branding style", "Dedicated support channel", "Best cost per image"],
  },
];

export default function BillingPage() {
  const { darkMode } = useTheme();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const currentPlan = "Free Trial";

  useEffect(() => {
    async function loadCredits() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", session.user.id)
            .single();
          
          if (profile) {
            setCredits(profile.credits ?? 0);
          }
        }
      } catch (err) {
        console.error("Error loading credits:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCredits();
  }, []);

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode ? "border-white/10 bg-white/[0.07] shadow-black/40" : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10">
        <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">Billing</div>
            <h2 className="text-4xl font-black md:text-5xl">Billing &amp; Credits</h2>
            <p className={`mt-3 ${muted}`}>Manage your credits and upgrade your plan.</p>
          </div>

          {/* Credit balance + current plan */}
          <div className="mb-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-8 text-center backdrop-blur-xl">
              <p className={`text-sm font-bold uppercase tracking-widest ${muted}`}>Credit Balance</p>
              <p className="mt-3 text-6xl font-black text-cyan-500">🪙 {credits}</p>
              <p className={`mt-3 text-sm ${muted}`}>17 credits used per generation</p>
            </div>
            <div className={`flex flex-col items-center justify-center rounded-[2rem] border p-8 text-center shadow-xl backdrop-blur-xl ${card}`}>
              <p className={`text-sm font-bold uppercase tracking-widest ${muted}`}>Current Plan</p>
              <p className="mt-3 text-3xl font-black">{currentPlan}</p>
              <p className={`mt-3 text-sm ${muted}`}>100 bonus credits on signup</p>
              <Link href="/pricing" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105">
                View All Plans
              </Link>
            </div>
          </div>

          {/* Upgrade plans */}
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-black">Upgrade Your Plan</h3>
            <p className={`mt-2 ${muted}`}>Choose the plan that fits your creative volume.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative flex flex-col rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card} ${plan.popular ? "border-cyan-400" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-1 text-xs font-black text-white shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-cyan-600">{plan.audience}</p>
                  <h4 className="mt-2 text-2xl font-black">{plan.name}</h4>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className={`pb-1 text-sm ${muted}`}>{plan.unit}</span>
                  </div>
                  <p className="mt-2 rounded-full bg-white px-3 py-1.5 text-center text-xs font-black text-black">{plan.credits}</p>
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
                <button type="button" className={`mt-6 w-full rounded-2xl py-3.5 font-black shadow-lg transition active:scale-[0.98] ${plan.popular ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-cyan-500/25" : darkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
