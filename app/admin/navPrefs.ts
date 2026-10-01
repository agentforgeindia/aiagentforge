"use client";

// ============================================================
// Admin nav preferences — pinned modules, recently opened modules
// and sidebar collapse state. Stored per-browser in localStorage,
// synced across components via a window event.
// ============================================================

import { useCallback, useSyncExternalStore } from "react";

const PINNED_KEY = "af_admin_pinned";
const RECENT_KEY = "af_admin_recent";
const COLLAPSED_KEY = "af_admin_sidebar_collapsed";
const OPEN_GROUPS_KEY = "af_admin_open_groups";
const EVT = "af-admin-navprefs";
const MAX_RECENT = 6;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}

const cache = new Map<string, { raw: string | null; value: unknown }>();

function snapshot<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = raw === null ? fallback : read(key, fallback);
  cache.set(key, { raw, value });
  return value;
}

const serverCache = new Map<string, unknown>();
function serverSnapshot<T>(key: string, fallback: T): T {
  if (!serverCache.has(key)) serverCache.set(key, fallback);
  return serverCache.get(key) as T;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

function useStored<T>(key: string, fallback: T): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot(key, fallback),
    () => serverSnapshot(key, fallback),
  );
  const set = useCallback((v: T) => write(key, v), [key]);
  return [value, set];
}

export function usePinned() {
  const [pinned, setPinned] = useStored<string[]>(PINNED_KEY, []);
  const toggle = useCallback(
    (href: string) =>
      setPinned(
        pinned.includes(href)
          ? pinned.filter((h) => h !== href)
          : [...pinned, href],
      ),
    [pinned, setPinned],
  );
  return { pinned, setPinned, togglePin: toggle, isPinned: (h: string) => pinned.includes(h) };
}

export function useRecent() {
  const [recent] = useStored<string[]>(RECENT_KEY, []);
  return recent;
}

export function pushRecent(href: string) {
  if (typeof window === "undefined") return;
  const cur = read<string[]>(RECENT_KEY, []);
  if (cur[0] === href) return;
  write(RECENT_KEY, [href, ...cur.filter((h) => h !== href)].slice(0, MAX_RECENT));
}

export function useSidebarCollapsed() {
  return useStored<boolean>(COLLAPSED_KEY, false);
}

export function useOpenGroups() {
  return useStored<string[] | null>(OPEN_GROUPS_KEY, null);
}

export type AdminLang = "en" | "hi";
export function useLangPref() {
  return useStored<AdminLang>("af_admin_lang", "en");
}
