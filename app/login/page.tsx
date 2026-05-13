"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

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
  const inputClass = `w-full rounded-2xl border px-4 py-4 text-sm outline-none transition focus:border-cyan-400 ${
    darkMode
      ? "border-white/10 bg-white/10 text-white placeholder:text-white/35"
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

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-500">
            Welcome back to AgentForge
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Login and start creating
          </h1>

          <p className={`mt-5 max-w-xl text-lg leading-8 ${muted}`}>
            Access your credits, saved creations, and AI visual generation tools.
          </p>
        </div>

        <form onSubmit={handleLogin} className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}>
          <div className="mb-6">
            <h2 className="text-2xl font-black">Login</h2>
            <p className={`mt-2 text-sm ${muted}`}>
              Use email/password or continue with Google.
            </p>
          </div>

          <div className="grid gap-4">
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className={inputClass}
              placeholder="Email address"
              autoComplete="email"
            />

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
            />

            {message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")
                    ? "border-red-400/30 bg-red-500/10 text-red-500"
                    : "border-cyan-400/30 bg-cyan-400/10 text-cyan-500"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </div>

          {emailMode && (
            <button
              type="button"
              onClick={() => setShowReset((value) => !value)}
              className="mt-4 text-sm font-black text-cyan-500"
            >
              Forgot password?
            </button>
          )}

          {showReset && (
            <div className="mt-4 grid gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <input
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                className={inputClass}
                placeholder="Enter email for reset link"
              />
              <button
                type="button"
                onClick={sendPasswordReset}
                disabled={resetLoading}
                className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {resetLoading ? "Sending..." : "Send reset link"}
              </button>
              {resetMsg && <p className="text-sm text-cyan-500">{resetMsg}</p>}
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
            className={`flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-black shadow-sm transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 ${
              darkMode ? "border-white/10 bg-white/10 text-white" : "border-black/10 bg-white text-black"
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className={`mt-5 text-center text-sm ${muted}`}>
            New to AgentForge?{" "}
            <Link href="/signup" className="font-black text-cyan-500">
              Create account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
