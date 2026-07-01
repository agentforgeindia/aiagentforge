"use client";

// ============================================================
// /admin/meetings — schedule Zoom meetings + see all bookings.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarClock, Pencil, RefreshCw, ShieldCheck, Trash2, Video, X } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Meeting = {
  id: string;
  topic: string;
  meeting_type: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  start_time: string;
  duration: number;
  join_url: string | null;
  status: string;
  source: string;
};

const TYPES = ["Demo", "Sales Call", "Consultation", "Workshop", "Other"];
const DURATIONS = [15, 30, 45, 60];

export default function AdminMeetingsPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } = useAdminPermissions();
  const canView = has("leads.view") || isAdmin;

  const [rows, setRows] = useState<Meeting[]>([]);
  const [zoomReady, setZoomReady] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [topic, setTopic] = useState("");
  const [type, setType] = useState("Demo");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const token = useMemo(
    () => async () => (await supabase.auth.getSession()).data.session?.access_token ?? "",
    [],
  );

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const res = await fetch("/api/admin/meetings", {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const json = await res.json();
      if (json.ok) {
        setRows(json.meetings as Meeting[]);
        setZoomReady(json.zoomReady !== false);
      }
      setLoadingRows(false);
    })();
  }, [canView, refreshKey, token]);

  // Convert an ISO start_time to the "YYYY-MM-DDTHH:mm" value a datetime-local
  // input expects, rendered in IST.
  const toLocalInputIST = (iso: string): string => {
    const d = new Date(iso);
    const ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${ist.getFullYear()}-${p(ist.getMonth() + 1)}-${p(ist.getDate())}T${p(ist.getHours())}:${p(ist.getMinutes())}`;
  };

  const startEdit = (m: Meeting) => {
    setEditingId(m.id);
    setTopic(m.topic || "");
    setType(m.meeting_type || "Demo");
    setName(m.name || "");
    setEmail(m.email || "");
    setPhone(m.phone || "");
    setStartTime(toLocalInputIST(m.start_time));
    setDuration(m.duration || 30);
    setNotes("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTopic(""); setName(""); setEmail(""); setPhone(""); setStartTime(""); setNotes(""); setDuration(30);
  };

  const schedule = async () => {
    if (!topic.trim() || !startTime) {
      alert("Topic aur date/time zaroori hai.");
      return;
    }
    setPosting(true);
    try {
      const editing = Boolean(editingId);
      const res = await fetch("/api/admin/meetings", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({
          ...(editing ? { id: editingId } : {}),
          topic, meeting_type: type, name, email, phone,
          start_time: startTime, duration, notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || (editing ? "Could not update." : "Could not schedule."));
        return;
      }
      setEditingId(null);
      setTopic(""); setName(""); setEmail(""); setPhone(""); setStartTime(""); setNotes(""); setDuration(30);
      setRefreshKey((k) => k + 1);
    } finally {
      setPosting(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm("Cancel this meeting? (Zoom se bhi delete hogi)")) return;
    await fetch(`/api/admin/meetings?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await token()}` },
    });
    setRefreshKey((k) => k + 1);
  };

  if (loadingAuth)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500">
        Checking access...
      </main>
    );
  if (!authEmail || !isAdmin || !canView)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
        </div>
      </main>
    );

  return (
    <AdminShell
      doodleType="tasks"
      breadcrumbs={[{ label: "Meetings" }]}
      title="Meetings"
      subtitle="Schedule Zoom meetings and see all bookings"
      email={authEmail}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {!zoomReady && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-700">
          Zoom not configured — set ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET / ZOOM_HOST_EMAIL on the server.
        </div>
      )}

      {/* Composer */}
      <div className={`${adminCardCls} space-y-3 p-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Meeting topic (e.g. Product demo for Rajesh)" className={adminInputCls} />
          <select value={type} onChange={(e) => setType(e.target.value)} className={adminInputCls}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" className={adminInputCls} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Customer email" className={adminInputCls} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Customer phone" className={adminInputCls} />
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={adminInputCls} />
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={adminInputCls}>
            {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className={`${adminInputCls} resize-none`} />
        <div className="flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={cancelEdit} disabled={posting} className={adminSecondaryBtnCls}>
              <X className="h-4 w-4" /> Cancel edit
            </button>
          )}
          <button type="button" onClick={schedule} disabled={posting || !zoomReady} className={adminPrimaryBtnCls}>
            <CalendarClock className="h-4 w-4" />
            {posting
              ? (editingId ? "Updating…" : "Scheduling…")
              : (editingId ? "Update Meeting" : "Schedule Zoom Meeting")}
          </button>
        </div>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No meetings yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {m.topic}
                    {m.meeting_type && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{m.meeting_type}</span>}
                    {m.status === "cancelled" && <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Cancelled</span>}
                    {m.source === "public" && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">Paid · Self-booked</span>}
                    {m.source === "zoom" && <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">Zoom</span>}
                  </p>
                  <p className={`mt-0.5 text-xs ${adminMutedCls}`}>
                    {new Date(m.start_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} · {m.duration} min
                    {m.name ? ` · ${m.name}` : ""}{m.phone ? ` · ${m.phone}` : ""}
                  </p>
                </div>
                {m.join_url && m.status !== "cancelled" && (
                  <a href={m.join_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500">
                    <Video className="h-3.5 w-3.5" /> Join
                  </a>
                )}
                {m.status !== "cancelled" && (
                  <button type="button" onClick={() => startEdit(m)} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-500/10 dark:text-white/60" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {m.status !== "cancelled" && (
                  <button type="button" onClick={() => cancel(m.id)} className="shrink-0 rounded-lg p-2 text-rose-500 hover:bg-rose-500/10" aria-label="Cancel">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
