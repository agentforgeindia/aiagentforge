"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";

// Shows after IDLE_MS if user is logged in but has no phone number.
const IDLE_MS = 3 * 60 * 1000; // 3 minutes

export default function PhonePromptPopup() {
  const { user, profile, refreshProfile } = useAuth();
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const hasPhone = Boolean(
    profile?.phone || profile?.mobile || profile?.phone_number,
  );

  useEffect(() => {
    if (!user || hasPhone || dismissed) return;

    const timer = setTimeout(() => {
      // Re-check: maybe user added phone in the meantime
      if (!hasPhone && !dismissed) setShow(true);
    }, IDLE_MS);

    return () => clearTimeout(timer);
  }, [user, hasPhone, dismissed]);

  if (!show || !user || hasPhone) return null;

  const handleSave = async () => {
    const clean = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(clean)) {
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: clean })
      .eq("id", user.id);

    if (error) {
      console.error("Phone save error:", error);
      alert("Save failed. Please try again.");
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    setShow(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[998] flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      <div className="relative z-10 w-full max-w-sm animate-in slide-in-from-bottom-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>

        <div className="mb-2 text-3xl">📱</div>
        <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
          Add your WhatsApp number
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          A phone number is required to generate images. Enter it once — we won&apos;t ask again.
        </p>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 dark:border-gray-700 dark:bg-gray-800">
          <span className="text-sm font-semibold text-gray-500">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit mobile number"
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Later
          </button>
          <button
            onClick={handleSave}
            disabled={saving || phone.length < 10}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
