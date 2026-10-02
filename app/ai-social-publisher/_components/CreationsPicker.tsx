"use client";

// "My AgentForge creations" picker.
// Reads the logged-in user's own completed generations (read-only, same
// query as /my-creations). Falls back to public gallery samples.

import React, { useEffect, useMemo, useState } from "react";
import { X, Check, Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SAMPLE_CREATIONS } from "./data";
import { useStyles } from "./ui";

type Item = { id: string; url: string; agent: string };

const agentLabel = (g: Record<string, unknown>) => {
  const s = String(g.agent_slug || g.agent_type || g.agent || "").toLowerCase();
  if (s.includes("jewel")) return "Jewellery";
  if (s.includes("textile")) return "Textile";
  if (s.includes("product")) return "Productography";
  if (s.includes("social")) return "Social Ads";
  return "Other";
};

export default function CreationsPicker({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (items: { id: string; url: string }[]) => void;
}) {
  const { darkMode, muted, primaryBtn, ghostBtn } = useStyles();
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<Item[]>([]);
  const [filter, setFilter] = useState("All");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) return;
        const { data } = await supabase
          .from("generations")
          .select("id, status, output_image_url, output_url, image_url, result_url, agent_slug, agent_type, agent, created_at")
          .eq("user_id", uid)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(60);
        const rows = (data || [])
          .map((g: Record<string, unknown>) => ({
            id: String(g.id),
            url: String(g.output_image_url || g.output_url || g.result_url || g.image_url || ""),
            agent: agentLabel(g),
          }))
          .filter((r) => r.url.startsWith("http"));
        if (alive) setMine(rows);
      } catch {
        /* preview: ignore, samples will show */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const usingSamples = !loading && mine.length === 0;
  const items: Item[] = usingSamples ? SAMPLE_CREATIONS : mine;
  const filters = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.agent)))], [items]);
  const shown = filter === "All" ? items : items.filter((i) => i.agent === filter);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 10 ? p : [...p, id]));

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:rounded-3xl ${
          darkMode ? "border-white/10 bg-[#0b1220] text-white" : "border-black/10 bg-white text-slate-900"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.07] px-5 py-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-black">My AgentForge creations</h3>
            <p className={`text-xs ${muted}`}>
              {usingSamples ? "Abhi sample images dikh rahe hain (login karke apni creations dikhengi)." : "Jo image post karni hai wo select karo (max 10)."}
            </p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-full p-2 ${ghostBtn}`} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-5 pt-3">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${filter === f ? "bg-blue-600 text-white" : ghostBtn}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
            </div>
          ) : shown.length === 0 ? (
            <div className={`flex flex-col items-center py-16 text-sm ${muted}`}>
              <ImageOff className="mb-2 h-7 w-7" /> Koi creation nahi mili.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
              {shown.map((it) => {
                const idx = picked.indexOf(it.id);
                const on = idx >= 0;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggle(it.id)}
                    className={`relative aspect-square overflow-hidden rounded-2xl bg-black/5 transition ${on ? "ring-[3px] ring-cyan-400" : "hover:opacity-90"}`}
                  >
                    <img src={it.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <span
                      className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                        on ? "bg-cyan-500 text-white" : "border-2 border-white/90 bg-black/20"
                      }`}
                    >
                      {on ? idx + 1 : ""}
                    </span>
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white">{it.agent}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.07] px-5 py-3.5 dark:border-white/10">
          <span className={`text-xs font-semibold ${muted}`}>{picked.length} selected</span>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => {
              const map = new Map(items.map((i) => [i.id, i]));
              onAdd(picked.map((id) => ({ id, url: map.get(id)!.url })));
            }}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black ${primaryBtn}`}
          >
            <Check className="h-4 w-4" /> Add to post
          </button>
        </div>
      </div>
    </div>
  );
}
