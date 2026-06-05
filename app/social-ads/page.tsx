"use client";

// ============================================================
// SocialAds Designer — frontend (single + bulk)
// ============================================================
// Two modes:
//   • Single — one full form, one ad spec, 1-4 variations
//   • Bulk   — CSV import (or manual rows), each row = one full
//              ad spec (variations + platform + language can all
//              differ per row). Up to 50 rows.
//
// Workflow:
//   1. Upload logo / hero / extra images to Supabase Storage
//      (so the server-side URL allowlist accepts them)
//   2. POST to /api/social-ads/generate with the user's JWT
//   3. Poll the generations row(s) until status='completed'
//   4. Render the variation gallery
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import { track } from "@/lib/analytics";
import { validateImageFile } from "@/lib/uploadValidation";
import RatingFeedbackModal from "@/app/components/RatingFeedbackModal";
import CongratulationsPopup from "@/app/components/CongratulationsPopup";
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// ────────────────────────────────────────────────────────────
// Static lists — KEEP IN SYNC with the API route + composer.
// ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "doctor", label: "Doctor / Clinic" },
  { value: "hospital-clinic", label: "Hospital" },
  { value: "restaurant-food", label: "Restaurant / Food" },
  { value: "real-estate", label: "Real Estate" },
  { value: "gift-shop", label: "Gift Shop" },
  { value: "hotel", label: "Hotel / Resort" },
  { value: "jewellery", label: "Jewellery" },
  { value: "fashion-boutique", label: "Fashion / Boutique" },
  { value: "industrial-steel", label: "Industrial / Steel" },
  { value: "education-coaching", label: "Education / Coaching" },
  { value: "salon-spa", label: "Salon / Spa" },
  { value: "automobile-servicing", label: "Automobile Servicing" },
  { value: "gym-fitness", label: "Gym / Fitness" },
  { value: "wedding-planner", label: "Wedding Planner" },
  { value: "travel-tours", label: "Travel / Tours" },
  { value: "pooja-store", label: "Pooja Store" },
  { value: "general-business", label: "Other Business" },
] as const;

const PLATFORMS = [
  { value: "instagram-post", label: "Instagram Post (1080×1080)" },
  { value: "instagram-story", label: "Instagram Story (1080×1920)" },
  { value: "facebook-post", label: "Facebook Post (1200×630)" },
  { value: "linkedin-post", label: "LinkedIn Post (1200×627)" },
  { value: "youtube-thumbnail", label: "YouTube Thumbnail (1280×720)" },
  { value: "whatsapp-status", label: "WhatsApp Status (1080×1920)" },
  { value: "newspaper-ad", label: "Newspaper Ad (1500×1100)" },
] as const;

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "हिन्दी" },
  { value: "hinglish", label: "Hinglish" },
  { value: "marathi", label: "मराठी" },
  { value: "tamil", label: "தமிழ்" },
  { value: "telugu", label: "తెలుగు" },
  { value: "gujarati", label: "ગુજરાતી" },
  { value: "punjabi", label: "ਪੰਜਾਬੀ" },
  { value: "bengali", label: "বাংলা" },
  { value: "urdu", label: "اردو" },
  { value: "kannada", label: "ಕನ್ನಡ" },
  { value: "malayalam", label: "മലയാളം" },
] as const;

const STYLES = [
  { value: "modern", label: "Modern" },
  { value: "luxury", label: "Luxury" },
  { value: "festive", label: "Festive" },
  { value: "minimal", label: "Minimal" },
  { value: "bold-industrial", label: "Bold / Industrial" },
  { value: "traditional", label: "Traditional" },
] as const;

const CREDITS_PER_VARIATION = 12;
const MAX_BULK_ROWS = 50;

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ────────────────────────────────────────────────────────────
// AdSpec — the per-row payload
// ────────────────────────────────────────────────────────────

type AdSpec = {
  rowId: string;                  // local React key; replaced with generation_id on submit
  business_category: string;
  business_name: string;
  main_headline: string;
  tagline: string;
  offer_text: string;
  phone: string;
  website: string;
  address: string;
  language: string;
  platform: string;
  style_theme: string;
  color_palette: string;
  variations: number;
  custom_instruction: string;
  logo_url: string | null;
  hero_image_url: string | null;
  extra_image_urls: string[];
};

