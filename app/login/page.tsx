"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";
import {
  BadgeCheck,
  ChevronRight,
  Gem,
  Gift,
  Lock,
  Mail,
  Shirt,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Zap,
} from "lucide-react";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}


export default function LoginPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const trimmedIdentifier = identifier.trim();

  const emailMode = isEmail(trimmedIdentifier);

  const canSubmit = !loading && emailMode && password.length >= 6;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage("Please enter a valid email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedIdentifier,
        password,
      });

      if (error) throw error;

      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (!isEmail(resetEmail)) {
      setResetMsg("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    setResetMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setResetMsg(error.message);
    } else {
      setResetMsg("Password reset link sent to your email.");
    }

    setResetLoading(false);
  }

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-black/10";
  const muted = darkMode ? "text-white/60" : "text-black/60";
  const inputClass = `w-full rounded-2xl border bg-transparent px-4 py-4 pl-11 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 ${
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

      {/* Floating Doodles — login themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">🔐</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">👋</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">🔑</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">🚀</div>

        {/* Side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">🛡️</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">🎁</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">💎</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">🪄</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">🌟</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">🎨</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">📸</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">✨</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1fr_0.95fr] lg:py-16">
        {/* ───────── Left: hero ───────── */}
        <div className="relative">
          {/* Glow aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 top-10 -z-0 h-[360px] w-[440px] max-w-[90%] rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(34,211,238,0.28), rgba(59,130,246,0.12) 55%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur sm:text-xs dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
              Welcome back
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">Login and</span>
              <span className="af-shimmer-text block">start creating</span>
            </h1>

            <p className={`mt-5 max-w-xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
              Access your credits, saved creations, and AI visual generation tools — all in one place.
            </p>

            {/* Feature chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { Icon: Shirt, label: "Textile mockups", accent: "from-cyan-400 to-blue-500" },
                { Icon: Gem, label: "Jewellery shoots", accent: "from-amber-400 to-orange-500" },
                { Icon: SprayCan, label: "Productography", accent: "from-violet-400 to-fuchsia-500" },
              ].map(({ Icon, label, accent }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black backdrop-blur sm:text-xs ${
                    darkMode ? "border-white/10 bg-white/[0.05] text-white/80" : "border-black/10 bg-white/80 text-black/75"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r ${accent} text-white`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  {label}
                </span>
              ))}
            </div>

            {/* Live status pill */}
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              Secure login · Encrypted · 1-tap Google
            </p>

            {/* Trust mini-strip */}
            <div className={`mt-6 grid max-w-md grid-cols-3 gap-2 rounded-2xl border p-3 text-center backdrop-blur ${
              darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"
            }`}>
              <div>
                <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-base font-black text-transparent sm:text-lg">
                  Secure
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>Supabase auth</p>
              </div>
              <div className={`border-x ${darkMode ? "border-white/10" : "border-black/10"}`}>
                <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-base font-black text-transparent sm:text-lg">
                  Instant
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>Resume in 1-click</p>
              </div>
              <div>
                <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-base font-black text-transparent sm:text-lg">
                  Free
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>200 credits to start</p>
              </div>
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
        </div>

        {/* ───────── Right: form card ───────── */}
        <form
          onSubmit={handleLogin}
          className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}
        >
          {/* Decorative blurs inside card */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
                  <BadgeCheck className="h-3 w-3" />
                  Member sign-in
                </div>
                <h2 className="text-2xl font-black leading-tight sm:text-3xl">Login</h2>
                <p className={`mt-2 text-sm ${muted}`}>
                  Use email/password or continue with Google.
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/40 bg-white shadow-lg shadow-cyan-500/20 dark:border-cyan-400/30 dark:bg-white/10">
                <img src="/af-logo.png" alt="AgentForge" className="h-9 w-9 rounded-xl object-cover" />
              </div>
            </div>

            <div className="grid gap-4">
              {/* Email */}
              <div className="relative">
                <Mail className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className={inputClass}
                  placeholder="Email address"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                />
              </div>

              {message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")
                      ? "border-red-400/30 bg-red-500/10 text-red-500"
                      : "border-cyan-400/30 bg-cyan-400/10 text-cyan-600"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  "Please wait..."
                ) : (
                  <>
                    Login
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>

            {emailMode && (
              <button
                type="button"
                onClick={() => setShowReset((value) => !value)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-black text-cyan-600 hover:underline dark:text-cyan-300"
              >
                Forgot password?
              </button>
            )}

            {showReset && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <div className="relative">
                  <Mail className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
                  <input
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    className={inputClass}
                    placeholder="Enter email for reset link"
                  />
                </div>
                <button
                  type="button"
                  onClick={sendPasswordReset}
                  disabled={resetLoading}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {resetLoading ? "Sending..." : "Send reset link"}
                </button>
                {resetMsg && <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">{resetMsg}</p>}
              </div>
            )}

            <div className="my-6 flex items-center gap-3">
              <div className={`h-px flex-1 ${darkMode ? "bg-white/10" : "bg-black/10"}`} />
              <span className={`text-xs font-bold ${muted}`}>OR</span>
              <div className={`h-px flex-1 ${darkMode ? "bg-white/10" : "bg-black/10"}`} />
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={loading}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-black shadow-sm transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                darkMode ? "border-white/10 bg-white/10 text-white" : "border-black/10 bg-white text-black"
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Bottom trust row */}
            <div className={`mt-5 flex items-center justify-center gap-3 text-[11px] font-bold ${muted}`}>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Secure
              </span>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Instant
              </span>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Gift className="h-3.5 w-3.5 text-cyan-500" />
                Free credits
              </span>
            </div>

            <p className={`mt-5 text-center text-sm ${muted}`}>
              New to AgentForge?{" "}
              <Link href="/signup" className="font-black text-cyan-600 hover:underline dark:text-cyan-300">
                Create account
              </Link>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
