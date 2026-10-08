"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import {
  PHONE_PROMPT_DELAY_MS,
  PHONE_REQUIRED_EVENT,
  cleanIndianMobile,
  profileHasPhone,
  settlePhoneRequest,
} from "@/lib/phoneGate";

// Asks a signed-in user for their mobile number (rules in lib/phoneGate.ts):
//   • "soft"     — 30 seconds after they start using the site; can be
//                  closed with "Later" and is not shown again in this
//                  browser session.
//   • "required" — opened by a Generate button when there is still no
//                  number; the generation continues after Save and is
//                  cancelled if the popup is closed.

const DISMISSED_KEY = "af_phone_prompt_dismissed";

function wasDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* private mode — the popup may show again after a reload */
  }
}

export default function PhonePromptPopup() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [mode, setMode] = useState<"soft" | "required" | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasPhone = profileHasPhone(profile);
  const profileLoaded = Boolean(user && profile);

  // Soft popup: 30 seconds after the profile is known to have no number.
  useEffect(() => {
    if (loading || !profileLoaded || hasPhone || mode) return;
    if (wasDismissed()) return;
    const timer = setTimeout(() => {
      setMode((current) => current ?? "soft");
    }, PHONE_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, profileLoaded, hasPhone, mode]);

  // Required popup: a Generate button asked for the number.
  useEffect(() => {
    const open = () => {
      setError("");
      setMode("required");
    };
    window.addEventListener(PHONE_REQUIRED_EVENT, open);
    return () => window.removeEventListener(PHONE_REQUIRED_EVENT, open);
  }, []);

  // Never leave a Generate button waiting if this component goes away.
  useEffect(() => () => settlePhoneRequest(false), []);

  if (!mode || !user) return null;
  // The number arrived some other way while the soft popup was open.
  if (mode === "soft" && hasPhone) return null;

  const required = mode === "required";

  const handleSave = async () => {
    const clean = cleanIndianMobile(phone);
    if (!clean) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase
      .from("profiles")
      .update({ phone: clean })
      .eq("id", user.id);
    if (saveError) {
      console.error("Phone save error:", saveError);
      setError("Could not save the number. Please try again.");
      setSaving(false);
      return;
    }
    await refreshProfile();
    setSaving(false);
    setMode(null);
    setPhone("");
    settlePhoneRequest(true);
  };

  const handleClose = () => {
    if (required) settlePhoneRequest(false);
    else rememberDismissed();
    setMode(null);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[998] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add your mobile number"
        className="relative z-10 w-full max-w-sm animate-in slide-in-from-bottom-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900"
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>

        <div className="mb-2 text-3xl">📱</div>
        <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
          {required ? "Add your mobile number to generate" : "Add your WhatsApp number"}
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {required
            ? "We need your mobile number once before your first image. Save it and your generation starts right away."
            : "Get your results and support on WhatsApp. Enter it once — we won't ask again."}
        </p>

        <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 dark:border-gray-700 dark:bg-gray-800">
          <span className="text-sm font-semibold text-gray-500">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saving && phone.length === 10) void handleSave();
            }}
            placeholder="10-digit mobile number"
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>
        <p className="mb-3 min-h-[1.25rem] text-xs text-cyan-700 dark:text-cyan-300" aria-live="polite">
          {error}
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {required ? "Cancel" : "Later"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || phone.length < 10}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : required ? "Save & generate" : "Save ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
