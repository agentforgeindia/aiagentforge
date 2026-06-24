"use client";

// ============================================================
// SceneEditPanel — drop-in AI scene editor.
// Give it a scene image URL; it auto-detects the changeable décor
// (lamp, curtains, plant, wall art, lighting …) and lets the user
// swap each one — or upload their own product — while the bedspread
// stays untouched. Each change costs 4 credits; analyze is free.
//
// Used inline under "Upload Your Scene" in the mockup flow, and can
// be reused on the final result. Edits are saved back to storage and
// reported via onSceneUpdated so the parent generation uses them.
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";

const CHANGE_COST = 4;

type Element = { id: string; name: string; options: string[] };

function rid() {
  return Math.random().toString(36).slice(2, 8);
}

export default function SceneEditPanel({
  sceneUrl,
  onSceneUpdated,
}: {
  sceneUrl: string;
  onSceneUpdated?: (url: string) => void;
}) {
  const { user, credits, refreshProfile } = useAuth();

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(sceneUrl);
  const [elements, setElements] = useState<Element[]>([]);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [refUploading, setRefUploading] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // A fresh scene upload resets the editor.
  useEffect(() => {
    setCurrent(sceneUrl);
    setElements([]);
    setSel({});
    setRefs({});
    setError("");
    setOpen(false);
  }, [sceneUrl]);

  const token = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  // data-URL → Supabase → public URL (so edits feed back into generation).
  const saveToStorage = async (dataUrl: string): Promise<string> => {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `scene-editor/${user?.id || "guest"}/edited/${Date.now()}-${rid()}.png`;
    const { error: upErr } = await supabase.storage
      .from("designs")
      .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: "image/png" });
    if (upErr) throw upErr;
    return supabase.storage.from("designs").getPublicUrl(path).data.publicUrl;
  };

  const analyze = async () => {
    if (!current || analyzing) return;
    setError("");
    setAnalyzing(true);
    setOpen(true);
    try {
      const res = await fetch("/api/scene/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ image_url: current, source: "inline" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not analyze the scene.");
        return;
      }
      setElements(json.elements || []);
      setSel(Object.fromEntries((json.elements || []).map((e: Element) => [e.id, e.options[0] || ""])));
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
      const path = `scene-editor/${user?.id || "guest"}/refs/${Date.now()}-${rid()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("designs")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const url = supabase.storage.from("designs").getPublicUrl(path).data.publicUrl;
      setRefs((p) => ({ ...p, [el.id]: url }));
    } catch {
      setError("Product image upload failed.");
    } finally {
      setRefUploading(null);
    }
  };

  const applyChange = async (el: Element) => {
    if (editingId || !current) return;
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
        body: JSON.stringify({ image_url: current, ...(ref ? { reference_url: ref } : {}), instruction }),
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
      // Persist the edited scene so the main generation uses it.
      const newUrl = await saveToStorage(json.image_b64);
      setCurrent(newUrl);
      setRefs((p) => { const n = { ...p }; delete n[el.id]; return n; });
      onSceneUpdated?.(newUrl);
      refreshProfile?.();
    } catch {
      setError("Something went wrong while editing.");
    } finally {
      setEditingId(null);
    }
  };

  if (!sceneUrl) return null;

  return (
    <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-3">
      {!open ? (
        <button
          type="button"
          onClick={analyze}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-black text-white shadow transition hover:scale-[1.01] active:scale-95"
        >
          ✨ Customize this scene with AI
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px]">analyze free</span>
        </button>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black text-violet-700">Customize scene</span>
            <span className="text-[11px] font-bold text-slate-500">
              {CHANGE_COST} cr / change · Balance: {credits}
            </span>
          </div>

          {/* Live preview of the (edited) scene */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt="Scene" className="mb-2 h-auto w-full rounded-xl border border-white" />

          {analyzing && <p className="py-3 text-center text-xs font-bold text-slate-500">Detecting elements…</p>}

          {error && (
            <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-center text-[11px] font-bold text-rose-700">
              {error}
            </p>
          )}

          <div className="grid gap-2">
            {elements.map((el) => {
              const hasRef = Boolean(refs[el.id]);
              return (
                <div key={el.id} className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-2 sm:flex-row sm:items-center">
                  <span className="min-w-[110px] text-xs font-bold text-slate-700">{el.name}</span>
                  {hasRef ? (
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={refs[el.id]} alt="Your product" className="h-7 w-7 rounded object-cover" />
                      <span className="flex-1 text-[11px] font-bold text-emerald-700">Using your own</span>
                      <button type="button" onClick={() => setRefs((p) => { const n = { ...p }; delete n[el.id]; return n; })} className="text-[11px] font-bold text-rose-600">✕</button>
                    </div>
                  ) : (
                    <select
                      value={sel[el.id] || el.options[0] || ""}
                      onChange={(e) => setSel((p) => ({ ...p, [el.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400"
                    >
                      {el.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  )}
                  {!hasRef && (
                    <label className={`shrink-0 cursor-pointer rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 ${refUploading === el.id ? "pointer-events-none opacity-60" : ""}`}>
                      <input type="file" accept="image/*" className="hidden" disabled={refUploading !== null} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRef(el, f); e.target.value = ""; }} />
                      {refUploading === el.id ? "…" : "⬆ Yours"}
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => applyChange(el)}
                    disabled={editingId !== null || refUploading !== null}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-black text-white ${
                      editingId === el.id ? "bg-slate-400" : editingId !== null ? "cursor-not-allowed bg-slate-300" : "bg-violet-600 hover:bg-violet-500"
                    }`}
                  >
                    {editingId === el.id ? "…" : `Apply · ${CHANGE_COST}`}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
