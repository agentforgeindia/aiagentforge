// app/payment-success/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const amount = Number(searchParams.get("amount")) || 1999;

    // Meta Purchase Event
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase");
    }

// Google Ads Purchase Conversion
if (typeof window !== "undefined") {
  setTimeout(() => {
    (window as any).gtag?.("event", "conversion", {
      send_to: "AW-18170895451/hLf_CMDA7q8cENu4x9hD",
      value: amount,
      currency: "INR",
      transaction_id: `AF-${Date.now()}`,
    });
  }, 1500);
}

    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 bg-white dark:bg-slate-950">
      {/* Floating Doodles — celebration themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">🎉</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">🥳</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">🎊</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">🚀</div>
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">🪙</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">💰</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🏆</div>
        <div className="float-slow absolute left-[35%] top-[58%] text-2xl opacity-50 sm:text-3xl">💎</div>
        <div className="float-medium absolute right-[30%] top-[62%] text-2xl opacity-55 sm:text-3xl">🎁</div>
        <div className="float-fast absolute left-[14%] top-[70%] text-3xl opacity-55 sm:text-4xl">🌟</div>
        <div className="float-slow absolute right-[14%] top-[74%] text-3xl opacity-55 sm:text-4xl">✅</div>
        <div className="float-fast absolute left-[20%] top-[84%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[88%] text-3xl opacity-60 sm:text-4xl">✨</div>
        <div className="float-slow absolute left-[48%] top-[92%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <div className="relative z-10 max-w-md w-full rounded-3xl border border-cyan-200/60 dark:border-cyan-500/20 bg-white dark:bg-slate-900 p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-3xl">
          ✅
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Payment Successful
        </h1>

        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Your AgentForge credits have been added successfully.
        </p>

        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-bold text-white shadow-lg"
        >
          Go to Home
        </button>

        <p className="mt-4 text-xs text-slate-500">
          Redirecting automatically...
        </p>
      </div>
    </main>
  );
}