"use client";

// ============================================================
// CheckInGate — strict attendance lock for the admin panel.
// Until the member is checked in (and not on a break) the page
// content is replaced by this screen, so no work can be done.
// The founder is exempt.
// ============================================================

import { useState } from "react";
import { Coffee, Loader2, LogIn, Moon, Play } from "lucide-react";
import { requestCheckIn, requestEndBreak, type AttStatus } from "./AttendanceTimer";
import { useAdminLang } from "./i18n";

export default function CheckInGate({ status, name }: { status: AttStatus; name: string }) {
  const { t } = useAdminLang();
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "unknown") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> {t("checkingStatus")}
      </div>
    );
  }

  const onBreak = status === "break";
  const idle = status === "idle";

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-6">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-30px_rgba(2,13,35,0.35)]">
        <div className="h-1.5 bg-gradient-to-r from-[#3C68FA] via-[#9B58FC] to-[#FD6D08]" />
        <div className="p-7 text-center sm:p-8">
          <span
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
              onBreak ? "bg-amber-50 text-amber-600" : idle ? "bg-rose-50 text-rose-600" : "bg-violet-50 text-violet-600"
            }`}
          >
            {onBreak ? <Coffee className="h-7 w-7" /> : idle ? <Moon className="h-7 w-7" /> : <LogIn className="h-7 w-7" />}
          </span>
          <p className="mt-4 text-sm text-slate-500">Hi {name} 👋</p>
          <h2 className="mt-1 text-xl font-semibold text-[#020D23]">
            {onBreak ? t("gateBreakTitle") : idle ? t("gateIdleTitle") : t("gateTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {onBreak ? t("gateBreakText") : idle ? t("gateIdleText") : t("gateText")}
          </p>

          {!onBreak && (
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={2}
              placeholder={t("todayPlan")}
              className="mt-5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            />
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              if (onBreak) requestEndBreak();
              else requestCheckIn(plan.trim());
              window.setTimeout(() => setBusy(false), 4000);
            }}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 ${
              onBreak ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : onBreak ? <Play className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {onBreak ? t("endBreak") : t("checkIn")}
          </button>
        </div>
      </div>
    </div>
  );
}
