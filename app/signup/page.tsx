"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SignupPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const trimmedEmail = email.trim();

  const canSubmit =
    !loading &&
    name.trim().length >= 2 &&
    isEmail(trimmedEmail) &&
    password.length >= 6;

  async function ensureUserProfile(userId: string, userEmail?: string | null) {
    const fullName = name.trim() || userEmail?.split("@")[0] || "Creator";

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: userEmail ?? trimmedEmail,
        full_name: fullName,
        credits: 200,
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("Profile setup failed:", error.message);
      setMessage(`Profile setup failed: ${error.message}`);
      return false;
    }

    return true;
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage("Please enter your name, valid email, and minimum 6 character password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        const profileReady = await ensureUserProfile(data.user.id, data.user.email);
        if (!profileReady) return;

        router.replace("/");
        router.refresh();
        return;
      }

      setMessage("Account created. Please verify your email, then login.");
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function signupWithGoogle() {
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
            Start with 200 credits after signup
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Create your AgentForge account
          </h1>

          <p className={`mt-5 max-w-xl text-lg leading-8 ${muted}`}>
            Sign up to access TextilePrints to Mockup AI, Jewellery AI Studio, and premium product visuals.
          </p>
        </div>

        <form onSubmit={handleSignup} className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}>
          <div className="mb-6">
            <h2 className="text-2xl font-black">Sign Up</h2>
            <p className={`mt-2 text-sm ${muted}`}>
              Use email/password or continue with Google.
            </p>
          </div>

          <div className="grid gap-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
              placeholder="Full name"
              autoComplete="name"
            />

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="Email address"
              autoComplete="email"
              type="email"
            />

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              placeholder="Password (minimum 6 characters)"
              type="password"
              autoComplete="new-password"
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
              {loading ? "Please wait..." : "Create Account"}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className={`h-px flex-1 ${darkMode ? "bg-white/10" : "bg-black/10"}`} />
            <span className={`text-xs font-bold ${muted}`}>OR</span>
            <div className={`h-px flex-1 ${darkMode ? "bg-white/10" : "bg-black/10"}`} />
          </div>

          <button
            type="button"
            onClick={signupWithGoogle}
            disabled={loading}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-black shadow-sm transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 ${
              darkMode ? "border-white/10 bg-white/10 text-white" : "border-black/10 bg-white text-black"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-base font-black">
              G
            </span>
            Continue with Google
          </button>

          <p className={`mt-5 text-center text-xs leading-5 ${muted}`}>
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="font-black text-cyan-500">
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy-policy" className="font-black text-cyan-500">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/refund-policy" className="font-black text-cyan-500">
              Refund Policy
            </Link>
            .
          </p>

          <p className={`mt-5 text-center text-sm ${muted}`}>
            Already have an account?{" "}
            <Link href="/login" className="font-black text-cyan-500">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}