"use client";

// ============================================================
// /book-meeting — premium public meeting booking page.
// Home-style theme + doodles, inline calendar, seat-style slots.
// Creates a Zoom meeting + notifies the admin. (Replaces /one2one.)
// ============================================================

import { useEffect, useMemo, useState } from "react";

type Slot = {
  time: string;
  iso: string;
  label: string;
  available: boolean;
  taken: boolean;
  past: boolean;
};
const TYPES = ["Demo", "Sales Call", "Consultation", "Workshop", "Other"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function istToday() {
  const n = new Date();
  const ist = new Date(n.getTime() + (330 + n.getTimezoneOffset()) * 60000);
  return { y: ist.getFullYear(), m: ist.getMonth(), d: ist.getDate() };
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BookMeetingPage() {
  const today = useMemo(istToday, []);
  const [cursor, setCursor] = useState({ y: today.y, m: today.m });
  const [selected, setSelected] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [avail, setAvail] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [closed, setClosed] = useState(false);
  const [picked, setPicked] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("Demo");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState<{ join_url: string; start_time: string } | null>(null);

  // Calendar grid for the cursor month.
  const grid = useMemo(() => {
    const first = new Date(Date.UTC(cursor.y, cursor.m, 1)).getUTCDay();
    const days = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
    const cells: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const todayStr = ymd(today.y, today.m, today.d);
  const isPastDay = (d: number) => ymd(cursor.y, cursor.m, d) < todayStr;
  const isSunday = (d: number) =>
    new Date(Date.UTC(cursor.y, cursor.m, d)).getUTCDay() === 0;

  useEffect(() => {
    if (!selected) return;
    setPicked(null);
    setLoadingSlots(true);
    fetch(`/api/meetings/slots?date=${selected}`)
      .then((r) => r.json())
      .then((j) => {
        setSlots(j.slots || []);
        setAvail(j.available || 0);
        setClosed(Boolean(j.closed));
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selected]);

  const prevMonth = () => {
    const m = cursor.m - 1;
    setCursor(m < 0 ? { y: cursor.y - 1, m: 11 } : { y: cursor.y, m });
  };
  const nextMonth = () => {
    const m = cursor.m + 1;
    setCursor(m > 11 ? { y: cursor.y + 1, m: 0 } : { y: cursor.y, m });
  };
  const atCurrentMonth = cursor.y === today.y && cursor.m === today.m;

  const book = async () => {
    if (!picked) return;
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      alert("Please enter your name and email or phone.");
      return;
    }
    setBooking(true);
    try {
      // 1. Create a ₹99 order.
      const oRes = await fetch("/api/meetings/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selected, time: picked.time }),
      });
      const o = await oRes.json();
      if (!oRes.ok || !o.order_id) {
        alert(o.error || "Could not start payment. Please try again.");
        return;
      }
      // 2. Load Razorpay checkout.
      const ok = await loadRazorpay();
      if (!ok) {
        alert("Payment could not load. Check your internet and try again.");
        return;
      }
      // 3. Open checkout → on success, verify + book.
      const rzp = new (window as any).Razorpay({
        key: o.key_id,
        order_id: o.order_id,
        amount: o.amount * 100,
        currency: "INR",
        name: "AgentForge Meeting",
        description: `${type} · ${picked.label}`,
        image: "/af-logo.png",
        prefill: { name, email, contact: phone },
        theme: { color: "#0ea5e9" },
        handler: async (resp: any) => {
          const bRes = await fetch("/api/meetings/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: selected, time: picked.time, name, email, phone, meeting_type: type, notes,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const j = await bRes.json();
          if (!bRes.ok) {
            alert(j.error || "Payment done but booking failed — contact support with your payment id.");
            fetch(`/api/meetings/slots?date=${selected}`).then((r) => r.json()).then((d) => { setSlots(d.slots || []); setAvail(d.available || 0); });
            return;
          }
          setDone({ join_url: j.join_url, start_time: j.start_time });
        },
        modal: { ondismiss: () => setBooking(false) },
      });
      rzp.open();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const cardCls = "border-black/10 bg-white/75 shadow-xl shadow-black/5 backdrop-blur";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f8fbff] px-4 py-10 text-slate-950">
      {/* ===== Premium home-style background + doodles ===== */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee22,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf622,transparent_35%),radial-gradient(circle_at_bottom,#f59e0b18,transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef8ff_55%,#fffaf2_100%)]" />
        <div className="absolute inset-0 opacity-[0.12]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bmGrid" width="90" height="90" patternUnits="userSpaceOnUse">
                <path d="M0 45H90M45 0V90" stroke="#0ea5e9" strokeWidth="1" opacity="0.35" />
                <circle cx="45" cy="45" r="3.5" fill="#8b5cf6" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bmGrid)" />
          </svg>
        </div>
        <style jsx global>{`
          @keyframes bmFloat {
            0% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(20px, -18px) rotate(6deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
        `}</style>
        {[
          { i: "📅", l: "6%", t: "14%" }, { i: "🗓️", l: "20%", t: "70%" },
          { i: "📹", l: "82%", t: "20%" }, { i: "🤝", l: "70%", t: "78%" },
          { i: "💼", l: "12%", t: "44%" }, { i: "✨", l: "88%", t: "55%" },
          { i: "☎️", l: "44%", t: "8%" }, { i: "⏰", l: "55%", t: "88%" },
        ].map((x, n) => (
          <div
            key={n}
            className="absolute rounded-[1.4rem] bg-white/70 p-3 text-3xl shadow-xl backdrop-blur-md"
            style={{ left: x.l, top: x.t, animation: `bmFloat ${9 + n}s ease-in-out infinite`, animationDelay: `${n * 0.6}s` }}
          >
            {x.i}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src="/af-logo.png" alt="AgentForge" className="mx-auto h-12 w-auto" />
          <div className="mt-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700">
            Online · Zoom Meeting
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Book a{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text text-transparent">
              Meeting
            </span>
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Mon–Sat · 11:00 AM – 7:00 PM IST · 30-minute slots · live on Zoom · ₹99
          </p>
        </div>

        {done ? (
          <div className={`rounded-[2rem] border ${cardCls} mx-auto max-w-xl p-8 text-center`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl">✓</div>
            <h2 className="mt-4 text-2xl font-black">You&apos;re booked! 🎉</h2>
            <p className="mt-2 text-sm font-bold text-slate-600">
              {new Date(done.start_time).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </p>
            <a href={done.join_url} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-xl">
              📹 Join Zoom Link
            </a>
            <p className="mt-4 text-xs font-medium text-slate-500">Save this link — we&apos;ll also reach out on your email/phone.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* ===== Calendar ===== */}
            <div className={`rounded-[2rem] border ${cardCls} p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-black">{MONTHS[cursor.m]} {cursor.y}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={prevMonth} disabled={atCurrentMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30">‹</button>
                  <button type="button" onClick={nextMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">›</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase tracking-wide text-slate-400">
                {WD.map((w) => <div key={w} className="py-1">{w[0]}</div>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {grid.map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const ds = ymd(cursor.y, cursor.m, d);
                  const disabled = isPastDay(d) || isSunday(d);
                  const isSel = selected === ds;
                  const isToday = ds === todayStr;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelected(ds)}
                      className={`aspect-square rounded-xl text-sm font-bold transition ${
                        isSel
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg"
                          : disabled
                            ? "cursor-not-allowed text-slate-300"
                            : `text-slate-700 hover:bg-cyan-50 ${isToday ? "ring-2 ring-cyan-300" : ""}`
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] font-semibold text-slate-400">Sundays closed · past dates disabled</p>
            </div>

            {/* ===== Slots (seats) ===== */}
            <div className={`rounded-[2rem] border ${cardCls} p-6`}>
              {!selected ? (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                  <span className="text-4xl">📅</span>
                  <p className="mt-3 text-sm font-bold text-slate-500">Pick a date to see available seats</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black">
                      {new Date(selected + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700">
                      {avail} seats left
                    </span>
                  </div>
                  {loadingSlots ? (
                    <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
                  ) : closed ? (
                    <p className="py-10 text-center text-sm text-slate-500">Closed on Sundays.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map((s) => (
                        <button
                          key={s.iso}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setPicked(s)}
                          className={`flex flex-col items-center rounded-xl border px-2 py-2.5 text-center transition ${
                            picked?.iso === s.iso
                              ? "border-cyan-500 bg-cyan-500 text-white shadow"
                              : s.available
                                ? "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                                : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through"
                          }`}
                        >
                          <span className="text-sm font-black">{s.label}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${picked?.iso === s.iso ? "text-white/80" : s.available ? "text-emerald-600" : "text-slate-300"}`}>
                            {s.available ? "1 seat" : s.taken ? "Booked" : "—"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ===== Details form ===== */}
            {picked && (
              <div className={`rounded-[2rem] border ${cardCls} p-6 lg:col-span-2`}>
                <p className="mb-4 text-sm font-black">
                  Selected:{" "}
                  <span className="text-cyan-600">
                    {picked.label} · {new Date(selected + "T12:00:00").toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
                  <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none">
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
                </div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What would you like to discuss? (optional)" rows={2} className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none" />
                <button type="button" onClick={book} disabled={booking}
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-violet-500/25 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60">
                  {booking ? "Processing…" : "Pay ₹99 & Book Meeting →"}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          Powered by AgentForge AI · Secure meeting on Zoom
        </p>
      </div>
    </main>
  );
}
