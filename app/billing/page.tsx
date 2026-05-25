"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

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
          .select("credits, plan")
          .eq("id", session.user.id)
          .single();

        if (!active) return;

        setCredits(profile?.credits ?? 0);
        setCurrentPlan(profile?.plan ?? "Free Trial");
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

  async function handlePayment(plan: BillingPlan) {
    try {
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

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: plan.amount * 100,
        currency: "INR",
        name: "AgentForge",
        description: `${plan.name} Plan - ${plan.creditsLabel}`,
        order_id: orderData.order.id,
        prefill: {
          email: userEmail || session.user.email || "",
        },
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
        <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-cyan-300/40 bg-white shadow-2xl shadow-cyan-500/20">
            <img src="/logo-new.jpg" alt="AgentForge logo" className="h-16 w-16 rounded-2xl object-cover" />
          </div>

          <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-black text-cyan-600">
            Billing & Credits
          </div>

          <h2 className="mx-auto max-w-5xl text-5xl font-black leading-tight md:text-7xl">
            Manage Your
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              AgentForge Credits
            </span>
          </h2>

          <p className={`mx-auto mt-6 max-w-3xl text-lg leading-8 ${muted}`}>
            Track your credits, check your active plan and upgrade instantly for textile, jewellery and productography AI visuals.
          </p>

          {message && (
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm font-bold text-cyan-600">
              {message}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-8 text-center backdrop-blur-xl md:col-span-1">
              <p className={`text-sm font-black uppercase tracking-widest ${muted}`}>Credit Balance</p>
              <p className="mt-3 text-6xl font-black text-cyan-500">🪙 {loading ? "..." : credits}</p>
              <p className={`mt-3 text-sm ${muted}`}>Standard image generation uses 15 credits.</p>
            </div>

            <div className={`rounded-[2rem] border p-8 shadow-xl backdrop-blur-xl ${card}`}>
              <p className={`text-sm font-black uppercase tracking-widest ${muted}`}>Current Plan</p>
              <p className="mt-3 text-3xl font-black">{currentPlan}</p>
              <p className={`mt-3 text-sm ${muted}`}>Your plan controls monthly credits, queue speed and bulk production access.</p>

              {!isLoggedIn && (
                <Link
                  href="/login"
                  className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105"
                >
                  Login to Upgrade
                </Link>
              )}
            </div>

            <div className={`rounded-[2rem] border p-8 shadow-xl backdrop-blur-xl ${softCard}`}>
              <p className="text-sm font-black uppercase tracking-widest text-cyan-600">AgentForge AI</p>
              <h3 className="mt-3 text-2xl font-black">Upload. Generate. Done.</h3>
              <p className={`mt-3 text-sm leading-6 ${muted}`}>
                Premium AI visuals for textile sellers, jewellery brands, product shoots, wholesalers and factories.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className="mb-8 text-center">
            <h3 className="text-3xl font-black md:text-4xl">Upgrade Your Plan</h3>
            <p className={`mt-3 ${muted}`}>Same pricing, direct payment, instant credits after successful verification.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 ${card} ${
                  plan.popular ? "z-10 border-cyan-400 xl:scale-105" : ""
                } ${plan.factoryFocus ? "ring-1 ring-purple-400/30" : ""}`}
              >
                <div
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-xs font-black text-white shadow-xl ${
                    plan.popular || plan.factoryFocus
                      ? "bg-gradient-to-r from-cyan-400 to-blue-600"
                      : "bg-gradient-to-r from-cyan-400 to-purple-500"
                  }`}
                >
                  {plan.badge}
                </div>

                <div className="mb-5 mt-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-cyan-600">{plan.audience}</p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight">{plan.name}</h3>
                    <p className={`mt-2 text-sm leading-6 ${muted}`}>{plan.desc}</p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-inner">
                    <img src="/logo-new.jpg" alt="AgentForge Logo" className="h-full w-full object-cover" />
                  </div>
                </div>

                <div
                  className={`rounded-3xl border p-5 ${
                    plan.factoryFocus
                      ? "border-purple-300/40 bg-gradient-to-br from-purple-400/10 to-cyan-400/10"
                      : "border-cyan-400/20 bg-cyan-400/10"
                  }`}
                >
                  <div className="flex flex-wrap items-end gap-2">
                    <p className="text-5xl font-black tracking-tight">{plan.price}</p>
                    <p className={`pb-2 text-sm ${muted}`}>/ month</p>
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

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className={`grid gap-6 rounded-[2rem] border p-8 backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] ${card}`}>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">Why Upgrade?</p>
              <h3 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-4xl">
                One traditional shoot can cost ₹15,000–₹50,000.
              </h3>
              <p className={`mt-4 max-w-3xl text-lg leading-8 ${muted}`}>
                With AgentForge, you can create hundreds of premium AI visuals for textile, jewellery and products at a fraction of the cost.
              </p>
            </div>

            <div className={`rounded-[1.5rem] border p-6 ${softCard}`}>
              <h4 className="text-xl font-black">Need bulk for your factory?</h4>
              <p className={`mt-3 text-sm leading-6 ${muted}`}>
                Empire is designed for wholesalers, factories and teams that need repeated catalogue production, article-code handling and monthly output planning.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-cyan-500/25"
                  >
                    Login to Start
                  </Link>
                )}

                <Link
                  href="/pricing"
                  className={`rounded-full px-6 py-3 text-sm font-black ${darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-sm"}`}
                >
                  Compare Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
