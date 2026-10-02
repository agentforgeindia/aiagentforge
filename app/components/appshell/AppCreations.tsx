"use client";

// My Creations tab — shown at "/my-creations" inside the Android app.
// Same data as the website page (generations table), laid out as a
// phone gallery with a full-screen viewer.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Download, Images, Share2, X } from "lucide-react";

import { useAuth } from "@/app/components/AuthProvider";
import { saveFileToDevice, shareNative } from "@/lib/native";
import { supabase } from "@/lib/supabase";
import { APP_AGENTS } from "./appData";
import { appToast, pushBackHandler } from "./appBus";

type Creation = {
  id: string;
  design_url?: string | null;
  output_image_url?: string | null;
  output_url?: string | null;
  image_url?: string | null;
  status: string;
  product_type?: string | null;
  created_at: string;
};

const PAGE_SIZE = 30;

function imageOf(item: Creation): string | null {
  return item.output_image_url || item.output_url || item.image_url || item.design_url || null;
}

export default function AppCreations() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewing, setViewing] = useState<Creation | null>(null);
  const [busy, setBusy] = useState<"save" | "share" | null>(null);

  const userId = user?.id;

  const loadPage = useCallback(
    async (from: number) => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("generations")
        .select("id, design_url, output_image_url, output_url, image_url, status, product_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return (data as Creation[] | null) ?? [];
    },
    [userId],
  );

  useEffect(() => {
    if (authLoading || !userId) return;
    let active = true;
    loadPage(0)
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        setHasMore(rows.length === PAGE_SIZE);
      })
      .catch(() => {
        if (active) appToast("Could not load your creations. Check your internet.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, userId, loadPage]);

  // Android back closes the viewer first.
  useEffect(() => {
    if (!viewing) return;
    return pushBackHandler(() => setViewing(null));
  }, [viewing]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const rows = await loadPage(items.length);
      setItems((prev) => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      appToast("Could not load more. Check your internet.");
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchBlob = async (src: string) => {
    const res = await fetch(src);
    if (!res.ok) throw new Error("download failed");
    return res.blob();
  };

  const save = async (item: Creation) => {
    const src = imageOf(item);
    if (!src || busy) return;
    setBusy("save");
    try {
      const blob = await fetchBlob(src);
      const result = await saveFileToDevice(blob, `agentforge-${item.id}.png`);
      if (result.ok) {
        appToast(
          result.location === "gallery"
            ? "Saved to Gallery (Pictures › AgentForge)"
            : result.location === "downloads"
              ? "Saved to Downloads › AgentForge"
              : "Ready to save or share",
        );
      } else {
        // Browser preview / very old app build: normal download link.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `agentforge-${item.id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      appToast("Could not save the image. Check your internet.");
    } finally {
      setBusy(null);
    }
  };

  const share = async (item: Creation) => {
    const src = imageOf(item);
    if (!src || busy) return;
    setBusy("share");
    try {
      let shared = false;
      try {
        const blob = await fetchBlob(src);
        const file = new File([blob], `agentforge-${item.id}.png`, { type: blob.type || "image/png" });
        shared = await shareNative({ files: [file] });
        if (!shared && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
          shared = true;
        }
      } catch {
        /* fall through to link share */
      }
      if (!shared) shared = await shareNative({ url: src });
      if (!shared && navigator.share) {
        await navigator.share({ url: src });
        shared = true;
      }
      if (!shared) appToast("Sharing is not available on this device.");
    } catch {
      /* user closed the share sheet */
    } finally {
      setBusy(null);
    }
  };

  /* ───────── Logged out ───────── */
  if (!authLoading && !user) {
    return (
      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-6 pb-6 pt-16 text-center text-[#111827] dark:text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
          <Images className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-xl font-black">Login to see your creations</h2>
        <p className="mt-2 text-sm leading-6 text-black/55 dark:text-white/55">
          Everything you generate is saved here, on the app and the website.
        </p>
        <Link
          href="/login"
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
        >
          Login
        </Link>
      </main>
    );
  }

  return (
    <main className="relative mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-4 text-[#111827] dark:text-white">
      {authLoading || (userId && loading) ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/5 dark:bg-white/10" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center px-2 pt-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
            <Images className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-xl font-black">Nothing here yet</h2>
          <p className="mt-2 text-sm leading-6 text-black/55 dark:text-white/55">
            Create your first visual — it will be saved here automatically.
          </p>
          <div className="mt-6 grid w-full gap-2.5">
            {APP_AGENTS.map((agent) => (
              <Link
                key={agent.slug}
                href={agent.link}
                className="flex h-14 items-center gap-3 rounded-2xl border border-black/8 bg-white/85 px-4 text-left text-sm font-black transition active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.06]"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${agent.tint} text-white`}>
                  <agent.Icon className="h-4 w-4" />
                </span>
                {agent.title}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const src = imageOf(item);
              const done = item.status === "completed";
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!done || !src}
                  onClick={() => setViewing(item)}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-black/8 bg-black/5 text-left transition active:scale-[0.98] dark:border-white/10 dark:bg-white/5"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={item.product_type || "Creation"} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
                  ) : null}
                  {!done && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 text-white">
                      {item.status === "pending" ? (
                        <span className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : null}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {item.status === "pending" ? "Processing" : item.status}
                      </span>
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6">
                    <span className="block truncate text-[11px] font-black uppercase tracking-wider text-white">
                      {item.product_type || "Mockup"}
                    </span>
                    <span className="block text-[10px] font-semibold text-white/75">
                      {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white/85 text-sm font-black transition active:scale-[0.99] disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06]"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}

      {/* ───────── Full-screen viewer ───────── */}
      {viewing && imageOf(viewing) && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black">
          <div className="flex h-14 shrink-0 items-center justify-between px-3">
            <button
              type="button"
              onClick={() => setViewing(null)}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="truncate px-3 text-sm font-black uppercase tracking-wider text-white/80">
              {viewing.product_type || "Mockup"}
            </p>
            <span className="h-10 w-10" />
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageOf(viewing)!} alt="Creation preview" className="max-h-full max-w-full rounded-xl object-contain" />
          </div>
          <div
            className="grid shrink-0 grid-cols-2 gap-3 px-4 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          >
            <button
              type="button"
              onClick={() => save(viewing)}
              disabled={busy !== null}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-[#111827] transition active:scale-[0.98] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => share(viewing)}
              disabled={busy !== null}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              {busy === "share" ? "Opening…" : "Share"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
