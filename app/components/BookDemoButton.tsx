"use client";

// ============================================================
// "Book a Customize Demo" — public button + popup form.
// Visitor uploads a design, picks an agent + desired output +
// WhatsApp number (required) + optional logo, and submits.
// Goes to /api/demo-request → support task + demo_requests row.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Upload, X, CheckCircle2 } from "lucide-react";

// Only the live agents.
const AGENTS = [
  "Textile Mockup",
  "Jewellery AI",
  "Productography",
];

const SIZES = [
  "Square 1080×1080",
  "Mobile 1080×1920 (Story/Reel)",
  "Not sure — you decide",
];

const QUALITIES = ["Standard", "Premium", "Ultra HD"];

export default function BookDemoButton({
  className = "",
  label = "Book a Customize Demo",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
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
  // Portal target — the modal must render at <body> level, otherwise the
  // navbar's backdrop-blur creates a containing block that traps/clips the
  // fixed overlay inside the nav bar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const reset = () => {
    setAgent(""); setOutputDesc(""); setSize(SIZES[0]); setQuality(QUALITIES[1]); setDevice("Mobile");
    setWhatsapp(""); setDesign(null); setLogo(null); setError(""); setDone(false);
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

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-400 dark:border-white/15 dark:bg-slate-900 dark:text-white";
  const labelCls = "mb-1 block text-xs font-bold text-slate-600 dark:text-white/70";

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

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-500/20 p-3 backdrop-blur-lg sm:p-4">
          <div className="relative my-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[1.6rem] border border-white/40 bg-white/95 shadow-2xl dark:border-white/10 dark:bg-slate-950/95">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-slate-600 transition hover:bg-black/10 dark:bg-white/10 dark:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>

            {done ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-3 text-xl font-black">Request received! 🎉</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                  Our team will create your custom demo and send it to your WhatsApp shortly.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <h3 className="text-lg font-black sm:text-xl">Book a Customize Demo</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/55">
                  Upload your design and we&apos;ll create a free custom demo for you.
                </p>

                <div className="mt-4 space-y-3.5">
                  {/* Design upload (required) */}
                  <div>
                    <label className={labelCls}>Upload your design <span className="text-rose-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => designRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-cyan-300/60 bg-cyan-50/50 px-3.5 py-3 text-left text-sm transition hover:bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/5"
                    >
                      {design ? (
                        <img src={URL.createObjectURL(design)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
                          <Upload className="h-5 w-5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate font-semibold text-slate-700 dark:text-white/80">
                        {design ? design.name : "Click to upload (PNG / JPG / WEBP)"}
                      </span>
                    </button>
                    <input ref={designRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => setDesign(e.target.files?.[0] ?? null)} />
                  </div>

                  {/* Agent */}
                  <div>
                    <label className={labelCls}>Which agent is the demo for? <span className="text-rose-500">*</span></label>
                    <select value={agent} onChange={(e) => setAgent(e.target.value)} className={inputCls}>
                      <option value="">Select an agent…</option>
                      {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  {/* Output description */}
                  <div>
                    <label className={labelCls}>What output do you want?</label>
                    <textarea value={outputDesc} onChange={(e) => setOutputDesc(e.target.value)} rows={3}
                      placeholder="e.g. Indian female model wearing this saree, outdoor royal palace background, premium look"
                      className={`${inputCls} resize-none`} />
                  </div>

                  {/* Demo device */}
                  <div>
                    <label className={labelCls}>Demo device</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Mobile", "Computer"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDevice(d)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                            device === d
                              ? "border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-400/50 dark:bg-cyan-400/10 dark:text-cyan-200"
                              : "border-black/10 bg-white text-slate-600 dark:border-white/15 dark:bg-slate-900 dark:text-white/70"
                          }`}
                        >
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

                  {/* Logo (optional) */}
                  <div>
                    <label className={labelCls}>Add logo <span className="font-normal text-slate-400">(optional)</span></label>
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-left text-sm dark:border-white/15 dark:bg-slate-900"
                    >
                      {logo ? (
                        <img src={URL.createObjectURL(logo)} alt="" className="h-8 w-8 rounded object-contain" />
                      ) : (
                        <Upload className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-white/70">
                        {logo ? logo.name : "Upload logo (optional)"}
                      </span>
                      {logo && <X className="h-4 w-4 text-rose-500" onClick={(e) => { e.stopPropagation(); setLogo(null); }} />}
                    </button>
                    <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
                  </div>

                  {/* WhatsApp (required) */}
                  <div>
                    <label className={labelCls}>WhatsApp number <span className="text-rose-500">*</span></label>
                    <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="tel" inputMode="tel"
                      placeholder="e.g. +91 98765 43210" className={inputCls} />
                    <p className="mt-1 text-[11px] text-slate-400">We&apos;ll send your custom demo here.</p>
                  </div>

                  {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">{error}</p>}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Submit demo request"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
