"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

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
    desc: "For small shops and creators starting with AI product visuals.",
    audience: "Small shops & creators",
    credits: 2400,
    creditsLabel: "2,400 Credits",
    images: "Up to 120 standard generations",
    badge: "Best to Start",
    popular: false,
    features: [
      "All AI agents access",
      "15 credits per standard image",
      "1080×1080 square export",
      "Watermark-free outputs",
      "Standard generation queue",
      "Basic support",
    ],
  },
  {
    name: "Pro Creator",
    price: "₹9,999",
    amount: 9999,
    desc: "For sellers, agencies and growing brands creating content regularly.",
    audience: "Sellers, agencies & growing brands",
    credits: 16000,
    creditsLabel: "16,000 Credits",
    images: "Up to 800 standard generations",
    badge: "Most Popular",
    popular: true,
    features: [
      "Everything in Starter",
      "Faster generation queue",
      "Premium styles included",
      "Mobile story outputs",
      "Regenerate variations",
      "Priority support",
    ],
  },
  {
    name: "Empire",
    price: "₹39,999",
    amount: 39999,
    desc: "For factories, wholesalers and teams needing bulk AI production.",
    audience: "Factories, wholesalers & teams",
    credits: 60000,
    creditsLabel: "60,000 Credits",
    images: "Up to 3,000 standard generations",
    badge: "Bulk Studio",
    popular: false,
    features: [
      "Everything in Pro Creator",
      "Bulk upload mode",
      "Bulk generate at discounted credits",
      "Team workflow ready",
      "Fastest processing queue",
      "Dedicated business support",
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
          router.push("/payment-success");

          setPaymentMessage(`${plan.creditsLabel} added successfully. Your AgentForge plan is active now.`);
          setLoadingPlan(null);
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

          {paymentMessage && (
            <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm font-bold text-cyan-600 backdrop-blur-xl">
              {paymentMessage}
            </div>
          )}

          {!isLoggedIn && (
            <div className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 p-5 backdrop-blur-xl">
              <h3 className="text-2xl font-black">Start After Login</h3>
              <p className={`mt-2 ${muted}`}>
                Login ke baad trial credits activate honge. Pricing simple monthly image volume par based hai.
              </p>
              <Link
                href="/login?redirect=/pricing"
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 font-black text-white shadow-xl shadow-cyan-500/25"
              >
                Login to Start
              </Link>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 ${card} ${
                  plan.popular ? "z-10 border-cyan-400 xl:scale-105" : ""
                }`}
              >
                <div className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-cyan-500/25">
                  {plan.badge}
                </div>

                <div className="mb-5 flex items-start justify-between gap-4 pr-24">
                  <div>
                    <p className="text-sm font-semibold text-cyan-600">{plan.audience}</p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight">{plan.name}</h3>
                    <p className={`mt-3 text-sm leading-6 ${muted}`}>{plan.desc}</p>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-inner">
                    <img src="/logo-new.jpg" alt="AgentForge Logo" className="h-full w-full object-cover" />
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                  <div className="flex items-end gap-2">
                    <p className="text-5xl font-black tracking-tight">{plan.price}</p>
                    <p className={`pb-2 text-sm ${muted}`}>/ month</p>
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

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className={`rounded-[2rem] border p-8 text-center backdrop-blur-xl ${card}`}>
            <h3 className="mx-auto max-w-4xl text-3xl font-black leading-tight md:text-4xl">
              One traditional shoot can cost ₹15,000–₹50,000.
            </h3>
            <p className={`mx-auto mt-4 max-w-3xl text-lg leading-8 ${muted}`}>
              With AgentForge, you can create hundreds of premium AI visuals for textile, jewellery, and products at a fraction of the cost.
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
