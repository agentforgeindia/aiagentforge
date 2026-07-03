// FILE PATH: app/onsite-training/page.tsx
// Standalone conversion page (own header, no site nav/footer — see
// LayoutClient.tsx). AgentForge team visits a business's showroom/factory
// on one of 3 fixed dates and trains their staff to generate AI mockups.

"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

const TIME_SLOTS = [
  { id: "morning", label: "Morning", range: "10 AM – 12 PM" },
  { id: "afternoon", label: "Afternoon", range: "12 PM – 4 PM" },
  { id: "evening", label: "Evening", range: "4 PM – 7 PM" },
];

const INDUSTRY_TYPES = [
  "Textile Manufacturer", "Wholesaler", "Boutique", "Saree / Ladies Garments", "Garment Brand",
  "Uniform Manufacturer", "Fabric Trader", "Home Furnishing", "Other",
];

// Only 3 dates are open — one city per day, each anchored to a famous
// local landmark so the city is instantly recognisable.
const VISIT_DAYS = [
  { id: "pune", date: "2026-07-07", city: "Pune", landmark: "Shaniwar Wada" },
  { id: "satara", date: "2026-07-08", city: "Satara", landmark: "Ajinkyatara Fort" },
  { id: "kolhapur", date: "2026-07-09", city: "Kolhapur", landmark: "Mahalaxmi Temple" },
];

function formatVisitDate(iso: string) {
  const d = new Date(`${iso}T00:00:00+05:30`);
  return {
    weekday: d.toLocaleDateString("en-IN", { weekday: "long" }),
    label: d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
  };
}

const LEARN_ITEMS = [
  { img: "/icons/flat fabric layout.svg", title: "Upload & Organise Designs", desc: "The right way to upload fabric/product photos for clean AI output." },
  { img: "/icons/indian model.svg", title: "Generate AI Mockups Live", desc: "Your staff generates their first mockup on their own product, on the spot." },
  { img: "/icons/saree.svg", title: "Saree & Ladies Garments", desc: "Saree, kurti, lehenga and ladies wear mockups — draped and styled correctly." },
  { img: "/icons/female ware.svg", title: "Men / Women / Kids", desc: "One design, multiple categories and model looks." },
  { img: "/icons/custom look.svg", title: "Customise Your AI Model", desc: "Choose the model's pose and look, or add your own customer's photo into the catalogue shot." },
  { img: "/icons/luxury bedroom setup.svg", title: "Home Decor Mockups", desc: "Bedsheets, cushions, curtains, table covers and more." },
  { img: "/icons/mobile.svg", title: "WhatsApp Catalogue Export", desc: "Build a catalogue that's ready to share the same day." },
  { img: "/icons/photo studio setup.svg", title: "Instagram Creative Export", desc: "Post-ready visuals for social media, sized correctly." },
  { img: "/icons/folded fabeic stack.svg", title: "Daily Bulk Workflow", desc: "How to run this as a daily habit, not a one-time trick." },
  { img: "/icons/premium.svg", title: "Credits & Pricing Walkthrough", desc: "What it costs to run this in-house, month to month." },
];

const WHO_ITEMS = [
  { img: "/icons/rolled fabric.svg", label: "Textile Manufacturers" },
  { img: "/icons/saree.svg", label: "Saree & Ladies Garments" },
  { img: "/icons/folded fabeic stack.svg", label: "Wholesalers" },
  { img: "/icons/mannequin.svg", label: "Boutique Owners" },
  { img: "/icons/mens shirt.svg", label: "Garment Brands" },
  { img: "/icons/three piece suit.svg", label: "Uniform Manufacturers" },
  { img: "/icons/universal febric.svg", label: "Fabric Traders" },
  { img: "/icons/interior styled setup.svg", label: "Home Decor Brands" },
];

