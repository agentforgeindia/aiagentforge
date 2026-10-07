"use client";

// "Have a referral code?" on the sign-up screen (Android app).
//
// On the website a friend arrives through a referral link and the
// code is saved without typing. Someone who installs the app from
// Play Store has no link, so they type the code here.
//
// The code is checked with /api/referral/check while typing and kept
// in localStorage (lib/referralClient.ts). The sign-up flows — email
// and Google — pick it up from there after the account is made.
//
// Render this only on the client (after app mode is known): it reads
// localStorage for its first value.

import { useEffect, useRef, useState } from "react";
import { Check, Gift } from "lucide-react";

import { REWARD_RULES, isReferralCodeShape, normalizeReferralCode } from "@/lib/referral";
import { readPendingReferralCode, savePendingReferralCode } from "@/lib/referralClient";

type Status =
  | "idle" // nothing typed
  | "kept" // a code was already waiting when the screen opened
  | "typing" // too short to check yet
  | "checking"
  | "valid"
  | "invalid"
  | "unknown"; // could not check now — tried after sign-up

export default function ReferralCodeField({
  inputClass,
  mutedClass,
  disabled,
}: {
  /** The form's own input classes, so the field matches it. */
  inputClass: string;
  mutedClass: string;
  disabled?: boolean;
}) {
  const [code, setCode] = useState(() => normalizeReferralCode(readPendingReferralCode() ?? ""));
  const [open, setOpen] = useState(() => code.length > 0);
  const [status, setStatus] = useState<Status>(() => (code ? "kept" : "idle"));
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(code);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const check = async (value: string) => {
    try {
      const res = await fetch(`/api/referral/check?code=${encodeURIComponent(value)}`, { cache: "no-store" });
      const json = (await res.json()) as { valid?: boolean | null };
      if (latest.current !== value) return; // the person kept typing
      if (json.valid === true) {
        savePendingReferralCode(value);
        setStatus("valid");
      } else if (json.valid === false) {
        savePendingReferralCode(null);
        setStatus("invalid");
      } else {
        savePendingReferralCode(value);
        setStatus("unknown");
      }
    } catch {
      if (latest.current !== value) return;
      // No internet for the check — keep the code, sign-up will try it.
      savePendingReferralCode(value);
      setStatus("unknown");
    }
  };

  const onChange = (raw: string) => {
    const value = normalizeReferralCode(raw).slice(0, 24);
    latest.current = value;
    setCode(value);
    window.clearTimeout(timer.current);

    if (!value) {
      savePendingReferralCode(null);
      setStatus("idle");
      return;
    }
    // Nothing is kept until the new code has been checked.
    savePendingReferralCode(null);
    if (!isReferralCodeShape(value)) {
      setStatus("typing");
      return;
    }
    setStatus("checking");
    timer.current = window.setTimeout(() => check(value), 450);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={`flex items-center gap-2 self-start rounded-full px-1 py-1 text-sm font-bold underline decoration-current/40 underline-offset-4 ${mutedClass}`}
      >
        <Gift className="h-4 w-4" />
        Have a referral code?
      </button>
    );
  }

  const hint: Record<Status, string> = {
    idle: `Enter your friend's code to get ${REWARD_RULES.friend} bonus credits.`,
    kept: "This code will be applied when you sign up.",
    typing: "Keep typing the full code.",
    checking: "Checking the code…",
    valid: `Code applied. You get ${REWARD_RULES.friend} bonus credits after sign up.`,
    invalid: "We could not find this code. Check it with your friend, or leave it empty.",
    unknown: "We will check this code when you sign up.",
  };
  const good = status === "valid";

  return (
    <div>
      <div className="relative">
        <Gift className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} />
        <input
          value={code}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`${inputClass} pr-11 font-semibold uppercase tracking-[0.12em] placeholder:font-normal placeholder:normal-case placeholder:tracking-normal`}
          placeholder="Referral code (optional)"
          aria-label="Referral code"
          aria-describedby="referral-code-hint"
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          maxLength={200}
        />
        {good && (
          <span className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p
        id="referral-code-hint"
        role="status"
        className={`mt-1.5 px-1 text-xs leading-5 ${good ? "font-bold text-emerald-600 dark:text-emerald-300" : status === "invalid" ? "font-bold" : mutedClass}`}
      >
        {hint[status]}
      </p>
    </div>
  );
}
