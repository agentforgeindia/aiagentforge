"use client";

// /reset-password — where the "Forgot password?" email link lands.
//
// The link signs the person in with a short-lived recovery session
// (Supabase reads it from the URL). Until now that link went to
// /login, which had no way to set a new password — so the reset
// never actually reset anything. This page asks for the new password
// and saves it with supabase.auth.updateUser().

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";

const MIN_PASSWORD_LENGTH = 8;

type Stage = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [stage, setStage] = useState<Stage>("checking");
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        setStage((current) => (current === "done" || current === "invalid" ? current : "ready"));
      }
    });

    (async () => {
      // An expired / already-used link comes back with an error in the URL.
      const fromUrl = new URLSearchParams(
        `${window.location.hash.replace(/^#/, "")}&${window.location.search.replace(/^\?/, "")}`,
      );
      const urlError = fromUrl.get("error_description") || fromUrl.get("error");
      if (urlError) {
        await Promise.resolve();
        if (!active) return;
        setLinkError(urlError.replace(/\+/g, " "));
        setStage("invalid");
        return;
      }

      // Newer links carry ?code=… instead of tokens in the hash.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => undefined);
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStage((current) => (current === "done" ? current : "ready"));
        return;
      }
      // Give the client a moment to read the tokens from the URL.
      window.setTimeout(async () => {
        if (!active) return;
        const { data: later } = await supabase.auth.getSession();
        if (!active) return;
        setStage((current) => {
          if (current !== "checking") return current;
          return later.session ? "ready" : "invalid";
        });
      }, 2500);
    })();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setMessage("The two passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setStage("done");
    window.setTimeout(() => router.replace("/"), 1800);
  }

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-black/10";
  const muted = darkMode ? "text-white/60" : "text-black/60";
  const inputClass = `w-full rounded-2xl border bg-transparent px-4 py-4 pl-11 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 ${
    darkMode ? "border-white/15 placeholder-white/35" : "border-black/15 placeholder-black/35"
  }`;

  return (
    <main className={`flex min-h-screen items-center justify-center px-5 py-12 ${bg}`}>
      <div className={`w-full max-w-md rounded-3xl border p-7 shadow-2xl ${card}`}>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-black">Set a new password</h1>
            <p className={`text-xs font-medium ${muted}`}>AgentForge AI</p>
          </div>
        </div>

        {stage === "checking" && (
          <p className={`text-sm font-medium ${muted}`}>Checking your reset link…</p>
        )}

        {stage === "invalid" && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-rose-600 dark:text-rose-300">
              This reset link is not valid any more{linkError ? ` (${linkError})` : ""}.
            </p>
            <p className={`text-sm ${muted}`}>
              Reset links work once and expire after a short time. Ask for a new one from the login
              page — tap “Forgot password?”.
            </p>
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/25"
            >
              Back to login
            </Link>
          </div>
        )}

        {stage === "ready" && (
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="relative">
              <Lock className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder={`New password (at least ${MIN_PASSWORD_LENGTH} characters)`}
              />
            </div>
            <div className="relative">
              <Lock className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="Type the new password again"
              />
            </div>
            {message && <p className="text-sm font-bold text-rose-600 dark:text-rose-300">{message}</p>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.01] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}

        {stage === "done" && (
          <div className="space-y-2">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              Password changed. You are signed in — taking you to the home page…
            </p>
            <Link href="/" className="text-sm font-black text-cyan-600 hover:underline dark:text-cyan-300">
              Go now →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
