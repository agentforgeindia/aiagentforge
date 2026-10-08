"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import { GENERATION_COMPLETED_EVENT } from "@/lib/analytics";
import {
  PHONE_AFTER_IMAGE_DELAY_MS,
  PHONE_REQUIRED_EVENT,
  type PhoneReason,
  cleanIndianMobile,
  hasCompletedImage,
  profileHasPhone,
  settlePhoneRequest,
} from "@/lib/phoneGate";

// Asks a signed-in user for their mobile number (rules in lib/phoneGate.ts):
//   • "soft"     — optional, only after the customer has a successful
//                  image: a few seconds after one finishes, or on a later
//                  visit if they already have one. "Later" closes it and
//                  it is not shown again in this browser session.
//   • "required" — opened by a step that needs the number (buying a
//                  plan, a service request); the step continues after
//                  Save and is cancelled if the popup is closed.
// It is never shown before or at Generate.

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
  const [reason, setReason] = useState<PhoneReason>("billing");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasPhone = profileHasPhone(profile);
  const profileLoaded = Boolean(user && profile);

  // Soft popup — only once the customer has a successful image.
  const canOffer = !loading && profileLoaded && !hasPhone;
  const userId = user?.id ?? null;

  // (a) an image just finished on this page.
  useEffect(() => {
    if (!canOffer) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onImage = () => {
      if (wasDismissed()) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMode((current) => current ?? "soft"), PHONE_AFTER_IMAGE_DELAY_MS);
    };
    window.addEventListener(GENERATION_COMPLETED_EVENT, onImage);
    return () => {
      window.removeEventListener(GENERATION_COMPLETED_EVENT, onImage);
      if (timer) clearTimeout(timer);
    };
  }, [canOffer]);

  // (b) a returning customer who already has a finished image.
  useEffect(() => {
    if (!canOffer || !userId || wasDismissed()) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void hasCompletedImage(userId).then((has) => {
      if (cancelled || !has) return;
      timer = setTimeout(() => {
        if (!wasDismissed()) setMode((current) => current ?? "soft");
      }, PHONE_AFTER_IMAGE_DELAY_MS);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [canOffer, userId]);

  // Required popup: billing or a service request asked for the number.
  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: PhoneReason }>).detail;
      setReason(detail?.reason === "service" ? "service" : "billing");
      setError("");
      setMode("required");
    };
    window.addEventListener(PHONE_REQUIRED_EVENT, open);
    return () => window.removeEventListener(PHONE_REQUIRED_EVENT, open);
  }, []);

  // Never leave a waiting step hanging if this component goes away.
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
          {required
            ? reason === "service"
              ? "Add your mobile number for this request"
              : "Add your mobile number for billing"
            : "Add your WhatsApp number (optional)"}
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {required
            ? reason === "service"
              ? "Our team contacts you on this number about your request. Save it and we continue."
              : "It goes on your invoice and is used for payment and support messages. Save it and your payment continues."
            : "Your first image is ready. Add a number if you want results and support on WhatsApp — you can skip this."}
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
            {saving ? "Saving..." : required ? "Save & continue" : "Save ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
