"use client";

// ============================================================
// /scene-editor — upload or pick a room scene, AI auto-detects the
// changeable décor, and you swap one element at a time. The main
// product (bedspread / quilt) stays untouched.
//
// Credits: sample scene = 2, uploaded image = 3, each change = 1.
// ============================================================

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";

// Built-in sample scenes for the 2-credit "Use your scene" option.
// Drop a few room photos into /public/scene-samples/ to enable these.
const SAMPLE_SCENES = [
  { label: "Coastal bedroom", path: "/scene-samples/bedroom-1.jpg" },
  { label: "Modern bedroom", path: "/scene-samples/bedroom-2.jpg" },
  { label: "Classic bedroom", path: "/scene-samples/bedroom-3.jpg" },
];

const COST = { sample: 1, upload: 1, change: 5 } as const;

type Element = { id: string; name: string; options: string[] };
type WorkImg = { url?: string; b64?: string };

function newId() {
  return Math.random().toString(36).slice(2, 8);
}

export default function SceneEditorPage() {
  const { user, credits, refreshProfile } = useAuth();

  const [tab, setTab] = useState<"sample" | "upload">("upload");
  const [imageUrl, setImageUrl] = useState(""); // absolute, AgentForge-hosted
  const [previewUrl, setPreviewUrl] = useState(""); // what we show before analyze
  const [uploading, setUploading] = useState(false);

  const [elements, setElements] = useState<Element[]>([]);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [work, setWork] = useState<WorkImg | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Per-element reference product images the user uploads ("use my own lamp").
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [refUploading, setRefUploading] = useState<string | null>(null);

  const source: "sample" | "upload" = tab;
  const analyzeCost = COST[source];
  const displaySrc = work?.b64 || work?.url || previewUrl;

  const token = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const absolute = (path: string) =>
    typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

  const pickSample = (path: string) => {
    setError("");
    setElements([]);
    setWork(null);
    const abs = absolute(path);
    setImageUrl(abs);
    setPreviewUrl(abs);
  };

  const onUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setElements([]);
    setWork(null);
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const filePath = `scene-editor/${user?.id || "guest"}/${Date.now()}-${newId()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("designs")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      setPreviewUrl(data.publicUrl);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const analyze = async () => {
    if (!imageUrl || analyzing) return;
    setError("");
    setAnalyzing(true);
    try {
      const res = await fetch("/api/scene/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ image_url: imageUrl, source }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.code === "INSUFFICIENT_CREDITS"
            ? "Not enough credits to analyze this scene."
            : json.error || "Could not analyze the scene.",
        );
        return;
      }
      setElements(json.elements || []);
      setSel(
        Object.fromEntries((json.elements || []).map((e: Element) => [e.id, e.options[0] || ""])),
      );
      setWork({ url: imageUrl });
      refreshProfile?.();
    } catch {
      setError("Something went wrong while analyzing.");
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadRef = async (el: Element, file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setRefUploading(el.id);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const filePath = `scene-editor/${user?.id || "guest"}/refs/${Date.now()}-${newId()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("designs")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
      setRefs((p) => ({ ...p, [el.id]: data.publicUrl }));
    } catch {
      setError("Product image upload failed. Please try again.");
    } finally {
      setRefUploading(null);
    }
  };

  const applyChange = async (el: Element) => {
    if (editingId || !work) return;
    const ref = refs[el.id];
    const choice = sel[el.id] || el.options[0];
    if (!ref && !choice) return;
    setError("");
    setEditingId(el.id);
    try {
      const instruction = ref
        ? `Replace the ${el.name} in the room with the ${el.name} shown in the product reference image. Match its scale, perspective, position, lighting and shadows so it sits naturally in the room.`
        : `Change the ${el.name} to: ${choice}.`;
      const res = await fetch("/api/scene/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({
          ...(work.b64 ? { image_b64: work.b64 } : { image_url: work.url }),
          ...(ref ? { reference_url: ref } : {}),
          instruction,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.code === "INSUFFICIENT_CREDITS"
            ? "Not enough credits for this change."
            : json.error || "Could not apply the change.",
        );
        return;
      }
      setWork({ b64: json.image_b64 });
      refreshProfile?.();
    } catch {
      setError("Something went wrong while editing.");
    } finally {
      setEditingId(null);
    }
  };

  const canAnalyze = useMemo(
    () => Boolean(imageUrl) && elements.length === 0 && !analyzing,
    [imageUrl, elements.length, analyzing],
  );

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6 text-center">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl">
          <h1 className="text-xl font-black text-slate-800">Sign in to use the Scene Editor</h1>
          <p className="mt-2 text-sm text-slate-500">
            Please log in to your AgentForge account to continue.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f7fbff_45%,#fdf4ff_100%)] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            AI Scene Editor
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-600">
            Upload a room scene — AI auto-detects the décor and lets you change the lamp,
            curtains, wall art, lighting and more. Your bedspread stays exactly the same.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
            💰 Balance: <span className="text-violet-700">{credits} credits</span>
          </div>
        </div>

        {/* Source tabs */}
        <div className="mx-auto mb-4 flex max-w-md gap-2">
          {(["upload", "sample"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                tab === t
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "upload" ? `Upload your image · ${COST.upload} cr` : `Use your scene · ${COST.sample} cr`}
            </button>
          ))}
        </div>

        {/* Source picker */}
        <div className="mx-auto mb-6 max-w-3xl rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl backdrop-blur-xl">
          {tab === "upload" ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 px-6 py-10 text-center transition hover:bg-cyan-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  e.target.value = "";
                }}
              />
              <span className="text-3xl">🖼️</span>
              <span className="mt-2 text-sm font-bold text-slate-700">
                {uploading ? "Uploading…" : previewUrl && tab === "upload" ? "Change image" : "Click to upload your room photo"}
              </span>
              <span className="mt-1 text-xs text-slate-400">JPG / PNG / WebP, up to 10 MB</span>
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_SCENES.map((s) => (
                <button
                  key={s.path}
                  type="button"
                  onClick={() => pickSample(s.path)}
                  className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition ${
                    imageUrl === absolute(s.path) ? "border-cyan-500 shadow-lg" : "border-slate-200 hover:border-cyan-300"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.path}
                    alt={s.label}
                    className="h-28 w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
                    }}
                  />
                  <span className="block px-2 py-1.5 text-xs font-bold text-slate-600">{s.label}</span>
                </button>
              ))}
              <p className="col-span-3 text-center text-[11px] text-slate-400">
                Add room photos to <code>/public/scene-samples/</code> to enable these.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="mx-auto mb-4 max-w-3xl rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700">
            {error}
          </p>
        )}

        {/* Preview + analyze */}
        {displaySrc && (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/60 bg-white p-3 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displaySrc} alt="Scene" className="h-auto w-full rounded-2xl" />
          </div>
        )}

        {displaySrc && elements.length === 0 && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={analyze}
              disabled={!canAnalyze}
              className={`inline-flex items-center justify-center rounded-2xl px-8 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl transition ${
                canAnalyze
                  ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 hover:scale-[1.02] active:scale-95"
                  : "cursor-not-allowed bg-slate-400"
              }`}
            >
              {analyzing ? "Analyzing scene…" : `Analyze scene · ${analyzeCost} credits`}
            </button>
          </div>
        )}

        {/* Detected elements → dropdowns */}
        {elements.length > 0 && (
          <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800">Change an element</h2>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                {COST.change} credit per change
              </span>
            </div>
            <div className="grid gap-3">
              {elements.map((el) => {
                const hasRef = Boolean(refs[el.id]);
                return (
                  <div
                    key={el.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
                  >
                    <span className="min-w-[120px] text-sm font-bold text-slate-700">{el.name}</span>

                    {hasRef ? (
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={refs[el.id]} alt="Your product" className="h-9 w-9 rounded-lg object-cover" />
                        <span className="flex-1 text-xs font-bold text-emerald-700">Using your own {el.name.toLowerCase()}</span>
                        <button
                          type="button"
                          onClick={() => setRefs((p) => { const n = { ...p }; delete n[el.id]; return n; })}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <select
                        value={sel[el.id] || el.options[0] || ""}
                        onChange={(e) => setSel((p) => ({ ...p, [el.id]: e.target.value }))}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                      >
                        {el.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Upload your own product for this element */}
                    {!hasRef && (
                      <label
                        className={`shrink-0 cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 ${
                          refUploading === el.id ? "pointer-events-none opacity-60" : ""
                        }`}
                        title={`Upload your own ${el.name} to place it in the scene`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={refUploading !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadRef(el, f);
                            e.target.value = "";
                          }}
                        />
                        {refUploading === el.id ? "Uploading…" : "⬆ Upload yours"}
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={() => applyChange(el)}
                      disabled={editingId !== null || refUploading !== null}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black text-white transition ${
                        editingId === el.id
                          ? "bg-slate-400"
                          : editingId !== null
                            ? "cursor-not-allowed bg-slate-300"
                            : "bg-violet-600 hover:bg-violet-500"
                      }`}
                    >
                      {editingId === el.id ? "Applying…" : hasRef ? `Place yours · ${COST.change} cr` : `Apply · ${COST.change} cr`}
                    </button>
                  </div>
                );
              })}
            </div>

            {work?.b64 && (
              <div className="mt-4 text-center">
                <a
                  href={work.b64}
                  download="agentforge-scene.png"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-500"
                >
                  ⬇️ Download edited scene
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