const VISIT_STEPS = [
  { step: "1", title: "Book your city & time", desc: "Pick one of the 3 open dates below — takes 2 minutes." },
  { step: "2", title: "We confirm on WhatsApp", desc: "Our team calls to confirm the exact time and what to keep ready." },
  { step: "3", title: "Trainer visits your showroom", desc: "We come to you — no travel, no studio booking." },
  { step: "4", title: "Hands-on training", desc: "Your staff generates mockups using your own products, live." },
  { step: "5", title: "Your first catalogue, same day", desc: "You walk away with real output, not just a demo." },
];

const FAQS = [
  { q: "Is the on-site visit really free?", a: "Yes. The training visit itself is free. You only pay if you decide to continue with an AgentForge plan afterwards." },
  { q: "How many staff can attend?", a: "As many as you'd like — just let us know the approximate number so we plan the session accordingly." },
  { q: "What should we keep ready?", a: "A few sample products/fabric photos, a laptop or phone with internet, and the staff who'll be using AgentForge day-to-day." },
  { q: "Which cities are you visiting?", a: "Only 3 dates are open right now — 7 July (Pune), 8 July (Satara) and 9 July (Kolhapur). Book the one closest to you." },
  { q: "What if I need to reschedule?", a: "No problem — just reply on the WhatsApp confirmation message and we'll try to fit you into the same city's day." },
];

type FormState = {
  company_name: string;
  contact_person: string;
  mobile: string;
  email: string;
  address: string;
  industry_type: string;
  staff_count: string;
  notes: string;
};

const emptyForm: FormState = {
  company_name: "",
  contact_person: "",
  mobile: "",
  email: "",
  address: "",
  industry_type: "Textile Manufacturer",
  staff_count: "",
  notes: "",
};

const MAX_PHOTOS = 6;

