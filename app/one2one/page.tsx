"use client";

// ============================================================
// /one2one — public meeting booking page. Visitors pick a slot
// (Mon-Sat, 11 AM – 7 PM IST, 30 min) → a Zoom meeting is created
// and the admin gets a notification.
// ============================================================

import { useEffect, useState } from "react";

type Slot = { time: string; iso: string; label: string };
const TYPES = ["Demo", "Sales Call", "Consultation", "Workshop", "Other"];

function todayIso() {
  const d = new Date();
  const ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
  return ist.toISOString().slice(0, 10);
}

export default function One2OnePage() {
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<Slot[]>([]);
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

  useEffect(() => {
    setPicked(null);
    setLoadingSlots(true);
    fetch(`/api/meetings/slots?date=${date}`)
      .then((r) => r.json())
      .then((j) => {
        setSlots(j.slots || []);
        setClosed(Boolean(j.closed));
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  const book = async () => {
    if (!picked) return;
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      alert("Please enter your name and email or phone.");
      return;
    }
    setBooking(true);
    try {
      const res = await fetch("/api/meetings/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, time: picked.time, name, email, phone, meeting_type: type, notes,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Booking failed. Please try another slot.");
        // refresh slots in case of clash
        fetch(`/api/meetings/slots?date=${date}`).then((r) => r.json()).then((d) => setSlots(d.slots || []));
        setPicked(null);
        return;
      }
      setDone({ join_url: j.join_url, start_time: j.start_time });
    } finally {
      setBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8fbff] via-[#eef8ff] to-[#fffaf2] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <img src="/af-logo.png" alt="AgentForge" className="mx-auto h-12 w-auto" />
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Book a 1-on-1 Meeting
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Mon–Sat · 11:00 AM – 7:00 PM IST · 30 minutes · on Zoom
          </p>
        </div>

        {done ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
            <h2 className="mt-4 text-2xl font-black">Meeting booked!</h2>
            <p className="mt-2 text-sm text-slate-600">
              {new Date(done.start_time).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </p>
            <a
              href={done.join_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg"
            >
              📹 Join Zoom Link
            </a>
            <p className="mt-4 text-xs text-slate-500">
              Save this link — we&apos;ll also reach out on your email/phone.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            {/* Date */}
            <label className="block text-xs font-black uppercase tracking-widest text-cyan-600">
              Pick a date
            </label>
            <input
              type="date"
              value={date}
              min={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />

            {/* Slots */}
            <p className="mt-5 text-xs font-black uppercase tracking-widest text-cyan-600">
              Available slots
            </p>
            <div className="mt-3 min-h-[60px]">
              {loadingSlots ? (
                <p className="text-sm text-slate-500">Loading slots…</p>
              ) : closed ? (
                <p className="text-sm text-slate-500">Closed on Sundays — please pick another day.</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-500">No slots left for this date. Try another day.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s.iso}
                      type="button"
                      onClick={() => setPicked(s)}
                      className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${
                        picked?.iso === s.iso
                          ? "border-cyan-500 bg-cyan-500 text-white shadow"
                          : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            {picked && (
              <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                <p className="text-sm font-bold">
                  Selected: <span className="text-cyan-600">{picked.label}</span> ·{" "}
                  {new Date(picked.iso).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none" />
                  <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none">
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none" />
                </div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What do you want to discuss? (optional)" rows={2} className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none" />
                <button
                  type="button"
                  onClick={book}
                  disabled={booking}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-6 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg disabled:opacity-60"
                >
                  {booking ? "Booking…" : "Confirm & Book Meeting"}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Powered by AgentForge AI · Meeting on Zoom
        </p>
      </div>
    </main>
  );
}