const emptyRow = (): AdSpec => ({
  rowId: newId(),
  business_category: "doctor",
  business_name: "",
  main_headline: "",
  tagline: "",
  offer_text: "",
  phone: "",
  website: "",
  address: "",
  language: "english",
  platform: "instagram-post",
  style_theme: "modern",
  color_palette: "",
  variations: 2,
  custom_instruction: "",
  logo_url: null,
  hero_image_url: null,
  extra_image_urls: [],
});

// ────────────────────────────────────────────────────────────
// CSV helpers — tiny, no dep. Accepts header row.
// ────────────────────────────────────────────────────────────

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      cur.push(field);
      field = "";
    } else if (c === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else if (c === "\r") {
      /* skip */
    } else {
      field += c;
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj;
  });
}

function rowFromCsv(o: Record<string, string>): AdSpec {
  const pick = (k: string, fb: string) => (o[k] ? o[k] : fb);
  return {
    ...emptyRow(),
    business_category: pick("category", "general-business"),
    business_name: pick("business_name", ""),
    main_headline: pick("headline", ""),
    tagline: pick("tagline", ""),
    offer_text: pick("offer", ""),
    phone: pick("phone", ""),
    website: pick("website", ""),
    address: pick("address", ""),
    language: pick("language", "english"),
    platform: pick("platform", "instagram-post"),
    style_theme: pick("style", "modern"),
    color_palette: pick("colors", ""),
    variations: Math.max(1, Math.min(4, Number(o.variations || 1))),
    custom_instruction: pick("custom_instruction", ""),
  };
}

const CSV_TEMPLATE =
  "business_name,category,headline,tagline,offer,phone,website,address,language,platform,style,colors,variations,custom_instruction\n" +
  "Speedy Auto Care,automobile-servicing,MONSOON CAR SERVICE,Free pickup & drop,FLAT 25% OFF,+91 90000 00000,www.speedy.in,Bangalore,hindi,instagram-post,bold-industrial,\"#0044CC,#FFD700\",2,\n" +
  "Dr. Amil Martin,doctor,PROFESSIONAL DOCTOR SPECIALIST,We care about your health,,+91 12345 67890,,Mumbai,english,instagram-post,modern,,2,\n";

// ────────────────────────────────────────────────────────────

