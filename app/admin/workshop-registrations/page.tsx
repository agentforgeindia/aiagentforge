"use client";

// ============================================================
// /admin/workshop-registrations — paid workshop attendees from
// Razorpay (leads + purchases): email, phone, amount, payment id.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays, Download, IndianRupee, RefreshCw, Search, ShieldCheck, Ticket } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { useAdminPermissions } from "../AdminPermissions";
import { resendWhatsAppLink } from "@/lib/workshopPages";

type FailedRow = {
  payment_id: string;
  email: string | null;
  phone: string | null;
  created_at: number;
  slot: string | null;
};

type RegRow = {
  id: string;
  slot_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  amount: number | null;
  status: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  call_status: string | null;
  call_notes: string | null;
  promoted: boolean | null;
  community_joined: boolean | null;
};

type SlotRow = {
  slot_id: string;
  label: string;
  seats_filled: number;
  max_seats: number;
};

const CALL_STATUSES = [
  "New",
  "Connected",
  "Interested",
  "Demo Pending",
  "Purchased",
  "Callback",
  "Not Interested",
  "No Answer",
];

// Plan purchases made via a Razorpay Payment Page (no in-app userId, so the
// webhook files them here). These are NOT ₹99 workshop tickets — they get
// their own "Plan Purchases" tab, kept out of the workshop attendee lists.
const PLAN_AMOUNTS: Record<number, string> = {
  1999: "Starter",
  9999: "Pro Creator",
  39999: "Empire",
};
const planNameForAmount = (amount: number | null): string | null =>
  amount != null ? PLAN_AMOUNTS[Number(amount)] ?? null : null;

