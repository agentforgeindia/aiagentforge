"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  Wallet,
  X as XIcon,
} from "lucide-react";
import TrustBadges from "@/app/components/TrustBadges";


declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Plan = {
  name: string;
  price: string;
  amount: number;
  desc: string;
  audience: string;
  credits: number;
  creditsLabel: string;
  images: string;
  badge: string;
  popular?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹1,999",
    amount: 1999,
    desc: "For small shops, creators and new sellers who want premium product visuals without costly shoots.",
    audience: "Small shops & creators",
    credits: 1800,
    creditsLabel: "1,800 Credits",
    images: "Up to 120 standard generations",
    badge: "Best to Start",
    popular: false,
    features: [
      "Access to all AgentForge AI agents",
      "15 credits per standard image",
      "1080×1080 HD square export",
      "Watermark-free business outputs",
      "Textile, jewellery & product visuals",
      "Company name, contact & website support",
      "Article code / design code placement",
      "Single model generation",
      "Standard generation queue",
      "Basic support",
    ],
  },
  {
    name: "Pro Creator",
    price: "₹9,999",
    amount: 9999,
    desc: "For sellers, agencies and growing brands creating daily catalog, WhatsApp and social media content.",
    audience: "Sellers, agencies & growing brands",
    credits: 12000,
    creditsLabel: "12,000 Credits",
    images: "Up to 800 standard generations",
    badge: "Most Popular",
    popular: true,
    features: [
      "Everything included in Starter",
      "Faster generation queue",
      "Premium shoot styles included",
      "Regenerate variations for better results",
      "Multiple model generation",
      "Mobile story & catalogue-ready outputs",
      "Custom branding on outputs",
      "Advanced article presentation",
      "Priority support",
    ],
  },
  {
    name: "Empire",
    price: "₹39,999",
    amount: 39999,
    desc: "For factories, wholesalers and bulk teams who need large-scale AI production for catalogues and client previews.",
    audience: "Factories, wholesalers & bulk teams",
    credits: 50000,
    creditsLabel: "50,000 Credits",
    images: "Up to 3,000+ standard generations",
    badge: "Bulk Studio",
    popular: false,
    features: [
      "Everything included in Pro Creator",
      "Bulk production workflow for factories",
      "High-volume catalogue generation",
      "Priority generation queue",
      "Dedicated setup guidance",
      "Team usage planning support",
      "Bulk branding & article code support",
      "Monthly production review",
      "Premium priority support",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const user = data.session?.user;
      setIsLoggedIn(Boolean(user));
      setUserEmail(user?.email ?? "");
      setUserId(user?.id ?? "");
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setIsLoggedIn(Boolean(user));
      setUserEmail(user?.email ?? "");
      setUserId(user?.id ?? "");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handlePayment = async (plan: Plan) => {
    try {
      setPaymentMessage("");

      if (!isLoggedIn || !userId) {
        window.location.href = "/login?redirect=/pricing";
        return;
      }

      if (!window.Razorpay) {
        setPaymentMessage("Payment system is still loading. Please try again in a few seconds.");
        return;
      }

      setLoadingPlan(plan.name);

      if (typeof window !== "undefined" && (window as any).fbq) {
  (window as any).fbq("track", "InitiateCheckout");
}

      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planName: plan.name,
          amount: plan.amount,
          credits: plan.credits,
          userId,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData?.order?.id) {
        throw new Error(orderData?.error || "Unable to create payment order.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderData.order.amount,
        currency: orderData.order.currency || "INR",
        name: "AgentForge",
        description: `${plan.name} Plan - ${plan.creditsLabel}`,
        order_id: orderData.order.id,
        prefill: {
          email: userEmail,
        },
        notes: {
          userId,
          planName: plan.name,
          credits: String(plan.credits),
        },
        theme: {
          color: "#2563eb",
        },
        handler: async function (response: any) {
          const verifyResponse = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...response,
              planName: plan.name,
              amount: plan.amount,
              credits: plan.credits,
              userId,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData?.success) {
            throw new Error(verifyData?.error || "Payment verification failed.");
          }
         setLoadingPlan(null);
router.push("/payment-success");
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
            setPaymentMessage("Payment cancelled. No amount was charged.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      setLoadingPlan(null);
      setPaymentMessage(error?.message || "Something went wrong while starting payment.");
    }
  };

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />

      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Floating Doodles — pricing themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">💎</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">💰</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">🪙</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">🚀</div>

        {/* Side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">💸</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">🎁</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🏆</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">📦</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">🛒</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">📈</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🔥</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">💎</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <div className="relative z-10">
        <section className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:px-5 sm:py-20 md:py-24">
          {/* Glow aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[420px] w-[720px] max-w-[95vw] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(34,211,238,0.28), rgba(59,130,246,0.12) 55%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          {/* Eyebrow */}
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur sm:text-[11px] dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
            Transparent Pricing · No Hidden Fees
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-4xl text-[28px] font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">One Simple Pricing</span>
            <span className="af-shimmer-text mt-3 block text-[22px] sm:text-4xl md:text-5xl">
              for Every AI Visual Agent
            </span>
          </h1>

          <p className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:mt-6 sm:text-base sm:leading-8 ${muted}`}>
            Textile mockups, jewellery shoots, product photography — ek hi
            credit system mein. Premium visuals, instant delivery, zero studio
            kharcha.
          </p>

          {/* Live info banner */}
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-700 sm:text-xs dark:text-cyan-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            Credits never expire · Top-up anytime · Cancel anytime
          </p>

          {/* Trust strip — savings focused */}
          <div className={`mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 rounded-2xl border px-3 py-3 text-center backdrop-blur sm:mt-10 sm:gap-4 sm:px-4 ${
            darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white/70"
          }`}>
            <div>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                Up to 95%
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Cost saved vs shoot
              </p>
            </div>
            <div className={`border-x ${darkMode ? "border-white/10" : "border-black/10"}`}>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                15 Credits
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Per premium visual
              </p>
            </div>
            <div>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                ~30 sec
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Per generation
              </p>
            </div>
          </div>

          {paymentMessage && (
            <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm font-bold text-cyan-600 backdrop-blur-xl">
              {paymentMessage}
            </div>
          )}

          {!isLoggedIn && (
            <div className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 p-5 backdrop-blur-xl">
              <h3 className="text-2xl font-black">Start After Login</h3>
              <p className={`mt-2 ${muted}`}>
                Trial credits activate after login. Pricing is based on simple monthly image volume.
              </p>
              <Link
                href="/login?redirect=/pricing"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 font-black text-white shadow-xl shadow-cyan-500/25"
              >
                Login to Start
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Inline keyframes */}
          <style>{`
            @keyframes afShimmerText {
              0%, 100% { background-position: 0% 50%; }
              50%      { background-position: 100% 50%; }
            }
            .af-shimmer-text {
              background-image: linear-gradient(90deg, #22d3ee, #06b6d4, #3b82f6, #6366f1, #3b82f6, #22d3ee);
              background-size: 240% 240%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              animation: afShimmerText 6s ease-in-out infinite;
            }
          `}</style>
        </section>

        {/* ───────── Trust Badges ───────── */}
        <section className="mx-auto max-w-7xl px-5 pb-8">
          <TrustBadges
            variant="grid"
            darkMode={darkMode}
            title="Why customers trust AgentForge"
          />
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[2rem] border p-4 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 sm:p-6 ${card} ${
                  plan.popular ? "z-10 border-cyan-400 xl:scale-105" : ""
                }`}
              >
                <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1.5 text-[10px] font-black text-white shadow-lg shadow-cyan-500/25 sm:right-5 sm:top-5 sm:px-4 sm:py-2 sm:text-xs">
                  {plan.badge}
                </div>

                <div className="mb-5 flex items-start justify-between gap-3 pr-20 sm:gap-4 sm:pr-24">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-cyan-600 sm:text-sm">{plan.audience}</p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight sm:mt-2 sm:text-3xl">{plan.name}</h3>
                    <p className={`mt-2 text-xs leading-5 sm:mt-3 sm:text-sm sm:leading-6 ${muted}`}>{plan.desc}</p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-inner sm:h-14 sm:w-14">
                    <img src="/logo-new.jpg" alt="AgentForge AI plan badge" width={56} height={56} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 sm:p-5">
                  <div className="flex flex-wrap items-end gap-2">
                    <p className="text-4xl font-black tracking-tight sm:text-5xl">{plan.price}</p>
                    <p className={`pb-1.5 text-sm sm:pb-2 ${muted}`}>/ month</p>
                  </div>
                  <p className="mt-4 rounded-full bg-white px-4 py-2 text-center text-sm font-black text-black">
                    {plan.creditsLabel}
                  </p>
                  <p className={`mt-3 text-center text-sm font-semibold ${muted}`}>{plan.images}</p>
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

                <button
                  type="button"
                  onClick={() => handlePayment(plan)}
                  disabled={loadingPlan === plan.name}
                  className={`mt-6 w-full rounded-2xl py-4 font-black shadow-xl transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-cyan-500/25"
                      : darkMode
                      ? "bg-white text-black"
                      : "bg-black text-white"
                  }`}
                >
                  {loadingPlan === plan.name ? "Starting Payment..." : isLoggedIn ? `Choose ${plan.name}` : "Login to Choose"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* AI vs Traditional Shoot — Cost Comparison */}
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:pb-16">
          <div className="mb-8 text-center sm:mb-10">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
              The Math
            </p>
            <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Why AgentForge costs less than one photoshoot
              </span>
            </h3>
            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-7 sm:text-base ${muted}`}>
              A single traditional product shoot costs ₹15,000 – ₹50,000.
              With AgentForge, create thousands of visuals for the same budget — no studio, no model, no wait.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Traditional */}
            <div className={`relative overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl sm:p-7 ${card}`}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-400/20 blur-3xl" />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-500">
                  Traditional Shoot
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <p className="text-3xl font-black tracking-tight sm:text-4xl">₹15,000</p>
                  <p className={`pb-1.5 text-sm ${muted}`}>– ₹50,000+ per shoot</p>
                </div>
                <p className={`mt-1 text-xs ${muted}`}>Per single product / collection</p>

                <ul className={`mt-5 space-y-2.5 text-sm leading-6 ${muted}`}>
                  {[
                    "Studio rental & lighting setup",
                    "Photographer + assistant fee",
                    "Model + makeup + stylist",
                    "Props, location, transport",
                    "3 – 7 days waiting time",
                    "Limited retakes / re-shoots",
                    "Post-production editing extra",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                        <XIcon className="h-3 w-3" />
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AgentForge */}
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 shadow-2xl shadow-cyan-500/20 sm:p-7 dark:from-white/[0.05] dark:via-white/[0.04] dark:to-white/[0.03]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/30 blur-3xl" />
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-cyan-500/30">
                <Sparkles className="h-3 w-3" />
                Best Value
              </span>
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-600">
                  AgentForge AI
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <p className="text-3xl font-black tracking-tight sm:text-4xl">15 Credits</p>
                  <p className={`pb-1.5 text-sm ${muted}`}>per premium visual</p>
                </div>
                <p className={`mt-1 text-xs ${muted}`}>15 credits = 1 standard HD visual</p>

                <ul className="mt-5 space-y-2.5 text-sm leading-6">
                  {[
                    "Zero studio, zero setup",
                    "Built-in AI models & styles",
                    "No props, no MUA, no location",
                    "Output ready in ~30 seconds",
                    "Unlimited regeneration & variations",
                    "Article code & branding included",
                    "Catalogue-ready 1080×1080 HD",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span className={darkMode ? "text-white/85" : "text-black/80"}>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Savings callout */}
          <div className={`relative mt-6 overflow-hidden rounded-[2rem] border p-6 text-center backdrop-blur-xl sm:p-8 ${card}`}>
            <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                Real example
              </p>
              <h4 className="mt-2 text-2xl font-black sm:text-3xl">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  1 month traditional cost
                </span>{" "}
                ={" "}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  1 year+ AgentForge
                </span>
              </h4>
              <p className={`mx-auto mt-3 max-w-3xl text-sm leading-7 sm:text-base ${muted}`}>
                If you do just 2 product shoots a month (≈₹40,000), that same budget gets you
                AgentForge's <span className="font-black text-cyan-600">Empire plan</span>{" "}
                — meaning <span className="font-black">3,000+ AI visuals</span> every month,
                plus the bulk catalogue workflow.
              </p>
            </div>
          </div>
        </section>

        {/* What you actually save on */}
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:pb-16">
          <div className="mb-8 text-center sm:mb-10">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
              Where the savings come from
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Skip every expense — keep only the results
              </span>
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: Wallet,
                title: "Studio & Equipment",
                desc: "No rental, lights, backdrops, or camera gear bills.",
              },
              {
                Icon: Sparkles,
                title: "Models & MUA",
                desc: "Built-in model looks and poses available inside the AI.",
              },
              {
                Icon: Clock,
                title: "Time & Sampling",
                desc: "7-din ka wait gone — 30 second mein result.",
              },
              {
                Icon: CheckCircle2,
                title: "Editing & Retakes",
                desc: "Unlimited regenerate — har shot tumhare mann ka.",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className={`group relative overflow-hidden rounded-[1.5rem] border p-5 backdrop-blur-xl transition hover:-translate-y-1 ${card}`}
              >
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl transition group-hover:scale-125" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black sm:text-lg">{title}</h4>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className={`rounded-[2rem] border p-8 text-center backdrop-blur-xl ${card}`}>
            <h3 className="mx-auto max-w-4xl text-3xl font-black leading-tight md:text-4xl">
              One traditional shoot can cost ₹15,000–₹50,000.
            </h3>
            <p className={`mx-auto mt-4 max-w-3xl text-lg leading-8 ${muted}`}>
              With AgentForge, small sellers can start lean, agencies can scale faster, and factories can generate bulk catalogue visuals without waiting for sampling, stitching and photoshoots.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {!isLoggedIn && (
                <Link
                  href="/login?redirect=/pricing"
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-cyan-500/25"
                >
                  Login to Start
                </Link>
              )}

              <Link
                href="/"
                className={`rounded-full px-8 py-4 font-black ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
