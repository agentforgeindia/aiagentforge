"use client";

// ============================================================
// /workshop/review — public review form for past workshop attendees.
// Rating + checkbox feedback + suggestions + name/email + optional
// logo/photo + consent. Submits as 'pending' for admin approval.
// ============================================================

import { useState } from "react";

const FEEDBACK_OPTIONS = [
  "Content was practical & useful",
  "Easy to understand",
  "Instructor explained really well",
  "Live demo / hands-on was great",
  "Worth the time & money",
  "Learned something new for my business",
  "Well organized",
  "Would recommend to others",
];

export default function WorkshopReviewPage() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [points, setPoints] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const togglePoint = (p: string) =>
    setPoints((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const uploadImage = async (file: File, kind: "logo" | "photo") => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    kind === "logo" ? setUploadingLogo(true) : setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/workshop/review/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "upload failed");
      kind === "logo" ? setLogoUrl(json.url) : setPhotoUrl(json.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      kind === "logo" ? setUploadingLogo(false) : setUploadingPhoto(false);
    }
  };

  const submit = async () => {
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (rating < 1) return setError("Please give a star rating.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/workshop/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          rating,
          feedback_points: points,
          suggestions: suggestions.trim(),
          logo_url: logoUrl,
          photo_url: photoUrl,
          consent,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not submit. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200";

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6 text-center">
        <div className="max-w-md rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl">✓</div>
          <h1 className="mt-4 text-2xl font-black text-slate-800">Thank you! 🎉</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Your review has been submitted. Once our team approves it, it will appear on the
            workshop page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f7fbff_45%,#fdf4ff_100%)] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            Share Your Workshop Experience
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-slate-600">
            You attended the TextilePrints → Mockup AI Workshop. Tell us how it went — your
            feedback helps other textile businesses decide.
          </p>
        </div>

        <div className="space-y-5 rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur-xl">
          {/* Rating */}
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Your rating *
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className={`text-4xl transition ${
                    n <= (hover || rating) ? "text-amber-400" : "text-slate-200"
                  }`}
                  aria-label={`${n} star`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Feedback checkboxes */}
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              What did you like? (tick all that apply)
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEEDBACK_OPTIONS.map((opt) => {
                const on = points.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => togglePoint(opt)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                      on
                        ? "border-violet-400 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300"}`}>
                      {on ? "✓" : ""}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Suggestions (optional)
            </label>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              rows={3}
              placeholder="Anything we could improve, or what you'd love to see next?"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Name / email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Name *</label>
              <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Your name / business name" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
            </div>
          </div>

          {/* Logo / photo uploads */}
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { kind: "photo" as const, label: "Your photo", url: photoUrl, busy: uploadingPhoto },
              { kind: "logo" as const, label: "Business logo", url: logoUrl, busy: uploadingLogo },
            ]).map((f) => (
              <label
                key={f.kind}
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:border-violet-400"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={f.busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, f.kind);
                    e.target.value = "";
                  }}
                />
                {f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.label} className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <span className="text-2xl">⬆️</span>
                )}
                <span className="text-xs font-bold text-slate-600">
                  {f.busy ? "Uploading…" : f.url ? `${f.label} ✓` : f.label}
                </span>
              </label>
            ))}
          </div>

          {/* Consent */}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-violet-600"
            />
            <span className="text-xs font-semibold leading-5 text-slate-600">
              Yes, AgentForge can use my name, logo and photo for testimonials &amp; feedback on
              their website and social media.
            </span>
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700">{error}</p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl transition hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </div>
    </main>
  );
}
