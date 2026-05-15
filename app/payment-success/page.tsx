// app/payment-success/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {

    // Meta Purchase Event
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase");
    }

    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-slate-950">
      <div className="max-w-md w-full rounded-3xl border border-cyan-200/60 dark:border-cyan-500/20 bg-white dark:bg-slate-900 p-8 text-center shadow-xl">
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