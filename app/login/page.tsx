"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (value.trim().startsWith("+")) return value.trim();
  return digits ? `+${digits}` : value.trim();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && !value.includes("@");
}

export default function LoginPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const trimmedIdentifier = identifier.trim();

  const emailMode = useMemo(() => isEmail(trimmedIdentifier), [trimmedIdentifier]);
  const mobileMode = useMemo(() => isMobile(trimmedIdentifier), [trimmedIdentifier]);

  const canSubmit =
    !loading &&
    ((emailMode && password.length >= 6) || (mobileMode && (!otpSent || otp.trim().length >= 4)));

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage("Please enter a valid email/mobile number and password/OTP.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (emailMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedIdentifier,
          password,
        });

        if (error) throw error;

        router.replace("/");
        router.refresh();
        return;
      }

      if (mobileMode) {
        const phone = normalizePhone(trimmedIdentifier);

        if (!otpSent) {
          const { error } = await supabase.auth.signInWithOtp({ phone });
          if (error) throw error;

          setOtpSent(true);
          setMessage("OTP sent. Please enter the code.");
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp.trim(),
          type: "sms",
        });

        if (error) throw error;

        router.replace("/");
        router.refresh();
        return;
      }

      setMessage("Please enter a valid email address or mobile number.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithProvider(provider: "google" | "facebook" | "apple") {
    if (loading) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
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
              Use email/password or mobile OTP. Google login is supported when enabled in Supabase.
            </p>
          </div>

          <div className="grid gap-4">
            <input
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setOtpSent(false);
                setOtp("");
              }}
              className={inputClass}
              placeholder="Email or mobile number"
              autoComplete="email"
            />

            {emailMode && (
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder="Password"
                type="password"
                autoComplete="current-password"
              />
            )}

            {mobileMode && otpSent && (
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className={inputClass}
                placeholder="Enter OTP"
                inputMode="numeric"
              />
            )}

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
              {loading ? "Please wait..." : mobileMode && !otpSent ? "Send OTP" : "Login"}
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

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => loginWithProvider("google")}
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
              Google
            </button>

            <button
              type="button"
              disabled
              title="Coming soon"
              className={`flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-black opacity-50 ${
                darkMode ? "border-white/10 bg-white/10 text-white" : "border-black/10 bg-white text-black"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.96.95-2.04 1.78-3.23 1.78-1.12 0-1.44-.71-2.73-.71-1.32 0-1.68.71-2.73.71-1.23 0-2.31-.83-3.27-1.78-2.04-2.04-3.15-5.32-3.15-8.31 0-2.88 1.48-4.48 3.12-4.48 1.12 0 1.84.66 2.64.66.75 0 1.48-.66 2.64-.66 1.48 0 2.56.96 3.12 2.08-3.04 1.36-2.52 5.56.52 6.84-.6 1.48-1.32 2.88-2.31 3.88M12.01 4.24c-.08-2.12 1.48-4 3.4-4.24.16 2.2-1.84 4.08-3.4 4.24" />
              </svg>
              Apple
            </button>

            <button
              type="button"
              disabled
              title="Coming soon"
              className={`flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-black opacity-50 ${
                darkMode ? "border-white/10 bg-white/10 text-white" : "border-black/10 bg-white text-black"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

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