export default function SocialAdsPage() {
  const { user, credits, refreshProfile } = useAuth();

  const [mode, setMode] = useState<"single" | "bulk">("single");

  // single-mode shares row[0]
  const [rows, setRows] = useState<AdSpec[]>([emptyRow()]);

  // generation
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationIds, setGenerationIds] = useState<string[] | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingGenerationId, setRatingGenerationId] = useState<string | undefined>();
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [congratsCredits, setCongratsCredits] = useState(0);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [results, setResults] = useState<
    { generation_id: string; output_urls: string[] }[] | null
  >(null);

  const pollRef = useRef<number | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  // ── credits required
  const totalCredits = useMemo(() => {
    const active = mode === "single" ? rows.slice(0, 1) : rows;
    return active.reduce(
      (sum, r) => sum + r.variations * CREDITS_PER_VARIATION,
      0,
    );
  }, [rows, mode]);

  // ── upload helper
  const [uploading, setUploading] = useState<string | null>(null);
  const uploadToStorage = async (file: File, slotId: string) => {
    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.reason);
      return null;
    }
    setUploading(slotId);
    setError(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const path = `social-ads/${user?.id || "guest"}/${Date.now()}-${newId()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("designs")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("designs").getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
      return null;
    } finally {
      setUploading(null);
    }
  };

  // ── row helpers
  const updateRow = (rowId: string, patch: Partial<AdSpec>) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  };
  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };
  const addRow = () => {
    if (rows.length >= MAX_BULK_ROWS) {
      setError(`Bulk capped at ${MAX_BULK_ROWS} rows.`);
      return;
    }
    setRows((prev) => [...prev, emptyRow()]);
  };

  const handleCsv = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (!parsed.length) {
        setError("CSV had no rows.");
        return;
      }
      if (parsed.length > MAX_BULK_ROWS) {
        setError(`CSV has ${parsed.length} rows; max is ${MAX_BULK_ROWS}.`);
        return;
      }
      const newRows = parsed.map(rowFromCsv);
      setRows(newRows);
      setMode("bulk");
    } catch (err: any) {
      setError(err?.message || "Could not parse CSV.");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "social-ads-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── polling
  useEffect(() => {
    if (!generationIds || generationIds.length === 0) return;
    let stopped = false;

    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from("generations")
          .select("id, status, output_url, output_urls, error_message")
          .in("id", generationIds);
        if (stopped || error || !data) return;

        const complete = data.every(
          (r) => r.status === "completed" || r.status === "failed",
        );
        const anyFailed = data.find((r) => r.status === "failed");

        if (complete) {
          if (anyFailed) {
            setError(anyFailed.error_message || "One or more generations failed.");
            track({
              name: "generation_failed",
              agent: "social-ads",
              stage: "polling",
              reason: anyFailed.error_message || "failed",
            });
          } else {
            track({
              name: "generation_completed",
              agent: "social-ads",
              generation_id: generationIds[0],
            });
          }
          setResults(
            data.map((r) => ({
              generation_id: r.id,
              output_urls: Array.isArray(r.output_urls)
                ? r.output_urls
                : r.output_url
                  ? [r.output_url]
                  : [],
            })),
          );
          setBusy(false);
          refreshProfile();
          setRatingGenerationId(generationIds?.[0]);
          setShowRatingModal(true);
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        /* transient — keep polling */
      }
    };

    poll();
    pollRef.current = window.setInterval(poll, 4000);

    return () => {
      stopped = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [generationIds, refreshProfile]);

  // ── submit
  const handleGenerate = async () => {
    setError(null);
    setResults(null);

    if (!user) {
      setError("Please sign in first.");
      return;
    }
    const activeRows = mode === "single" ? rows.slice(0, 1) : rows;
    for (let i = 0; i < activeRows.length; i++) {
      const r = activeRows[i];
      if (!r.business_name.trim() || !r.main_headline.trim()) {
        setError(`Row ${i + 1}: business_name and headline are required.`);
        return;
      }
    }
    if (credits < totalCredits) {
      track({
        name: "insufficient_credits",
        agent: "social-ads",
        required: totalCredits,
      });
      setError(`You need ${totalCredits} credits — current balance ${credits}.`);
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    const jwt = sess.session?.access_token;
    if (!jwt) {
      setError("Session expired. Please sign in again.");
      return;
    }

    const items = activeRows.map((r) => ({
      generation_id: newId(),
      business_category: r.business_category,
      business_name: r.business_name.trim(),
      main_headline: r.main_headline.trim(),
      tagline: r.tagline.trim() || null,
      offer_text: r.offer_text.trim() || null,
      contact_info: {
        phone: r.phone.trim() || undefined,
        website: r.website.trim() || undefined,
        address: r.address.trim() || undefined,
      },
      logo_url: r.logo_url,
      hero_image_url: r.hero_image_url,
      extra_image_urls: r.extra_image_urls,
      language: r.language,
      platform: r.platform,
      style_theme: r.style_theme,
      color_palette: r.color_palette.trim() || null,
      variations: r.variations,
      custom_instruction: r.custom_instruction.trim() || null,
    }));

    let payload: any;
    if (mode === "single") {
      payload = {
        generation_mode: "single",
        required_credits: totalCredits,
        ...items[0],
      };
    } else {
      payload = {
        generation_mode: "bulk",
        batch_id: newId(),
        required_credits: totalCredits,
        items,
      };
    }

    setBusy(true);
    track({
      name: "generation_started",
      agent: "social-ads",
      credits: totalCredits,
    });

    try {
      const res = await fetch("/api/social-ads/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        track({
          name: "generation_failed",
          agent: "social-ads",
          stage: "n8n",
          reason: data?.error ?? `status_${res.status}`,
        });
        setError(data?.error || "Generation failed.");
        setBusy(false);
        return;
      }

      const ids =
        data.mode === "bulk" ? data.generation_ids : [data.generation_id];
      setGenerationIds(ids);
      setBatchId(data.batch_id ?? null);
      refreshProfile();
    } catch (err: any) {
      track({
        name: "generation_failed",
        agent: "social-ads",
        stage: "n8n",
        reason: err?.message || "network",
      });
      setError(err?.message || "Network error.");
      setBusy(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            Social Media Ads Designer
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            17 categories · 7 platforms · 12 languages · single + bulk · pro
            text overlay (zero spelling errors).
          </p>
          <div className="mt-3 text-sm text-slate-500">
            Credits: <span className="font-semibold text-blue-700">{credits}</span>
            {" · "}This run will cost{" "}
            <span className="font-semibold">{totalCredits}</span>
          </div>
        </header>

        {/* ───── Mode toggle ───── */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => {
              setMode("single");
              if (rows.length > 1) setRows(rows.slice(0, 1));
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              mode === "single"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {mode === "single" ? <ToggleRight /> : <ToggleLeft />}
            Single Ad
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              mode === "bulk"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {mode === "bulk" ? <ToggleRight /> : <ToggleLeft />}
            Bulk ({rows.length}/{MAX_BULK_ROWS})
          </button>

          {mode === "bulk" && (
            <>
              <button
                onClick={() => csvInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import CSV
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCsv(f);
                  if (csvInputRef.current) csvInputRef.current.value = "";
                }}
              />
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-700 underline"
              >
                Download CSV template
              </button>
              <button
                onClick={addRow}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </>
          )}
        </div>

        {/* ───── Rows ───── */}
        <div className="space-y-6">
          {(mode === "single" ? rows.slice(0, 1) : rows).map((r, idx) => (
            <RowCard
              key={r.rowId}
              row={r}
              index={idx}
              showRemove={mode === "bulk" && rows.length > 1}
              onUpdate={(patch) => updateRow(r.rowId, patch)}
              onRemove={() => removeRow(r.rowId)}
              uploadToStorage={uploadToStorage}
              uploading={uploading}
            />
          ))}
        </div>

        {/* ───── CTA ───── */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {error && (
            <div className="w-full max-w-3xl rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-red-800 dark:text-red-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!user ? (
            <Link
              href="/login"
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Sign in to generate
            </Link>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={busy || uploading !== null}
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold flex items-center gap-2"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating {mode === "bulk" ? `${rows.length} ads` : "ad"}…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate {mode === "bulk" ? `${rows.length} Ads` : "Ad"} (
                  {totalCredits} credits)
                </>
              )}
            </button>
          )}
        </div>

        {/* ───── Results ───── */}
        {results && results.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Your Ads {batchId && <span className="text-xs text-slate-500 ml-2">batch {batchId.slice(0, 8)}</span>}
            </h2>
            {results.map((g, gi) => (
              <div key={g.generation_id} className="mb-8">
                <p className="text-sm text-slate-500 mb-2">
                  Generation {gi + 1} of {results.length}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {g.output_urls.map((u, i) => (
                    <a
                      key={i}
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt={`Var ${i + 1}`} className="w-full h-auto" />
                      <div className="px-3 py-2 text-xs text-slate-500">
                        Tap to download
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {showRatingModal && (
        <RatingFeedbackModal
          generationId={ratingGenerationId}
          agent="social-ads"
          onClose={() => setShowRatingModal(false)}
          onCreditsAwarded={(c) => {
            setShowRatingModal(false);
            setCongratsCredits(c);
            setShowCongratsPopup(true);
            refreshProfile();
          }}
        />
      )}
      {showCongratsPopup && (
        <CongratulationsPopup
          credits={congratsCredits}
          onClose={() => setShowCongratsPopup(false)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RowCard — one ad spec form
// ────────────────────────────────────────────────────────────

function RowCard({
  row,
  index,
  showRemove,
  onUpdate,
  onRemove,
  uploadToStorage,
  uploading,
}: {
  row: AdSpec;
  index: number;
  showRemove: boolean;
  onUpdate: (patch: Partial<AdSpec>) => void;
  onRemove: () => void;
  uploadToStorage: (f: File, slotId: string) => Promise<string | null>;
  uploading: string | null;
}) {
  const slotKey = (s: string) => `${row.rowId}-${s}`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">
          Ad #{index + 1}
        </h3>
        {showRemove && (
          <button
            onClick={onRemove}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded"
            title="Remove this ad"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Business Category">
          <select
            value={row.business_category}
            onChange={(e) => onUpdate({ business_category: e.target.value })}
            className={selectCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Language">
          <select
            value={row.language}
            onChange={(e) => onUpdate({ language: e.target.value })}
            className={selectCls}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Business Name *">
          <input
            value={row.business_name}
            onChange={(e) => onUpdate({ business_name: e.target.value })}
            className={inputCls}
            maxLength={100}
            placeholder="Speedy Auto Care"
          />
        </Field>
        <Field label="Headline *">
          <input
            value={row.main_headline}
            onChange={(e) => onUpdate({ main_headline: e.target.value })}
            className={inputCls}
            maxLength={120}
            placeholder="MONSOON CAR SERVICE"
          />
        </Field>

        <Field label="Tagline">
          <input
            value={row.tagline}
            onChange={(e) => onUpdate({ tagline: e.target.value })}
            className={inputCls}
            maxLength={160}
          />
        </Field>
        <Field label="Offer">
          <input
            value={row.offer_text}
            onChange={(e) => onUpdate({ offer_text: e.target.value })}
            className={inputCls}
            maxLength={60}
            placeholder="FLAT 25% OFF"
          />
        </Field>

        <Field label="Platform">
          <select
            value={row.platform}
            onChange={(e) => onUpdate({ platform: e.target.value })}
            className={selectCls}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Style">
          <select
            value={row.style_theme}
            onChange={(e) => onUpdate({ style_theme: e.target.value })}
            className={selectCls}
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Phone">
          <input
            value={row.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Website">
          <input
            value={row.website}
            onChange={(e) => onUpdate({ website: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field label="Address">
          <input
            value={row.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Brand Colors (hex, comma-separated)">
          <input
            value={row.color_palette}
            onChange={(e) => onUpdate({ color_palette: e.target.value })}
            className={inputCls}
            maxLength={80}
            placeholder="#0044CC,#FFFFFF"
          />
        </Field>

        <Field label={`Variations — ${row.variations * CREDITS_PER_VARIATION} credits`}>
          <input
            type="number"
            min={1}
            max={4}
            value={row.variations}
            onChange={(e) =>
              onUpdate({
                variations: Math.max(1, Math.min(4, Number(e.target.value) || 1)),
              })
            }
            className={inputCls}
          />
        </Field>
        <Field label="Custom Instruction">
          <textarea
            value={row.custom_instruction}
            onChange={(e) => onUpdate({ custom_instruction: e.target.value })}
            className={`${inputCls} min-h-[60px]`}
            maxLength={500}
          />
        </Field>
      </div>

      {/* uploads */}
      <div className="mt-4 grid md:grid-cols-3 gap-3">
        <UploadCard
          label="Logo"
          url={row.logo_url}
          loading={uploading === slotKey("logo")}
          onFile={async (f) => {
            const u = await uploadToStorage(f, slotKey("logo"));
            if (u) onUpdate({ logo_url: u });
          }}
          onClear={() => onUpdate({ logo_url: null })}
        />
        <UploadCard
          label="Hero Image"
          url={row.hero_image_url}
          loading={uploading === slotKey("hero")}
          onFile={async (f) => {
            const u = await uploadToStorage(f, slotKey("hero"));
            if (u) onUpdate({ hero_image_url: u });
          }}
          onClear={() => onUpdate({ hero_image_url: null })}
        />
        <UploadCard
          label={`Extra (${row.extra_image_urls.length}/4)`}
          url={null}
          loading={uploading === slotKey("extra")}
          onFile={async (f) => {
            if (row.extra_image_urls.length >= 4) return;
            const u = await uploadToStorage(f, slotKey("extra"));
            if (u) onUpdate({ extra_image_urls: [...row.extra_image_urls, u] });
          }}
          onClear={() => onUpdate({ extra_image_urls: [] })}
          multiPreview={row.extra_image_urls}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const selectCls = inputCls;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function UploadCard({
  label,
  url,
  loading,
  onFile,
  onClear,
  multiPreview,
}: {
  label: string;
  url: string | null;
  loading: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
  multiPreview?: string[];
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-3 text-center">
      <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{label}</p>

      {multiPreview && multiPreview.length > 0 && (
        <div className="grid grid-cols-2 gap-1 mb-2">
          {multiPreview.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={u}
              alt={`extra-${i}`}
              className="w-full h-14 object-cover rounded"
            />
          ))}
        </div>
      )}

      {url && !multiPreview && (
        <div className="relative mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="preview" className="mx-auto max-h-24 rounded" />
          <button
            onClick={onClear}
            className="absolute top-0 right-0 bg-slate-900/70 text-white rounded-full p-1"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        Upload
      </button>
    </div>
  );
}
