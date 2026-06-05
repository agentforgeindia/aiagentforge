"use client";

// ============================================================
// AttendanceTimer — top bar widget.
// Shows current session time. Click to check in/out.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Clock, LogIn, LogOut, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ActiveSession = {
  id: string;
  check_in: string;
  work_notes: string | null;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AttendanceTimer({ email }: { email: string }) {
  const [session, setSession]     = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed]     = useState(0);
  const [open, setOpen]           = useState(false);
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [onBreak, setOnBreak]     = useState<{ id: string; type: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const lastActivity = useRef<number>(Date.now());
  const sessionRef = useRef<ActiveSession | null>(null);
  const onBreakRef = useRef<boolean>(false);
  sessionRef.current = session;
  onBreakRef.current = Boolean(onBreak);

  const IDLE_MS = 10 * 60 * 1000; // 10 minutes

  // Load active session on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_my_active_session");
      if (data) {
        setSession(data as ActiveSession);
        setNotes(data.work_notes ?? "");
      } else {
        // Morning auto-popup — prompt to start session once per day.
        try {
          const key = `af_att_prompt_${new Date().toISOString().slice(0,10)}`;
          if (!localStorage.getItem(key)) { setOpen(true); localStorage.setItem(key, "1"); }
        } catch { /* ignore */ }
      }
      setInitialLoad(false);
    })();
  }, []);

  // Idle auto-logout — 10 min no activity (and not on break) ends session.
  useEffect(() => {
    const mark = () => { lastActivity.current = Date.now(); };
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const iv = window.setInterval(() => {
      if (sessionRef.current && !onBreakRef.current && Date.now() - lastActivity.current > IDLE_MS) {
        autoLogout();
      }
    }, 30000);
    return () => {
      ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((e) => window.removeEventListener(e, mark));
      clearInterval(iv);
    };
  }, []);

  async function autoLogout() {
    const s = sessionRef.current;
    if (!s) return;
    await supabase.from("attendance_logs")
      .update({ check_out: new Date().toISOString(), auto_logout: true })
      .eq("id", s.id);
    setSession(null);
    try { localStorage.setItem("af_att_autologout", "1"); } catch { /* ignore */ }
  }

  // Live timer
  useEffect(() => {
    if (!session) { setElapsed(0); return; }
    const update = () => {
      const secs = Math.floor((Date.now() - new Date(session.check_in).getTime()) / 1000);
      setElapsed(secs);
    };
    update();
    timerRef.current = window.setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function checkIn() {
    setLoading(true);
    const name = email.split("@")[0];

    // If the previous session was auto-logged-out (idle), ask why.
    let reloginReason: string | null = null;
    try {
      if (localStorage.getItem("af_att_autologout") === "1") {
        reloginReason = prompt("Aap session se 10+ min door the (auto logout). Reason batao (TL ko report jaayegi):") || "No reason given";
        localStorage.removeItem("af_att_autologout");
      }
    } catch { /* ignore */ }

    const { data, error } = await supabase
      .from("attendance_logs")
      .insert({ member_email: email, member_name: name, work_notes: notes || null, relogin_reason: reloginReason })
      .select("id, check_in, work_notes")
      .single();
    if (!error && data) {
      setSession(data as ActiveSession);
      lastActivity.current = Date.now();
      setOpen(false);
    }
    setLoading(false);
  }

  // ── Breaks ──
  async function startBreak(type: "lunch" | "tea") {
    if (!session) return;
    const { data } = await supabase.from("attendance_breaks")
      .insert({ log_id: session.id, member_email: email, break_type: type })
      .select("id").single();
    if (data) setOnBreak({ id: data.id, type });
  }
  async function endBreak() {
    if (!onBreak) return;
    await supabase.from("attendance_breaks").update({ ended_at: new Date().toISOString() }).eq("id", onBreak.id);
    setOnBreak(null);
    lastActivity.current = Date.now();
  }

  async function checkOut() {
    if (!session) return;
    setLoading(true);
    await supabase
      .from("attendance_logs")
      .update({ check_out: new Date().toISOString(), work_notes: notes || null })
      .eq("id", session.id);
    setSession(null);
    setNotes("");
    setOpen(false);
    setLoading(false);
  }

  async function updateNotes() {
    if (!session) return;
    await supabase
      .from("attendance_logs")
      .update({ work_notes: notes })
      .eq("id", session.id);
  }

  if (initialLoad) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition ${
          session
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
        }`}
        title={session ? `Online since ${new Date(session.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Check in"}
      >
        <Clock className="h-3.5 w-3.5" />
        {session ? (
          <span className="tabular-nums">{formatDuration(elapsed)}</span>
        ) : (
          <span className="hidden sm:inline">Check in</span>
        )}
        {session && <span className="hidden sm:inline text-emerald-500">●</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#11141a]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold">
                {session ? "Session Active" : "Start Session"}
              </p>
              {session && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-300">
                  Since {new Date(session.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}<span className="font-bold tabular-nums">{formatDuration(elapsed)}</span>
                </p>
              )}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Timer display */}
          {session && (
            <div className={`px-4 py-3 text-center ${onBreak ? "bg-amber-50 dark:bg-amber-500/5" : "bg-emerald-50 dark:bg-emerald-500/5"}`}>
              <p className={`text-3xl font-bold tabular-nums ${onBreak ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300"}`}>
                {formatDuration(elapsed)}
              </p>
              <p className={`mt-0.5 text-[11px] ${onBreak ? "text-amber-600/70 dark:text-amber-400/70" : "text-emerald-600/70 dark:text-emerald-400/70"}`}>
                {onBreak ? `On ${onBreak.type} break ☕` : "Total time online today"}
              </p>
            </div>
          )}

          {/* Break controls */}
          {session && (
            <div className="flex gap-2 border-t border-slate-200 px-4 py-2.5 dark:border-slate-800">
              {onBreak ? (
                <button type="button" onClick={endBreak}
                  className="flex-1 rounded-md bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500">
                  ▶ Resume Work
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => startBreak("lunch")}
                    className="flex-1 rounded-md border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-300">
                    🍽️ Lunch Break
                  </button>
                  <button type="button" onClick={() => startBreak("tea")}
                    className="flex-1 rounded-md border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-300">
                    ☕ Tea Break
                  </button>
                </>
              )}
            </div>
          )}

          {/* Work notes */}
          <div className="px-4 py-3">
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {session ? "What are you working on?" : "Today's plan"}
            </label>
            <textarea
              className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              rows={3}
              placeholder="e.g. Working on leads follow-up, fixing email bug..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            {session ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={updateNotes}
                  className="flex-1 rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Update Notes
                </button>
                <button
                  type="button"
                  onClick={checkOut}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {loading ? "Checking out…" : "Check Out"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={checkIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <LogIn className="h-3.5 w-3.5" />
                {loading ? "Checking in…" : "Check In"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
