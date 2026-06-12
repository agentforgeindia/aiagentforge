"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Plus,
  Quote,
  Send,
  Star,
  X as XIcon,
} from "lucide-react";

export type AgentType = "textile" | "jewellery" | "productography";

export type Testimonial = {
  id: string;
  name: string; // already privacy-masked e.g. "Rajesh K****"
  city?: string;
  message: string;
  rating: number; // 1-5
  imageUrl?: string;
  createdAt: string; // ISO
  source?: "whatsapp" | "email" | "in-app" | string;
};

type Props = {
  agentType: AgentType;
  /**
   * @deprecated — no-op since v2. The slider now uses Tailwind
   * `dark:` variants and auto-respects the page theme via the
   * `dark` class on <html>. Kept in the signature so existing
   * callers (textile + productography) keep compiling.
   */
  darkMode?: boolean;
  /** Default seed entries shown when DB is empty / not yet wired. */
  seed: Testimonial[];
  /** Headline override (per agent). */
  heading?: string;
  /** Subtitle override. */
  subtitle?: string;
};

/** Mask the last name to first letter + asterisks for privacy. */
function maskName(raw: string): string {
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 1) {
    const first = parts[0];
    if (first.length <= 2) return first;
    return first.slice(0, 2) + "*".repeat(Math.max(3, first.length - 2));
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0] ?? "";
  return `${first} ${lastInitial}${"*".repeat(4)}`;
}

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    const diffMs = Date.now() - d;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function TestimonialsSlider({
  agentType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  darkMode: _legacyDarkMode = false,
  seed,
  heading = "What early users are saying",
  subtitle = "Real messages from our first users — names masked for privacy.",
}: Props) {
  const [items, setItems] = useState<Testimonial[]>(seed);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Submit form modal
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // Relative timestamps are time-dependent, so they differ between the SSR
  // render and client hydration ("26 min ago" vs "24 min ago"). Render them
  // only after mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Try to fetch approved testimonials from DB and MERGE with seed.
  // Order: real (newest first) → seed as filler → cap at top 8.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, city, message, rating, image_url, created_at, source")
          .eq("agent_type", agentType)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(8);
        if (!active) return;
        if (error) return; // keep seed only
        const mapped: Testimonial[] = (data || []).map((row: any) => ({
          id: row.id,
          name: maskName(row.name || "Anonymous"),
          city: row.city || "",
          message: row.message,
          rating: row.rating ?? 5,
          imageUrl: row.image_url || undefined,
          createdAt: row.created_at,
          source: row.source || "in-app",
        }));
        // Combine real + seed, dedupe by id, cap at 8
        const combined: Testimonial[] = [];
        const seenIds = new Set<string>();
        for (const t of [...mapped, ...seed]) {
          if (seenIds.has(t.id)) continue;
          seenIds.add(t.id);
          combined.push(t);
          if (combined.length >= 8) break;
        }
        setItems(combined);
      } catch {
        /* keep seed */
      }
    })();
    return () => {
      active = false;
    };
  }, [agentType, seed]);

  // Auto-rotate
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused, items.length]);

  // Scroll to active card
  useEffect(() => {
    const container = scrollerRef.current;
    if (!container) return;
    const track = container.firstElementChild as HTMLElement | null;
    const target = track?.children[active] as HTMLElement | undefined;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = container.scrollLeft + (rect.left - containerRect.left);
    container.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  const step = (dir: -1 | 1) => {
    setActive((prev) => (prev + dir + items.length) % items.length);
  };

  /* ───────────── Submit form ───────────── */

  // Resize + compress an image client-side so uploads never exceed
  // the storage limit. Max dimension 1280px, JPEG quality 0.8.
  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      // Skip tiny files
      if (file.size < 400 * 1024) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1280;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
          },
          "image/jpeg", 0.8,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const onPickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const compressed = await compressImage(f);
    setFormImageFile(compressed);
    const reader = new FileReader();
    reader.onload = () => setFormImagePreview(String(reader.result || ""));
    reader.readAsDataURL(compressed);
  };

  const resetForm = () => {
    setFormName("");
    setFormCity("");
    setFormMessage("");
    setFormRating(5);
    setFormImageFile(null);
    setFormImagePreview("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim()) {
      setSubmitMessage({ type: "err", text: "Please type a short review first." });
      return;
    }
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      let imageUrl: string | null = null;
      if (formImageFile) {
        const ext = formImageFile.name.split(".").pop() || "png";
        const path = `${userId || "anon"}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("testimonial-screenshots")
          .upload(path, formImageFile, { upsert: false });
        if (!upErr) {
          const { data: pub } = supabase.storage
            .from("testimonial-screenshots")
            .getPublicUrl(path);
          imageUrl = pub?.publicUrl || null;
        }
      }

      const { error } = await supabase.from("testimonials").insert({
        user_id: userId,
        agent_type: agentType,
        name: formName.trim() || "Customer",
        city: formCity.trim() || null,
        message: formMessage.trim(),
        rating: formRating,
        image_url: imageUrl,
        status: "pending",
        source: "in-app",
      });

      if (error) throw error;

      setSubmitMessage({
        type: "ok",
        text: "Thank you! Your review will go live after a quick check.",
      });
      resetForm();
      // Auto-close after a moment
      window.setTimeout(() => {
        setShowForm(false);
        setSubmitMessage(null);
      }, 1800);
    } catch (err: any) {
      console.warn("Testimonial submit failed:", err?.message || err);
      setSubmitMessage({
        type: "err",
        text:
          "We couldn't save your review right now. Please try again, or share it on WhatsApp.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ───────────── Render ───────────── */
  // All theme styling lives in Tailwind `dark:` variants now —
  // no JS branch needed. This is why removing the darkMode prop
  // dependency was the correct fix: the parent page's <html
  // class="dark"> automatically toggles everything below.

  const card =
    "border-black/10 bg-white text-black shadow-cyan-500/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:shadow-black/40";
  const muted = "text-black/55 dark:text-white/55";
  const input =
    "border-black/10 bg-white text-black placeholder:text-black/35 dark:border-white/10 dark:bg-black/25 dark:text-white dark:placeholder:text-white/35";

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-5 sm:pb-16">
      {/* Header row */}
      <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            Early feedback · WhatsApp reviews
          </p>
          <h3 className="mt-1 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              {heading}
            </span>
          </h3>
          <p className={`mt-1 text-sm ${muted}`}>{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105"
          >
            <Plus className="h-3.5 w-3.5" />
            Share your story
          </button>

          <button
            type="button"
            aria-label="Previous"
            onClick={() => step(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:scale-105 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:shadow-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => step(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:scale-105 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:shadow-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className="-mx-4 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="flex gap-4 pb-3">
          {items.map((t) => {
            const initial = t.name?.[0]?.toUpperCase() || "U";
            return (
              <div
                key={t.id}
                style={{ scrollSnapAlign: "start" }}
                className={`group relative flex w-[88vw] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border shadow-xl transition hover:-translate-y-1 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] ${card}`}
              >
                {/* WhatsApp-style header */}
                <div className="relative flex items-center gap-3 border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50 to-emerald-100/80 p-4 dark:border-emerald-400/15 dark:from-emerald-500/10 dark:to-emerald-500/5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-white shadow-md">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm font-black text-emerald-900 dark:text-emerald-100">
                        {t.name}
                      </p>
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    </div>
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-emerald-700/70 dark:text-emerald-200/70">
                      {t.city ? `${t.city} · ` : ""}
                      {t.source === "whatsapp" ? "via WhatsApp" : "via App"}
                    </p>
                  </div>
                  <span suppressHydrationWarning className="text-[10px] font-bold text-emerald-700/60 dark:text-emerald-200/60">
                    {mounted ? relativeTime(t.createdAt) : ""}
                  </span>
                </div>

                {/* Body — chat bubble */}
                <div className="relative flex flex-1 flex-col gap-3 p-4">
                  <div className="relative inline-block rounded-2xl rounded-tl-md bg-emerald-50/60 px-4 py-3 text-black shadow-sm dark:bg-white/[0.06] dark:text-white">
                    <p className="text-sm leading-6 sm:text-[15px]">{t.message}</p>
                    <span suppressHydrationWarning className="mt-1.5 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-600/70 dark:text-emerald-300/60">
                      {mounted ? relativeTime(t.createdAt) : ""}
                      <span className="inline-flex">
                        <span className="text-emerald-500">✓✓</span>
                      </span>
                    </span>
                  </div>

                  {t.imageUrl && (
                    <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                      <img
                        src={t.imageUrl}
                        alt="Review screenshot"
                        className="block h-44 w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Star rating */}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= t.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-black/15 dark:text-white/15"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                      Verified user
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {items.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-label={`Go to review ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active
                ? "w-6 bg-cyan-500"
                : "w-1.5 bg-black/20 dark:bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Submit modal */}
      {showForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-black/10 bg-white p-6 text-black shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220] dark:text-white sm:p-7">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSubmitMessage(null);
              }}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black transition hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                <Quote className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600">
                  Share your story
                </p>
                <h3 className="text-xl font-black sm:text-2xl">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Tell us how AgentForge helped
                  </span>
                </h3>
              </div>
            </div>

            <p className={`mb-4 text-xs ${muted}`}>
              Reviews go live after a quick admin check. Your last name will be
              masked for privacy.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Your name (optional)"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${input}`}
                />
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="City (optional)"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${input}`}
                />
              </div>

              <textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Your honest review — what worked, what saved time…"
                rows={4}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${input}`}
              />

              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-black uppercase tracking-wider ${muted}`}>
                  Rating
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormRating(n)}
                      aria-label={`${n} star`}
                      className="transition hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          n <= formRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-black/20 dark:text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 transition hover:border-cyan-400 dark:border-white/10 dark:bg-white/[0.04]">

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                  {formImagePreview ? <Camera className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">
                    {formImageFile ? formImageFile.name : "Attach screenshot (optional)"}
                  </p>
                  <p className={`text-[11px] ${muted}`}>
                    PNG / JPG · WhatsApp screenshot or AI output
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onPickImage}
                />
              </label>

              {formImagePreview && (
                <div className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                  <img src={formImagePreview} alt="Preview" className="mx-auto block max-h-[32vh] w-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormImageFile(null);
                      setFormImagePreview("");
                    }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove image"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {submitMessage && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-xs font-bold ${
                    submitMessage.type === "ok"
                      ? "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                      : "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit review
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
