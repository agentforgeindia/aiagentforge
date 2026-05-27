"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";
import {
  BadgeCheck,
  ChevronRight,
  Gift,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

function isValidIndianPhone(value: string) {
  // 10 digits, optionally starting with leading 6-9 (Indian mobile)
  const digits = value.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digits);
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cleanedPhone = phone.replace(/\D/g, "");
  const canSubmit = !loading && isValidIndianPhone(cleanedPhone);

  async function savePhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("User session not found. Please login again.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ phone: cleanedPhone })
      .eq("id", user.id);

    if (updateError) {
      setError("Failed to save mobile number. Please try again.");
      console.error(updateError);
      setLoading(false);
      return;
    }

    setMessage("Mobile number saved. Redirecting...");
    setTimeout(() => router.push("/"), 600);
  }

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-black/10";
  const muted = darkMode ? "text-white/60" : "text-black/60";
  const inputClass = `w-full rounded-2xl border bg-transparent px-4 py-4 pl-24 pr-4 text-base font-bold tracking-wider outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 ${
    darkMode
      ? "border-white/10 bg-white/[0.05] text-white placeholder:text-white/35"
      : "border-black/10 bg-white text-black placeholder:text-black/35"
  }`;

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Floating Doodles — phone/profile themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">📱</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">🎁</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">💬</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">🚀</div>

        {/* Side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">🛡️</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">🪙</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">💎</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">📞</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">🌟</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">🔔</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🎨</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">✨</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-180px)] max-w-md items-center justify-center px-4 py-12 sm:px-5">
        <form
          onSubmit={savePhone}
          className={`relative w-full overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl sm:p-8 ${card}`}
        >
          {/* Decorative blurs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            {/* Logo + eyebrow */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-cyan-300/40 bg-white shadow-2xl shadow-cyan-500/25 dark:border-cyan-400/30 dark:bg-white/10">
                <img src="/af-logo.png" alt="AgentForge" className="h-16 w-16 rounded-2xl object-cover" />
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur sm:text-[11px] dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
                One last step
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
              </div>

              <h1 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">
                Add your{" "}
                <span className="af-shimmer-text">mobile number</span>
              </h1>

              <p className={`mt-3 max-w-sm text-sm leading-6 ${muted}`}>
                We use this for order updates, WhatsApp catalogue support, and account recovery — never for spam.
              </p>
            </div>

            {/* Phone input with +91 prefix */}
            <div className="grid gap-4">
              <div className="relative">
                <div
                  className={`pointer-events-none absolute left-3 top-1/2 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-xl border px-2.5 text-sm font-black ${
                    darkMode ? "border-white/10 bg-white/[0.08] text-white/80" : "border-black/10 bg-white text-black/70"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5 text-cyan-500" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="98765 43210"
                  maxLength={12}
                  autoFocus
                />
              </div>

              {/* Validation hint / error */}
              {error && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600">
                  {message}
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>

            {/* Why we ask — benefit chips */}
            <div className={`mt-6 grid gap-2.5 rounded-2xl border p-4 ${
              darkMode ? "border-white/10 bg-white/[0.04]" : "border-cyan-200/60 bg-gradient-to-br from-cyan-50/80 to-blue-50/60"
            }`}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Why we ask
              </p>
              <div className="grid gap-2 text-xs sm:text-sm">
                {[
                  { Icon: MessageCircle, label: "WhatsApp catalogue & support updates", accent: "from-emerald-400 to-cyan-500" },
                  { Icon: ShieldCheck, label: "Account recovery & secure 2FA", accent: "from-cyan-400 to-blue-500" },
                  { Icon: Gift, label: "Exclusive offers + bonus credits on launch", accent: "from-amber-400 to-orange-500" },
                ].map(({ Icon, label, accent }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className={`leading-5 ${darkMode ? "text-white/75" : "text-black/75"}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom trust row */}
            <div className={`mt-5 flex items-center justify-center gap-3 text-[11px] font-bold ${muted}`}>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Secure
              </span>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                One-time
              </span>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
                No spam
              </span>
            </div>
          </div>

          {/* Shimmer keyframes */}
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
        </form>
      </section>
    </main>
  );
}