export default function OnsiteTrainingPage() {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const onPickPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const room = MAX_PHOTOS - photos.length;
    const accepted = files.slice(0, Math.max(0, room));
    setPhotos((prev) => [...prev, ...accepted]);
    setPhotoPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const day = VISIT_DAYS.find((d) => d.id === selectedDay);
    if (!day || !selectedTime) {
      setError("Please choose your city visit date and a time.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("company_name", form.company_name);
      fd.append("contact_person", form.contact_person);
      fd.append("mobile", form.mobile);
      fd.append("email", form.email);
      fd.append("city", day.city);
      fd.append("address", form.address);
      fd.append("industry_type", form.industry_type);
      fd.append("staff_count", form.staff_count);
      fd.append("notes", form.notes);
      fd.append("preferred_date", day.date);
      fd.append("preferred_time", TIME_SLOTS.find((t) => t.id === selectedTime)?.range || selectedTime);
      photos.forEach((f) => fd.append("photos", f));

      const res = await fetch("/api/onsite-training/book", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Could not submit. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardCls = "rounded-[1.75rem] border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-white/[0.05]";
  const mutedText = "text-slate-600 dark:text-white/60";
  const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/25 dark:text-white dark:placeholder:text-white/35";

  const pinColors = ["#06b6d4", "#8b5cf6", "#f59e0b"];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f8fbff] pb-16 text-slate-950 dark:bg-[#050816] dark:text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee22,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf622,transparent_35%),radial-gradient(circle_at_bottom,#f59e0b18,transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef8ff_55%,#fffaf2_100%)] dark:bg-[radial-gradient(circle_at_top_left,#22d3ee18,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf61f,transparent_35%),radial-gradient(circle_at_bottom,#f59e0b12,transparent_35%),linear-gradient(180deg,#050816_0%,#070b22_55%,#0a0a1f_100%)]" />

        {/* Floating doodles */}
        {[
          { icon: "🧵", left: "6%", top: "10%", cls: "float-slow" },
          { icon: "✂️", left: "90%", top: "8%", cls: "float-medium" },
          { icon: "👕", left: "88%", top: "34%", cls: "float-fast" },
          { icon: "🪡", left: "4%", top: "40%", cls: "float-medium" },
          { icon: "📍", left: "10%", top: "72%", cls: "float-fast" },
          { icon: "📸", left: "92%", top: "66%", cls: "float-slow" },
          { icon: "🧶", left: "3%", top: "90%", cls: "float-medium" },
          { icon: "✨", left: "94%", top: "90%", cls: "float-fast" },
        ].map((d, i) => (
          <div
            key={i}
            className={`absolute text-3xl opacity-[0.14] sm:text-4xl ${d.cls}`}
            style={{ left: d.left, top: d.top }}
          >
            {d.icon}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#050816]/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/af-logo.png" alt="AgentForge" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
                On-Site AI Training
              </p>
              <p className={`text-xs ${mutedText}`}>Free visit · Your showroom</p>
            </div>
          </div>
          <a
            href="#book"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-lg"
          >
            Book a Date
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl overflow-hidden px-4 pb-6 pt-10 text-center sm:px-5 sm:pt-14">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400/25 via-blue-400/20 to-violet-500/25 blur-3xl" />

        <div className="mx-auto mb-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
          📍 Only 3 Dates Open — 7, 8 & 9 July 2026
        </div>
        <h1 className="text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-6xl">
          AgentForge AI Training —{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
            At Your Showroom
          </span>
        </h1>
        <p className={`mx-auto mt-5 max-w-2xl text-lg leading-8 ${mutedText}`}>
          If you want AgentForge to come to your showroom or factory and train your staff to
          generate AI catalogue mockups — book your city&apos;s date below. Free visit, hands-on
          training, no photoshoot required.
        </p>

        {/* Floating hero strip — quick visual proof */}
        <div className="mx-auto mt-7 hidden max-w-2xl gap-3 sm:grid sm:grid-cols-4">
          {[
            { img: "/icons/indian model.svg", label: "AI Model Mockups" },
            { img: "/icons/luxury bedroom setup.svg", label: "Home Decor" },
            { img: "/icons/photo studio setup.svg", label: "Instagram Ready" },
            { img: "/icons/folded fabeic stack.svg", label: "Bulk Catalogue" },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`float-${i % 2 === 0 ? "medium" : "fast"} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-white/[0.06]`}
            >
              <div className="aspect-square w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.label} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <p className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Free On-Site Visit", "Hands-on Staff Training", "Live AI Demo", "No Photography Cost"].map((b) => (
            <span
              key={b}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm dark:border-white/10 dark:bg-white/10"
            >
              ✓ {b}
            </span>
          ))}
        </div>
      </section>

      {/* ===== Booking form — kept right up top so it's always visible ===== */}
      <section id="book" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-8 md:px-8">
          <div className={`${cardCls} p-6 sm:p-8`}>
            {done ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl">
                  ✓
                </div>
                <h2 className="mt-4 text-2xl font-black">Request received! 🎉</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Our team will confirm your visit date and time on WhatsApp within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-500">Book Your Visit</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">Choose Your City & Date</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>Only 3 dates available — one city per day.</p>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {VISIT_DAYS.map((d, i) => {
                    const { weekday, label } = formatVisitDate(d.date);
                    const active = selectedDay === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDay(d.id)}
                        className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
                          active
                            ? "border-cyan-500 bg-cyan-500 text-white shadow"
                            : "border-slate-200 bg-white hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.05]"
                        }`}
                      >
                        <span
                          className="mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white"
                          style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : pinColors[i] }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-base font-black">{d.city}</span>
                        <span className={`text-[11px] font-bold ${active ? "text-white/85" : "opacity-70"}`}>
                          {weekday}, {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide">Preferred Time</p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTime(t.id)}
                        className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                          selectedTime === t.id
                            ? "border-violet-500 bg-violet-500 text-white shadow"
                            : "border-slate-200 bg-white hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.05]"
                        }`}
                      >
                        {t.label} <span className="opacity-70">· {t.range}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      value={form.company_name}
                      onChange={(e) => update("company_name", e.target.value)}
                      placeholder="Company Name *"
                      className={inputCls}
                    />
                    <input
                      required
                      value={form.contact_person}
                      onChange={(e) => update("contact_person", e.target.value)}
                      placeholder="Contact Person *"
                      className={inputCls}
                    />
                    <input
                      required
                      value={form.mobile}
                      onChange={(e) => update("mobile", e.target.value)}
                      placeholder="Mobile Number *"
                      className={inputCls}
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="Email (optional)"
                      className={inputCls}
                    />
                    <select
                      value={form.industry_type}
                      onChange={(e) => update("industry_type", e.target.value)}
                      className={`${inputCls} sm:col-span-2`}
                    >
                      {INDUSTRY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Showroom / Factory address (optional)"
                    className={inputCls}
                  />

                  <input
                    value={form.staff_count}
                    onChange={(e) => update("staff_count", e.target.value)}
                    placeholder="How many staff will attend?"
                    className={inputCls}
                  />

                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Anything else we should know? (optional)"
                    rows={2}
                    className={inputCls}
                  />

                  {/* Photo upload */}
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-wide">
                      Upload showroom / product photos (optional)
                    </p>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4 transition hover:border-cyan-400 ${
                        photos.length >= MAX_PHOTOS ? "pointer-events-none opacity-50" : ""
                      } border-slate-300 dark:border-white/15`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                        📷
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black">Add photos ({photos.length}/{MAX_PHOTOS})</p>
                        <p className={`text-[11px] ${mutedText}`}>PNG / JPG / WEBP · up to 12 MB each</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={onPickPhotos}
                      />
                    </label>

                    {photoPreviews.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {photoPreviews.map((src, i) => (
                          <div key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              aria-label="Remove photo"
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] font-black text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-violet-500/25 transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Book Free Training Visit →"}
                  </button>
                </form>
              </>
            )}
          </div>
      </section>

      {/* How the visit works */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">How the Visit Works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {VISIT_STEPS.map((s) => (
            <div key={s.step} className={`${cardCls} p-5`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-700 text-sm font-black text-white">
                {s.step}
              </div>
              <p className="mt-3 font-black">{s.title}</p>
              <p className={`mt-1 text-sm ${mutedText}`}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we'll teach */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-500">Training Agenda</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">
            What We&apos;ll Teach Your Team
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEARN_ITEMS.map((item) => (
            <div
              key={item.title}
              className={`${cardCls} group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-cyan-50 to-violet-50 p-4 dark:from-white/5 dark:to-white/[0.02]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="text-base font-black">{item.title}</h3>
                <p className={`mt-2 text-sm leading-6 ${mutedText}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who is this for */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Who Is This For?</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHO_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`${cardCls} group overflow-hidden text-center transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-cyan-50 to-violet-50 p-4 dark:from-white/5 dark:to-white/[0.02]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  alt={item.label}
                  className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <p className="p-4 text-base font-black">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Before You Book</h2>
        <div className="mt-8 space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className={`${cardCls} p-6`}>
              <h3 className="text-lg font-black">{f.q}</h3>
              <p className={`mt-2 text-sm leading-7 ${mutedText}`}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 text-center md:px-8">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 p-8 text-white shadow-2xl shadow-violet-300/30 md:p-12">
          <h2 className="text-3xl font-black md:text-5xl">Let AgentForge Train Your Team, In Person</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/85">
            Free on-site visit · Hands-on AI mockup training · Real output on day one.
          </p>
          <div className="mt-8">
            <a
              href="#book"
              className="inline-flex rounded-2xl bg-white px-8 py-4 font-black text-violet-700 shadow-xl"
            >
              Book Your Training Date
            </a>
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#050816]/90 md:hidden">
        <a
          href="#book"
          className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-6 py-4 font-black uppercase text-white shadow-lg"
        >
          Book Training Visit
        </a>
      </div>
    </main>
  );
}