// A distinct colour per slot/date so each group is instantly recognisable.
// (Static class strings — Tailwind can't see runtime-built names.)
type GroupColor = { ring: string; head: string; soft: string; text: string };
const PALETTE: GroupColor[] = [
  { ring: "border-l-cyan-500",    head: "from-cyan-500 to-blue-600",     soft: "bg-cyan-50 dark:bg-cyan-500/15",    text: "text-cyan-700 dark:text-cyan-300" },
  { ring: "border-l-violet-500",  head: "from-violet-500 to-purple-600", soft: "bg-violet-50 dark:bg-violet-500/15", text: "text-violet-700 dark:text-violet-300" },
  { ring: "border-l-emerald-500", head: "from-emerald-500 to-teal-600",  soft: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" },
  { ring: "border-l-amber-500",   head: "from-amber-500 to-orange-600",  soft: "bg-amber-50 dark:bg-amber-500/15",  text: "text-amber-700 dark:text-amber-300" },
  { ring: "border-l-rose-500",    head: "from-rose-500 to-pink-600",     soft: "bg-rose-50 dark:bg-rose-500/15",    text: "text-rose-700 dark:text-rose-300" },
  { ring: "border-l-blue-500",    head: "from-blue-500 to-indigo-600",   soft: "bg-blue-50 dark:bg-blue-500/15",    text: "text-blue-700 dark:text-blue-300" },
  { ring: "border-l-fuchsia-500", head: "from-fuchsia-500 to-pink-600",  soft: "bg-fuchsia-50 dark:bg-fuchsia-500/15", text: "text-fuchsia-700 dark:text-fuchsia-300" },
  { ring: "border-l-teal-500",    head: "from-teal-500 to-cyan-600",     soft: "bg-teal-50 dark:bg-teal-500/15",    text: "text-teal-700 dark:text-teal-300" },
];
// Neutral colour reserved for the catch-all "unassigned" bucket.
const UNASSIGNED_COLOR: GroupColor = {
  ring: "border-l-slate-400", head: "from-slate-500 to-slate-700",
  soft: "bg-slate-100 dark:bg-white/10", text: "text-slate-600 dark:text-slate-300",
};
function colorForKey(key: string): GroupColor {
  if (key === "unassigned") return UNASSIGNED_COLOR;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// WhatsApp community group per slot.
const SLOT_COMMUNITY: Record<string, string> = {
  "20-june": "https://chat.whatsapp.com/F4ZfEeVXEmv2NaTwe4aIbs",
  "21-june": "https://chat.whatsapp.com/FkvRQXy6x6AGZ82L83AY7l",
  "27-june": "https://chat.whatsapp.com/H28rLyxfhXp6ieRc0tlytB",
  "28-june": "https://chat.whatsapp.com/J3MK8J1bEHNJOdoFzYuv6s",
  "1-july": "https://chat.whatsapp.com/ISdvRNftrmZE0Ofab1950h",
  "5-july": "https://chat.whatsapp.com/IZ164dIxs462nOgWvGglAh",
};

// wa.me deep link to message a registrant their slot's community link.
function communityWaLink(phone: string, slotId: string, name: string | null): string {
  const link = SLOT_COMMUNITY[slotId];
  if (!link || !phone) return "";
  const clean = String(phone).replace(/\D/g, "").replace(/^0+/, "");
  const num = clean.length === 10 ? "91" + clean : clean;
  const msg = `Hi ${name || "there"}! Your AgentForge Workshop registration is confirmed ✅\n\nJoin the workshop community group here:\n${link}\n\nSee you there! 🚀`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

// A slot's date has passed → the workshop is completed.
function slotIsPast(label: string): boolean {
  const m = (label || "").match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return false; // e.g. "Unassigned …" → treat as upcoming
  const d = new Date(`${m[1]} ${m[2]} ${m[3]} 23:59:59`);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

function formatDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminWorkshopRegistrationsPage() {
  const {
    loading: loadingAuth,
    isAdmin,
    email: authEmail,
    has,
  } = useAdminPermissions();
  const canView = has("customers.view");

  const [rows, setRows] = useState<RegRow[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("all");
  const [tab, setTab] = useState<"upcoming" | "completed" | "plans" | "failed" | "qr">("upcoming");

  // Failed/incomplete ₹99 payments (live from Razorpay).
  const [failedRows, setFailedRows] = useState<FailedRow[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [failedSel, setFailedSel] = useState<Record<string, string>>({});
  const [callEdits, setCallEdits] = useState<Record<string, { call_status: string; call_notes: string }>>({});

  const saveCall = async (id: string, patch: { call_status?: string; call_notes?: string }) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";
    await fetch("/api/admin/workshop-registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, ...patch }),
    }).catch(() => {});
  };

  // Mark a registrant as having joined (or not) the WhatsApp community.
  const saveCommunity = async (id: string, joined: boolean) => {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, community_joined: joined } : r)));
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";
    await fetch("/api/admin/workshop-registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, community_joined: joined }),
    }).catch(() => {});
  };

  // Failed payment paid via QR → mark as paid: creates a confirmed
  // registration in the chosen slot (persists, drops off the Failed list).
  const markPaid = async (f: FailedRow, slot: string) => {
    if (!slot) return alert("Pick the workshop date first.");
    if (!confirm("Mark this payment as PAID and add to the workshop?")) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch("/api/admin/workshop-failed", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_id: f.payment_id, slot, email: f.email, phone: f.phone }),
    });
    if (res.ok) setRefreshKey((k) => k + 1);
    else alert("Could not mark paid. Please try again.");
  };

  // Manually move a registration to a slot (date) — for unassigned / wrong ones.
  const saveSlot = async (id: string, slot_id: string) => {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, slot_id } : r)));
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";
    await fetch("/api/admin/workshop-registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, slot_id }),
    }).catch(() => {});
  };

  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const promoteLead = async (id: string) => {
    if (!confirm("Promote this attendee to a CRM lead?")) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch("/api/admin/workshop-registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setPromotedIds((p) => new Set(p).add(id));
    else alert("Could not promote to lead. Please try again.");
  };

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/workshop-registrations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        const regs = json.registrations as RegRow[];
        setRows(regs);
        setSlots((json.slots ?? []) as SlotRow[]);
        const map: Record<string, { call_status: string; call_notes: string }> = {};
        regs.forEach((r) => {
          map[r.id] = { call_status: r.call_status || "New", call_notes: r.call_notes || "" };
        });
        setCallEdits(map);
      }
      setLoadingRows(false);
    })();
  }, [canView, refreshKey]);

  // Failed payments load lazily when the Failed tab is opened.
  useEffect(() => {
    if (!canView || tab !== "failed") return;
    setLoadingFailed(true);
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token ?? "";
      const res = await fetch("/api/admin/workshop-failed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) setFailedRows(json.failed as FailedRow[]);
      setLoadingFailed(false);
    })();
  }, [canView, tab, refreshKey]);

  const slotLabel = useMemo(() => {
    const map: Record<string, string> = {};
    slots.forEach((s) => (map[s.slot_id] = s.label));
    return map;
  }, [slots]);

  const completedSlotIds = useMemo(() => {
    const s = new Set<string>();
    slots.forEach((sl) => { if (slotIsPast(sl.label)) s.add(sl.slot_id); });
    return s;
  }, [slots]);

  // A QR-code payment? (No real Razorpay order — order_id holds the payment id.)
  const isQR = (r: RegRow) =>
    planNameForAmount(r.amount) == null &&
    !String(r.razorpay_order_id || "").startsWith("order_");

  // Date dropdowns: Upcoming/QR/Failed show only upcoming dates (+ unassigned);
  // Completed shows only past dates. Past dates drop off the upcoming view.
  const slotOptions = useMemo(() => {
    if (tab === "completed") return slots.filter((s) => slotIsPast(s.label));
    return slots.filter((s) => s.slot_id === "unassigned" || !slotIsPast(s.label));
  }, [slots, tab]);

  // Real workshop dates only (for assigning a failed payment a date to resend).
  const assignableSlots = useMemo(
    () => slots.filter((s) => s.slot_id !== "unassigned" && !slotIsPast(s.label)),
    [slots],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (tab === "failed") return [];
    return rows.filter((r) => {
      const isPlan = planNameForAmount(r.amount) != null;
      const qr = isQR(r);
      // Each kind lives in its own tab.
      if (tab === "plans") {
        if (!isPlan) return false;
      } else if (tab === "qr") {
        if (!qr) return false;
      } else {
        // upcoming / completed — exclude plans and QR payments.
        if (isPlan || qr) return false;
        const completed = completedSlotIds.has(r.slot_id);
        if (tab === "completed" ? !completed : completed) return false;
      }
      if (tab !== "plans" && tab !== "qr" && slotFilter !== "all" && r.slot_id !== slotFilter) return false;
      if (q) {
        const hay =
          `${r.email ?? ""} ${r.phone ?? ""} ${r.name ?? ""} ${r.razorpay_payment_id ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, slotFilter, tab, completedSlotIds]);

  // Calling tally for the completed tab.
  const callTally = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((r) => {
      const s = callEdits[r.id]?.call_status || r.call_status || "New";
      m[s] = (m[s] || 0) + 1;
    });
    return m;
  }, [filtered, callEdits]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const revenue = filtered.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { total, revenue };
  }, [filtered]);

  // Group the filtered rows by date/slot (or plan, on the Plans tab) so each
  // bucket gets its own colour-coded card — no more guessing which entry
  // belongs to which date.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; color: GroupColor; rows: RegRow[]; total: number }
    >();
    filtered.forEach((r) => {
      const key =
        tab === "plans"
          ? planNameForAmount(r.amount) ?? "Plan"
          : r.slot_id;
      const label =
        tab === "plans"
          ? `${planNameForAmount(r.amount) ?? "Plan"} Plan`
          : slotLabel[r.slot_id] ?? r.slot_id;
      let g = map.get(key);
      if (!g) {
        g = { key, label, color: colorForKey(key), rows: [], total: 0 };
        map.set(key, g);
      }
      g.rows.push(r);
      g.total += Number(r.amount) || 0;
    });
    return Array.from(map.values());
  }, [filtered, tab, slotLabel]);

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access...
      </main>
    );
  }
  if (!authEmail || !isAdmin || !canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>customers.view</code>{" "}
            permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="customers"
      breadcrumbs={[{ label: "Workshop Registrations" }]}
      title="Workshop Registrations"
      subtitle={`${stats.total} paid attendees · ₹${stats.revenue.toLocaleString("en-IN")} collected`}
      email={authEmail}
      actions={
        <>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className={adminSecondaryBtnCls}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() => {
              const headers = [
                "paid_at", "slot", "name", "email", "phone",
                "amount", "call_status", "call_notes",
                "razorpay_payment_id", "razorpay_order_id",
              ];
              const csvRows = filtered.map((r) => [
                r.created_at,
                slotLabel[r.slot_id] ?? r.slot_id,
                r.name,
                r.email,
                r.phone,
                r.amount,
                callEdits[r.id]?.call_status ?? r.call_status ?? "",
                callEdits[r.id]?.call_notes ?? r.call_notes ?? "",
                r.razorpay_payment_id,
                r.razorpay_order_id,
              ]);
              const ts = new Date().toISOString().slice(0, 10);
              downloadCsv(
                `workshop-registrations-${ts}.csv`,
                buildCsv(headers, csvRows),
              );
            }}
            className={adminSecondaryBtnCls}
            title="Download the filtered list as a CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </>
      }
    >
      {/* Seat counts per slot */}
      {slots.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((s) => {
            const c = colorForKey(s.slot_id);
            return (
              <div key={s.slot_id} className={`${adminCardCls} border-l-4 ${c.ring} p-3`}>
                <p className={`text-[11px] font-semibold ${c.text}`}>{s.label}</p>
                <p className="mt-1 text-lg font-bold">
                  {s.seats_filled}
                  <span className={`text-xs font-normal ${adminMutedCls}`}>
                    {" "}
                    / {s.max_seats} seats
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["upcoming", "completed", "plans", "qr", "failed"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              tab === t
                ? "bg-slate-900 text-white dark:bg-indigo-600"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {t === "upcoming"
              ? "Upcoming"
              : t === "completed"
                ? "Completed · Calling"
                : t === "plans"
                  ? "Plan Purchases"
                  : t === "qr"
                    ? "QR Payments"
                    : "Failed · Resend"}
          </button>
        ))}
      </div>

      {/* Calling tally — completed tab */}
      {tab === "completed" && Object.keys(callTally).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {CALL_STATUSES.filter((s) => callTally[s]).map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
              {s}: {callTally[s]}
            </span>
          ))}
        </div>
      )}

      {/* Filters (not on the Failed tab — that data is live from Razorpay) */}
      {tab !== "failed" && (
        <div className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row`}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, phone or payment id"
              className={`${adminInputCls} pl-9`}
            />
          </div>
          {tab !== "plans" && tab !== "qr" && (
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              className={`${adminInputCls} sm:max-w-[220px]`}
            >
              <option value="all">All dates</option>
              {slotOptions.map((s) => (
                <option key={s.slot_id} value={s.slot_id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Failed tab — live from Razorpay; pick a date and resend the link */}
      {tab === "failed" ? (
        loadingFailed ? (
          <div className={`${adminCardCls} mt-4 p-6 text-center text-sm ${adminMutedCls}`}>
            Loading from Razorpay…
          </div>
        ) : failedRows.length === 0 ? (
          <div className={`${adminCardCls} mt-4 p-8 text-center text-sm ${adminMutedCls}`}>
            No pending failed payments. 🎉
          </div>
        ) : (
          <div className={`${adminCardCls} mt-4`}>
            <p className={`px-4 pt-3 text-xs ${adminMutedCls}`}>
              Incomplete ₹99 payments (last 30 days; people who later paid are hidden). Pick the
              date, then tap Resend to WhatsApp them that slot’s payment page.
            </p>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {failedRows.map((f) => {
                const sel = failedSel[f.payment_id] || f.slot || "";
                return (
                  <li key={f.payment_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{f.email || f.phone || "—"}</p>
                      <p className={`truncate text-xs ${adminMutedCls}`}>
                        {f.phone || "no phone"} ·{" "}
                        {formatDateTime(new Date(f.created_at * 1000).toISOString())}
                      </p>
                    </div>
                    <select
                      value={sel}
                      onChange={(e) => setFailedSel((p) => ({ ...p, [f.payment_id]: e.target.value }))}
                      className="h-8 max-w-[150px] rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-[#11141a] dark:text-slate-200"
                    >
                      <option value="">Pick date…</option>
                      {assignableSlots.map((s) => (
                        <option key={s.slot_id} value={s.slot_id}>{s.label}</option>
                      ))}
                    </select>
                    {f.phone && sel ? (
                      <a
                        href={resendWhatsAppLink(f.phone, sel)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                      >
                        Resend on WhatsApp
                      </a>
                    ) : (
                      <span className="shrink-0 text-[11px] font-bold text-slate-400">
                        {f.phone ? "pick date" : "no phone"}
                      </span>
                    )}
                    {/* Paid via QR? Mark paid → adds a confirmed registration */}
                    <button
                      type="button"
                      onClick={() => markPaid(f, sel)}
                      disabled={!sel}
                      title="They paid via QR — mark as paid and add to the workshop"
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition ${
                        sel ? "bg-violet-600 hover:bg-violet-500" : "cursor-not-allowed bg-slate-300"
                      }`}
                    >
                      Mark Paid (QR)
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      ) : loadingRows ? (
        <div className={`${adminCardCls} mt-4`}>
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} mt-4`}>
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {rows.length === 0
              ? "No paid registrations yet."
              : "No registrations match the current filter."}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div
              key={g.key}
              className={`overflow-hidden rounded-xl border border-l-4 border-slate-200 ${g.color.ring} bg-white shadow-sm dark:border-slate-800 dark:bg-[#11141a]`}
            >
              {/* Colourful group header */}
              <div className={`flex items-center justify-between gap-3 bg-gradient-to-r ${g.color.head} px-4 py-2.5 text-white`}>
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm font-black tracking-tight">{g.label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold">
                    {g.rows.length} {g.rows.length === 1 ? "entry" : "entries"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold">
                    <IndianRupee className="h-3 w-3" />
                    {g.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Rows in this group */}
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {g.rows.map((r) => (
                  <li
                    key={r.id}
                    className="px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${g.color.soft} ${g.color.text}`}>
                        <Ticket className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {r.email || r.name || "—"}
                        </p>
                        <p className={`truncate text-xs ${adminMutedCls}`}>
                          {r.phone || "no phone"}
                          {r.razorpay_payment_id && (
                            <>
                              {" · "}
                              <a
                                href={`https://dashboard.razorpay.com/app/payments/${r.razorpay_payment_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-violet-600 hover:underline dark:text-violet-400"
                                title="Open this payment in Razorpay to see its page / date"
                              >
                                {r.razorpay_payment_id}
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="hidden text-center sm:block">
                        <p className={`text-[11px] font-bold ${g.color.text}`}>
                          {planNameForAmount(r.amount)
                            ? `${planNameForAmount(r.amount)} plan`
                            : slotLabel[r.slot_id] ?? r.slot_id}
                        </p>
                        <p className={`text-[11px] ${adminMutedCls}`}>
                          {formatDateTime(r.created_at)}
                        </p>
                      </div>
                      {!planNameForAmount(r.amount) && (
                        <select
                          value={r.slot_id}
                          onChange={(e) => saveSlot(r.id, e.target.value)}
                          title="Assign / change workshop date"
                          className="hidden h-8 max-w-[140px] shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-violet-400 sm:block dark:border-slate-700 dark:bg-[#11141a] dark:text-slate-200"
                        >
                          {/* current slot always selectable, plus the tab's options */}
                          {!slotOptions.some((s) => s.slot_id === r.slot_id) && (
                            <option value={r.slot_id}>{slotLabel[r.slot_id] ?? r.slot_id}</option>
                          )}
                          {slotOptions.map((s) => (
                            <option key={s.slot_id} value={s.slot_id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          className="hidden shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 sm:inline-block"
                        >
                          Call
                        </a>
                      )}
                      {r.phone && SLOT_COMMUNITY[r.slot_id] && (
                        <a
                          href={communityWaLink(r.phone, r.slot_id, r.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                          title="Send the community join link on WhatsApp"
                        >
                          Community
                        </a>
                      )}
                      {/* Manual "community joined" toggle / badge */}
                      <button
                        type="button"
                        onClick={() => saveCommunity(r.id, !r.community_joined)}
                        title={r.community_joined ? "Joined the community — click to undo" : "Mark as community joined"}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                          r.community_joined
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {r.community_joined ? "✓ Community joined" : "Mark joined"}
                      </button>
                      <div className="flex items-center gap-1 text-right font-bold text-emerald-600">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {Number(r.amount) || 0}
                      </div>
                    </div>

                    {tab === "completed" && (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={callEdits[r.id]?.call_status || "New"}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCallEdits((p) => ({ ...p, [r.id]: { call_status: v, call_notes: p[r.id]?.call_notes || "" } }));
                            saveCall(r.id, { call_status: v });
                          }}
                          className={`${adminInputCls} sm:max-w-[170px]`}
                        >
                          {CALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <input
                          value={callEdits[r.id]?.call_notes || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCallEdits((p) => ({ ...p, [r.id]: { call_status: p[r.id]?.call_status || "New", call_notes: v } }));
                          }}
                          onBlur={() => saveCall(r.id, { call_notes: callEdits[r.id]?.call_notes || "" })}
                          placeholder="Call notes — what did they say? (purchased / demo pending …)"
                          className={`${adminInputCls} flex-1`}
                        />
                        {r.promoted || promotedIds.has(r.id) ? (
                          <span className="shrink-0 rounded-lg bg-emerald-100 px-3 py-2 text-center text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            ✓ Lead
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => promoteLead(r.id)}
                            className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-violet-500"
                          >
                            Promote to Lead
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
