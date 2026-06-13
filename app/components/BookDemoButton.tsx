"use client";

// ============================================================
// "Book a Customize Demo" — button + portal modal form.
// Uses createPortal to escape the navbar's backdrop-blur
// stacking context so the modal renders at body level.
// ============================================================

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Upload, X, CheckCircle2 } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const AGENTS = ["Textile Mockup", "Jewellery AI", "Productography"];
const SIZES = ["Square 1080×1080", "Mobile 1080×1920 (Story/Reel)", "Not sure — you decide"];
const QUALITIES = ["Standard", "Premium", "Ultra HD"];

export default function BookDemoButton({
  className = "",
  label = "Book a Customize Demo",
}: {
  className?: string;
  label?: string;
}) {
  const { darkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [agent, setAgent] = useState("");
  const [outputDesc, setOutputDesc] = useState("");
  const [size, setSize] = useState(SIZES[0]);
  const [quality, setQuality] = useState(QUALITIES[1]);
  const [device, setDevice] = useState("Mobile");
  const [whatsapp, setWhatsapp] = useState("");
  const [design, setDesign] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const designRef = useRef<HTMLInputElement | null>(null);
  const logoRef = useRef<HTMLInputElement | null>(null);

  // Portal needs document to be available (client only)
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const reset = () => {
    setAgent(""); setOutputDesc(""); setSize(SIZES[0]); setQuality(QUALITIES[1]);
    setDevice("Mobile"); setWhatsapp(""); setDesign(null); setLogo(null);
    setError(""); setDone(false);
  };

  const close = () => { setOpen(false); setTimeout(reset, 300); };

  const submit = async () => {
    setError("");
    if (!agent) { setError("Please select which agent the demo is for."); return; }
    if (!design) { setError("Please upload your design image."); return; }
    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) { setError("Please enter a valid WhatsApp number."); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("agent", agent);
      fd.append("output_desc", outputDesc);
      fd.append("output_size", size);
      fd.append("quality", quality);
      fd.append("device", device);
      fd.append("whatsapp", whatsapp);
      fd.append("design", design);
      if (logo) fd.append("logo", logo);
      const res = await fetch("/api/demo-request", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || "Could not submit. Please try again."); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const card = darkMode
    ? "border-white/10 bg-[#0d1117] text-white"
    : "border-black/8 bg-white text-slate-900";

  const inputCls = `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${
    darkMode
      ? "border-white/15 bg-slate-900 text-white placeholder:text-white/35"
      : "border-black/10 bg-white text-slate-800 placeholder:text-slate-400"
  }`;

  const labelCls = `mb-1 block text-xs font-bold ${darkMode ? "text-white/65" : "text-slate-600"}`;

  const pillBtn = (active: boolean) =>
    `rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
      active
        ? "border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-400/50 dark:bg-cyan-400/10 dark:text-cyan-200"
        : darkMode
        ? "border-white/15 bg-slate-900 text-white/70 hover:border-white/30"
        : "border-black/10 bg-white text-slate-600 hover:border-black/20"
    }`;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      style={{ isolation: "isolate" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel — slides up from bottom on mobile, centered on sm+ */}
      <div
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-t-[2rem] border shadow-2xl sm:rounded-[2rem] ${card}`}
        style={{ maxHeight: "95dvh" }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className={`absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full transition ${
            darkMode ? "bg-white/10 text-white/70 hover:bg-white/20" : "bg-black/6 text-slate-500 hover:bg-black/10"
          }`}
        >
          <X className="h-4 w-4" />
        </button>

        {done ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center px-8 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-xl font-black">Request received! 🎉</h3>
            <p className={`mt-2 text-sm ${darkMode ? "text-white/55" : "text-slate-500"}`}>
              Our team will create your custom demo and send it to your WhatsApp shortly.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="overflow-y-auto" style={{ maxHeight: "95dvh" }}>
            {/* Header */}
            <div className={`sticky top-0 z-10 border-b px-5 pb-4 pt-5 sm:px-6 ${darkMode ? "border-white/10 bg-[#0d1117]" : "border-black/8 bg-white"}`}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black sm:text-lg">Book a Custom Demo</h3>
                  <p className={`text-[11px] ${darkMode ? "text-white/50" : "text-slate-400"}`}>
                    We&apos;ll create a free demo &amp; send to your WhatsApp
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">

              {/* Design upload */}
              <div>
                <label className={labelCls}>
                  Your design image <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => designRef.current?.click()}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-3.5 py-3 text-left text-sm transition ${
                    darkMode
                      ? "border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10"
                      : "border-cyan-300/60 bg-cyan-50/50 hover:bg-cyan-50"
                  }`}
                >
                  {design ? (
                    <img src={URL.createObjectURL(design)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                      <Upload className="h-5 w-5" />
                    </span>
                  )}
                  <span className={`min-w-0 flex-1 truncate font-semibold ${darkMode ? "text-white/75" : "text-slate-600"}`}>
                    {design ? design.name : "Tap to upload PNG / JPG / WEBP"}
                  </span>
                  {design && (
                    <X
                      className="h-4 w-4 shrink-0 text-rose-400"
                      onClick={(e) => { e.stopPropagation(); setDesign(null); }}
                    />
                  )}
                </button>
                <input
                  ref={designRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setDesign(e.target.files?.[0] ?? null)}
                />
              </div>

              {/* Agent select */}
              <div>
                <label className={labelCls}>
                  Which agent? <span className="text-rose-500">*</span>
                </label>
                <select value={agent} onChange={(e) => setAgent(e.target.value)} className={inputCls}>
                  <option value="">Select an agent…</option>
                  {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Output description */}
              <div>
                <label className={labelCls}>What output do you want?</label>
                <textarea
                  value={outputDesc}
                  onChange={(e) => setOutputDesc(e.target.value)}
                  rows={3}
                  placeholder="e.g. Indian female model wearing this saree, outdoor royal palace background, premium look"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Device */}
              <div>
                <label className={labelCls}>Demo device</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Mobile", "Computer"].map((d) => (
                    <button key={d} type="button" onClick={() => setDevice(d)} className={pillBtn(device === d)}>
                      {d === "Mobile" ? "📱 Mobile" : "💻 Computer"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size + Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Output size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className={inputCls}>
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Quality</label>
                  <select value={quality} onChange={(e) => setQuality(e.target.value)} className={inputCls}>
                    {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className={labelCls}>
                  Logo <span className={`font-normal ${darkMode ? "text-white/35" : "text-slate-400"}`}>(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                    darkMode ? "border-white/15 bg-slate-900 hover:bg-slate-800" : "border-black/10 bg-white hover:bg-slate-50"
                  }`}
                >
                  {logo ? (
                    <img src={URL.createObjectURL(logo)} alt="" className="h-8 w-8 rounded object-contain" />
                  ) : (
                    <Upload className={`h-4 w-4 ${darkMode ? "text-white/40" : "text-slate-400"}`} />
                  )}
                  <span className={`min-w-0 flex-1 truncate text-sm ${darkMode ? "text-white/60" : "text-slate-500"}`}>
                    {logo ? logo.name : "Upload logo (optional)"}
                  </span>
                  {logo && (
                    <X className="h-4 w-4 shrink-0 text-rose-400" onClick={(e) => { e.stopPropagation(); setLogo(null); }} />
                  )}
                </button>
                <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
              </div>

              {/* WhatsApp */}
              <div>
                <label className={labelCls}>
                  WhatsApp number <span className="text-rose-500">*</span>
                </label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  className={inputCls}
                />
                <p className={`mt-1 text-[11px] ${darkMode ? "text-white/35" : "text-slate-400"}`}>
                  We&apos;ll send your custom demo here.
                </p>
              </div>

              {error && (
                <p className={`rounded-xl px-4 py-3 text-xs font-semibold ${darkMode ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-600"}`}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Demo Request →"}
              </button>

              <div className="pb-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-500/30 transition hover:scale-[1.04] sm:px-9 sm:py-4 sm:text-base"
        }
      >
        <Sparkles className="h-4 w-4" />
        {label}
      </button>

      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}
