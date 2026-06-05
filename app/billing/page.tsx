"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import BillingDetailsModal, {
  type BillingDetails,
} from "@/app/components/BillingDetailsModal";
import {
  BadgeCheck,
  ChevronRight,
  Coins,
  CreditCard,
  Crown,
  Gift,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

type BillingPlan = {
  name: string;
  price: string;
  amount: number;
  desc: string;
  audience: string;
  credits: number;
  creditsLabel: string;
  images: string;
  badge: string;
  popular: boolean;
  factoryFocus?: boolean;
  features: string[];
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: Record<string, string | number>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const plans: BillingPlan[] = [
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
    factoryFocus: true,
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

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState("Free Trial");
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Past purchases — used to render the "Download bill" list at
  // the bottom of the billing page.
  const [paymentHistory, setPaymentHistory] = useState<{
    id: string;
    plan: string;
    amount: number;
    credits_added: number;
    status: string;
    razorpay_payment_id: string | null;
    created_at: string;
  }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Billing-details modal state — shown right before Razorpay opens.
  const [modalPlan, setModalPlan] = useState<BillingPlan | null>(null);
  const [modalOpening, setModalOpening] = useState(false);
  const [profileBilling, setProfileBilling] = useState<Partial<BillingDetails>>({});

  useEffect(() => {
    let active = true;

    async function loadUserBilling() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session?.user) {
          setIsLoggedIn(false);
          setCredits(0);
          setCurrentPlan("Free Trial");
          return;
        }

        setIsLoggedIn(true);
        setUserEmail(session.user.email ?? "");

        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "credits, plan, full_name, billing_name, billing_phone, billing_company, billing_address, billing_gstin",
          )
          .eq("id", session.user.id)
          .single();

        if (!active) return;

        setCredits(profile?.credits ?? 0);
        setCurrentPlan(profile?.plan ?? "Free Trial");

        // Pre-fill the upcoming billing-details modal from the last
        // values the user saved. Falls back to profile name / auth
        // email so the form is rarely empty.
        setProfileBilling({
          name: profile?.billing_name ?? profile?.full_name ?? "",
          phone: profile?.billing_phone ?? "",
          email: session.user.email ?? "",
          company: profile?.billing_company ?? "",
          address: profile?.billing_address ?? "",
          gstin: profile?.billing_gstin ?? "",
        });

        // Past payments (RLS = only own rows). Drives the
        // "Download bill" section at the bottom.
        setHistoryLoading(true);
        const { data: pays } = await supabase
          .from("payments")
          .select(
            "id, plan, amount, credits_added, status, razorpay_payment_id, created_at",
          )
          .eq("user_id", session.user.id)
          .eq("status", "paid")
          .order("created_at", { ascending: false });
        if (active) {
          setPaymentHistory((pays ?? []) as typeof paymentHistory);
          setHistoryLoading(false);
        }
      } catch (error) {
        console.error("Billing load error:", error);
        setCredits(0);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUserBilling();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUserBilling();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function refreshBilling() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, plan")
      .eq("id", session.user.id)
      .single();

    setCredits(profile?.credits ?? 0);
    setCurrentPlan(profile?.plan ?? "Free Trial");
  }

  // Step 1: user clicks "Buy [plan]" → open the billing-details
  // modal. We don't touch Razorpay yet — the modal must collect
  // name + phone (and optional company/address/GSTIN) first.
  async function handlePayment(plan: BillingPlan) {
    setMessage(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setMessage("Please login first to upgrade your plan.");
      window.location.href = "/login";
      return;
    }
    setModalPlan(plan);
  }

  // Step 2: modal submitted with billing snapshot → create order
  // → open Razorpay → verify → store snapshot in payments table.
  async function proceedToCheckout(
    plan: BillingPlan,
    billing: BillingDetails,
  ) {
    try {
      setModalOpening(true);
      setMessage(null);
      setPayingPlan(plan.name);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage("Please login first to upgrade your plan.");
        window.location.href = "/login";
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay checkout failed to load. Please refresh and try again.");
      }

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "InitiateCheckout");
      }

      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planName: plan.name,
          userId: session.user.id,
          amount: plan.amount,
          credits: plan.credits,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData?.order?.id) {
        throw new Error(orderData?.error || "Unable to create payment order.");
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
      if (!razorpayKey) {
        throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID missing in .env.local");
      }

      // Modal collected → safe to close now. Razorpay opens next.
      setModalPlan(null);

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: plan.amount * 100,
        currency: "INR",
        name: "AgentForge",
        description: `${plan.name} Plan - ${plan.creditsLabel}`,
        order_id: orderData.order.id,
        prefill: {
          name: billing.name,
          email: billing.email || userEmail || session.user.email || "",
          contact: billing.phone,
        } as any,
        notes: {
          user_id: session.user.id,
          plan: plan.name,
          credits: plan.credits,
        },
        theme: {
          color: "#0891b2",
        },
        handler: async (response) => {
          const verifyResponse = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              ...response,
              planName: plan.name,
              userId: session.user.id,
              amount: plan.amount,
              credits: plan.credits,
              // Billing snapshot — frozen into payments table.
              billing_name:    billing.name,
              billing_phone:   billing.phone,
              billing_email:   billing.email,
              billing_company: billing.company,
              billing_address: billing.address,
              billing_gstin:   billing.gstin,
            }),
          });

          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) {
            throw new Error(verifyData?.error || "Payment verification failed.");
          }

          await refreshBilling();
          setPayingPlan(null);
          router.push("/payment-success");
        },
        modal: {
          ondismiss: () => {
            setPayingPlan(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Payment failed. Please try again.";
      console.error("Payment error:", error);
      setMessage(errorMessage);
      setPayingPlan(null);
    } finally {
      setModalOpening(false);
    }
  }

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-black/10";
  const softCard = darkMode
    ? "border-white/10 bg-white/[0.05]"
    : "border-cyan-200/70 bg-white/70";
  const muted = darkMode ? "text-white/60" : "text-black/60";
  const strongMuted = darkMode ? "text-white/75" : "text-black/70";

  const standardImageEstimate = credits !== null ? Math.floor(credits / 15) : null;

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

      {/* Floating Doodles — billing themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">🪙</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">💳</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">💰</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">💎</div>

        {/* Side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">🧾</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">🎁</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🏆</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">📊</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">💵</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">📈</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🔒</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">🪙</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <div className="relative z-10">
        {/* ───────── Hero ───────── */}
        <section className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:px-5 sm:py-16 md:py-20">
          {/* Glow aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-12 -z-0 h-[360px] w-[520px] max-w-[90%] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(34,211,238,0.28), rgba(59,130,246,0.12) 55%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          <div className="relative">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-cyan-300/40 bg-white shadow-2xl shadow-cyan-500/25">
              <img src="/logo-new.jpg" alt="AgentForge AI — billing & credits" width={64} height={64} loading="eager" fetchPriority="high" className="h-16 w-16 rounded-2xl object-cover" />
            </div>

            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur sm:text-xs dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
              Billing &amp; Credits
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
            </div>

            <h2 className="mx-auto max-w-5xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Manage Your
              <span className="af-shimmer-text mt-2 block">
                AgentForge Credits
              </span>
            </h2>

            <p className={`mx-auto mt-5 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
              Track your credits, check your active plan and upgrade instantly for textile, jewellery and productography AI visuals.
            </p>

            <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              Secure checkout · Instant credits · No hidden fees
            </p>

            {message && (
              <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm font-bold text-cyan-600">
                {message}
              </div>
            )}
          </div>

          {/* Inline keyframes for shimmer */}
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

        {/* ───────── Account summary trio ───────── */}
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-5">
          <div className="grid gap-5 md:grid-cols-3">
            {/* Credit balance */}
            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/30 bg-gradient-to-br from-cyan-400/15 via-white/40 to-blue-500/15 p-7 shadow-2xl shadow-cyan-500/15 backdrop-blur-xl dark:from-cyan-400/15 dark:via-white/[0.04] dark:to-blue-500/15">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/30 blur-2xl"
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                  <Coins className="h-5 w-5" />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${muted}`}>Credit Balance</p>
              </div>

              <p className="relative mt-5 flex flex-wrap items-baseline gap-2 text-5xl font-black tracking-tight sm:text-6xl">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {loading ? "..." : credits ?? 0}
                </span>
                <span className={`text-sm font-bold sm:text-base ${muted}`}>credits</span>
              </p>

              <div className={`relative mt-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                darkMode ? "border-white/10 bg-white/[0.05] text-white/70" : "border-black/10 bg-white/80 text-black/70"
              }`}>
                <Zap className="h-3.5 w-3.5 text-cyan-500" />
                {standardImageEstimate !== null ? `≈ ${standardImageEstimate} standard images` : "15 credits per standard image"}
              </div>

              <p className={`relative mt-3 text-xs leading-5 ${muted}`}>
                Standard image generation uses 15 credits. Premium styles may use more.
              </p>

              {/* Rewards link */}
              <a href="/rewards"
                className="relative mt-4 flex items-center justify-between gap-2 rounded-2xl border border-emerald-300/50 bg-emerald-50/70 px-4 py-3 transition hover:scale-[1.01] dark:border-emerald-400/20 dark:bg-emerald-500/10">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <div>
                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">Earn free credits</p>
                    <p className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/70">Refer a friend → 50 credits each signup</p>
                  </div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-300">→</span>
              </a>
            </div>

            {/* Current plan */}
            <div className={`relative overflow-hidden rounded-[2rem] border p-7 shadow-2xl backdrop-blur-xl ${card}`}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-400/25 blur-2xl"
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30">
                  <Crown className="h-5 w-5" />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${muted}`}>Current Plan</p>
              </div>

              <p className="relative mt-5 text-3xl font-black tracking-tight">{loading ? "..." : currentPlan}</p>

              <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-[11px] font-black text-cyan-700 dark:text-cyan-200">
                <BadgeCheck className="h-3.5 w-3.5" />
                {isLoggedIn ? "Active account" : "Guest preview"}
              </div>

              <p className={`relative mt-4 text-sm leading-6 ${muted}`}>
                Your plan controls monthly credits, queue speed and bulk production access.
              </p>

              {!isLoggedIn && (
                <Link
                  href="/login"
                  className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
                >
                  Login to Upgrade
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Tagline / Pitch */}
            <div className={`relative overflow-hidden rounded-[2rem] border p-7 shadow-2xl backdrop-blur-xl ${softCard}`}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/25 blur-2xl"
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">AgentForge AI</p>
              </div>

              <h3 className="relative mt-5 text-2xl font-black leading-tight">Upload. Generate. Done.</h3>

              <p className={`relative mt-3 text-sm leading-6 ${muted}`}>
                Premium AI visuals for textile sellers, jewellery brands, product shoots, wholesalers and factories.
              </p>

              <div className="relative mt-4 flex flex-wrap gap-2">
                {[
                  { label: "Textile", accent: "from-cyan-400 to-blue-500" },
                  { label: "Jewellery", accent: "from-amber-400 to-orange-500" },
                  { label: "Product", accent: "from-violet-400 to-fuchsia-500" },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${
                      darkMode ? "border-white/10 bg-white/[0.05] text-white/80" : "border-black/10 bg-white/80 text-black/75"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${chip.accent}`} />
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick info strip */}
          <div className={`mt-5 grid gap-3 rounded-[1.5rem] border p-4 backdrop-blur md:grid-cols-4 ${card}`}>
            {[
              { Icon: ShieldCheck, label: "100% Secure", desc: "Razorpay verified", accent: "from-emerald-400 to-cyan-500" },
              { Icon: Zap, label: "Instant Credits", desc: "Added in seconds", accent: "from-cyan-400 to-blue-500" },
              { Icon: Receipt, label: "Downloadable bill", desc: "Print or save as PDF", accent: "from-violet-400 to-fuchsia-500" },
              { Icon: Gift, label: "No Hidden Fees", desc: "Pay only listed price", accent: "from-amber-400 to-orange-500" },
            ].map(({ Icon, label, desc, accent }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black leading-tight">{label}</p>
                  <p className={`text-[11px] ${muted}`}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Plans ───────── */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-5">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
              Upgrade Your Plan
            </div>
            <h3 className="mt-4 text-3xl font-black md:text-4xl">
              Pick the plan that fits your{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                business volume
              </span>
            </h3>
            <p className={`mx-auto mt-3 max-w-2xl ${muted}`}>
              Same pricing as our pricing page · Direct Razorpay payment · Instant credits after successful verification.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[2rem] border p-4 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 sm:p-6 ${card} ${
                  plan.popular ? "z-10 border-cyan-400 xl:scale-105" : ""
                } ${plan.factoryFocus ? "ring-1 ring-purple-400/30" : ""}`}
              >
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[10px] font-black text-white shadow-xl sm:-top-4 sm:px-5 sm:py-2 sm:text-xs ${
                    plan.popular || plan.factoryFocus
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600"
                      : "bg-gradient-to-r from-cyan-400 to-purple-500"
                  }`}
                >
                  {plan.badge}
                </div>

                <div className="mb-5 mt-3 flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-cyan-600 sm:text-sm">{plan.audience}</p>
                    <h3 className="mt-1.5 text-2xl font-black tracking-tight sm:mt-2 sm:text-3xl">{plan.name}</h3>
                    <p className={`mt-2 text-xs leading-5 sm:text-sm sm:leading-6 ${muted}`}>{plan.desc}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-inner sm:h-14 sm:w-14">
                    <img src="/logo-new.jpg" alt="AgentForge AI plan badge" width={56} height={56} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                </div>

                <div
                  className={`rounded-3xl border p-4 sm:p-5 ${
                    plan.factoryFocus
                      ? "border-purple-300/40 bg-gradient-to-br from-purple-400/10 to-cyan-400/10"
                      : "border-cyan-400/20 bg-cyan-400/10"
                  }`}
                >
                  <div className="flex flex-wrap items-end gap-2">
                    <p className="text-4xl font-black tracking-tight sm:text-5xl">{plan.price}</p>
                    <p className={`pb-1.5 text-sm sm:pb-2 ${muted}`}>/ month</p>
                  </div>
                  <p className="mt-4 rounded-full bg-white px-4 py-2 text-center text-sm font-black text-black">
                    {plan.creditsLabel}
                  </p>
                  <p className={`mt-3 text-center text-sm font-bold ${strongMuted}`}>{plan.images}</p>
                </div>

                {plan.factoryFocus && (
                  <div className="mt-5 rounded-2xl border border-purple-300/30 bg-purple-400/10 px-4 py-3 text-sm font-bold text-purple-500">
                    Built for bulk catalogue, factory sampling and wholesale client previews.
                  </div>
                )}

                <div className="mt-6 flex-1">
                  <h4 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-cyan-600">What you will get</h4>
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
                  disabled={payingPlan === plan.name}
                  className={`mt-6 w-full rounded-2xl py-4 font-black shadow-xl transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-cyan-500/25"
                      : plan.factoryFocus
                      ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-purple-500/20"
                      : darkMode
                      ? "bg-white text-black"
                      : "bg-black text-white"
                  }`}
                >
                  {payingPlan === plan.name ? "Opening Payment..." : `Upgrade to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Why Upgrade ───────── */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-5">
          <div className={`relative overflow-hidden rounded-[2rem] border p-8 shadow-2xl backdrop-blur-xl ${card}`}>
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 shadow-sm backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                  Why Upgrade?
                </div>

                <h3 className="mt-4 max-w-4xl text-3xl font-black leading-tight md:text-4xl">
                  One traditional shoot can cost{" "}
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    ₹15,000–₹50,000
                  </span>
                  .
                </h3>
                <p className={`mt-4 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
                  With AgentForge, you can create hundreds of premium AI visuals for textile, jewellery and products at a fraction of the cost.
                </p>

                {/* Value chips */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    { Icon: Wallet, label: "Save up to 90% on shoots" },
                    { Icon: Zap, label: "Visuals ready in minutes" },
                    { Icon: CreditCard, label: "Pay once, use anytime" },
                  ].map(({ Icon, label }) => (
                    <span
                      key={label}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black backdrop-blur sm:text-xs ${
                        darkMode ? "border-white/10 bg-white/[0.05] text-white/80" : "border-black/10 bg-white/80 text-black/75"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 text-cyan-500" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`relative overflow-hidden rounded-[1.5rem] border p-6 ${softCard}`}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-400/25 blur-2xl" />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30">
                    <Crown className="h-5 w-5" />
                  </div>
                  <h4 className="text-xl font-black">Need bulk for your factory?</h4>
                </div>

                <p className={`relative mt-3 text-sm leading-6 ${muted}`}>
                  Empire is designed for wholesalers, factories and teams that need repeated catalogue production, article-code handling and monthly output planning.
                </p>

                <div className="relative mt-6 flex flex-wrap gap-3">
                  {!isLoggedIn && (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-cyan-500/25 transition hover:scale-105"
                    >
                      Login to Start
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}

                  <Link
                    href="/pricing"
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition hover:scale-105 ${darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-sm"}`}
                  >
                    Compare Pricing
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Payment history + downloadable bills ───────── */}
        {isLoggedIn && (
          <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-5">
            <div className={`rounded-[2rem] border p-5 sm:p-8 backdrop-blur ${card}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-600">
                    Bills &amp; receipts
                  </p>
                  <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                    Your past payments
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Click <span className="font-black">Download</span> on any
                    row to open a printable bill — use your browser's
                    “Save as PDF” to keep a copy.
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.04]">
                {historyLoading ? (
                  <p className={`p-6 text-center text-sm ${muted}`}>Loading…</p>
                ) : paymentHistory.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-3xl">🧾</p>
                    <p className={`mt-2 text-sm ${muted}`}>
                      No payments yet. Once you buy a plan, the bill will
                      appear here for download.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-black/5 dark:divide-white/5">
                    {paymentHistory.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                              {p.status}
                            </span>
                            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                              {p.plan}
                            </span>
                            <span className={`text-[11px] font-bold ${muted}`}>
                              {new Date(p.created_at).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short", year: "numeric" },
                              )}
                            </span>
                          </div>
                          <p className="mt-1.5 truncate text-sm">
                            <span className="font-black">
                              ₹{Number(p.amount).toLocaleString("en-IN")}
                            </span>{" "}
                            <span className={muted}>·</span>{" "}
                            <span className="tabular-nums">
                              +{Number(p.credits_added).toLocaleString("en-IN")} credits
                            </span>
                          </p>
                          <p className={`mt-0.5 truncate font-mono text-[11px] ${muted}`}>
                            {p.razorpay_payment_id ?? "—"}
                          </p>
                        </div>
                        <Link
                          href={`/invoice/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-black text-white shadow"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Download bill
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Billing-details modal — only opens when user clicks
          "Buy [plan]". Razorpay never opens before this form is
          completed (or cancelled). */}
      <BillingDetailsModal
        open={Boolean(modalPlan)}
        onClose={() => {
          if (!modalOpening) setModalPlan(null);
        }}
        onSubmit={(details) => {
          if (modalPlan) proceedToCheckout(modalPlan, details);
        }}
        initial={profileBilling}
        planName={modalPlan?.name ?? ""}
        amount={modalPlan?.amount ?? 0}
        submitting={modalOpening}
      />
    </main>
  );
}
