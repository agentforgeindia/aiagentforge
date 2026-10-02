"use client";

// Bottom tabs, sheets (Create / Account / Camera-or-Gallery), toast
// and the native bridge wiring. Only rendered inside the Android app.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronRight,
  Gift,
  Home,
  Images,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Moon,
  PlayCircle,
  Plus,
  Settings,
  Sun,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/app/components/AuthProvider";
import { useTheme } from "@/app/components/ThemeProvider";
import { APP_CAMERA_CHOOSER } from "@/lib/appMode";
import {
  authCallbackPathFromAppUrl,
  closeInAppBrowser,
  exitApp,
  getLaunchUrl,
  hasNativePlugin,
  hideSplash,
  isNative,
  onAppUrlOpen,
  onBackButton,
  saveFileToDevice,
  shareNative,
  takePhotoWithCamera,
} from "@/lib/native";
import { supabase } from "@/lib/supabase";
import { APP_AGENTS, FLOW_ROUTES, matchesRoute } from "./appData";
import { appToast, pushBackHandler, runBackHandlers, setToastListener } from "./appBus";

type Sheet = "create" | "account" | null;

const NO_TAB_ROUTES = [...FLOW_ROUTES, "/login", "/signup", "/complete-profile"];
const ACCOUNT_ROUTES = ["/profile", "/team", "/billing", "/pricing", "/settings", "/rewards", "/support"];

export default function AppBottom() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, credits } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Sheets remember the page they were opened on, so they close by
  // themselves when the page changes.
  const [sheetState, setSheetState] = useState<{ sheet: Sheet; path: string }>({ sheet: null, path: "" });
  const [pickerState, setPickerState] = useState<{ input: HTMLInputElement | null; path: string }>({ input: null, path: "" });
  const [toast, setToast] = useState<string | null>(null);

  const sheet: Sheet = sheetState.path === pathname ? sheetState.sheet : null;
  const pickerInput = pickerState.path === pathname ? pickerState.input : null;
  const setSheet = useCallback((next: Sheet) => setSheetState({ sheet: next, path: pathname }), [pathname]);
  const setPickerInput = useCallback(
    (input: HTMLInputElement | null) => setPickerState({ input, path: window.location.pathname }),
    [],
  );

  const showTabs = !matchesRoute(pathname, NO_TAB_ROUTES);

  /* ───────── Toast ───────── */
  useEffect(() => {
    let timer: number | undefined;
    setToastListener((message) => {
      setToast(message);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), 3200);
    });
    return () => {
      window.clearTimeout(timer);
      setToastListener(null);
    };
  }, []);

  /* ───────── Sheets close on Android back ───────── */
  useEffect(() => {
    if (!sheet) return;
    return pushBackHandler(() => setSheet(null));
  }, [sheet, setSheet]);

  useEffect(() => {
    if (!pickerInput) return;
    return pushBackHandler(() => setPickerInput(null));
  }, [pickerInput, setPickerInput]);

  /* ───────── Lock page scroll behind an open sheet ───────── */
  useEffect(() => {
    if (!sheet && !pickerInput) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet, pickerInput]);

  /* ───────── Native: splash, back button, login link ───────── */
  const pathRef = useRef(pathname);
  const lastBackRef = useRef(0);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!isNative()) return;
    hideSplash();

    const offBack = onBackButton(({ canGoBack }) => {
      if (runBackHandlers()) return;
      const path = pathRef.current;
      if (path === "/") {
        const now = Date.now();
        if (now - lastBackRef.current < 2000) {
          exitApp();
        } else {
          lastBackRef.current = now;
          appToast("Press back again to exit");
        }
        return;
      }
      if (path === "/agents" || path === "/my-creations") {
        router.replace("/");
        return;
      }
      if (canGoBack) window.history.back();
      else router.replace("/");
    });

    const openAuthLink = (url: string) => {
      const target = authCallbackPathFromAppUrl(url);
      if (!target) return;
      closeInAppBrowser();
      window.location.replace(target);
    };
    const offUrl = onAppUrlOpen(openAuthLink);

    // App was closed while the browser was open: the link arrives as the launch URL.
    void getLaunchUrl().then((url) => {
      if (!url) return;
      try {
        if (sessionStorage.getItem("af_launch_url_done") === url) return;
        sessionStorage.setItem("af_launch_url_done", url);
      } catch {
        return;
      }
      openAuthLink(url);
    });

    return () => {
      offBack();
      offUrl();
    };
  }, [router]);

  /* ───────── Native: downloads + share ───────── */
  useEffect(() => {
    if (!isNative()) return;
    const cleanups: (() => void)[] = [];

    if (hasNativePlugin("Filesystem")) {
      // Remember blobs behind blob: URLs — pages revoke the URL right after
      // starting a download, so we cannot re-fetch it afterwards.
      const blobs = new Map<string, Blob>();
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      URL.createObjectURL = function (obj: Blob | MediaSource) {
        const url = origCreate.call(URL, obj);
        if (obj instanceof Blob) {
          blobs.set(url, obj);
          if (blobs.size > 12) blobs.delete(blobs.keys().next().value as string);
        }
        return url;
      };
      URL.revokeObjectURL = function (url: string) {
        origRevoke.call(URL, url);
        window.setTimeout(() => blobs.delete(url), 30_000);
      };

      const handleDownload = (anchor: HTMLAnchorElement): boolean => {
        const href = anchor.href;
        if (!href) return false;
        const name = anchor.getAttribute("download") || "agentforge.png";
        const known = blobs.get(href);
        void (async () => {
          try {
            const blob = known ?? (await (await fetch(href)).blob());
            const result = await saveFileToDevice(blob, name);
            if (!result.ok) appToast("Could not save the file.");
            else if (result.location === "gallery") appToast("Saved to Gallery (Pictures › AgentForge)");
            else if (result.location === "downloads") appToast("Saved to Downloads › AgentForge");
          } catch {
            appToast("Could not save the file. Check your internet.");
          }
        })();
        return true;
      };

      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        if (this.hasAttribute("download") && handleDownload(this)) return;
        origClick.call(this);
      };

      const onDocClick = (event: MouseEvent) => {
        const target = event.target as Element | null;
        const anchor = target?.closest?.("a[download]") as HTMLAnchorElement | null;
        if (anchor && handleDownload(anchor)) event.preventDefault();
      };
      document.addEventListener("click", onDocClick, true);

      cleanups.push(() => {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        HTMLAnchorElement.prototype.click = origClick;
        document.removeEventListener("click", onDocClick, true);
      });
    }

    // Android WebView has no navigator.share — route it to the native share sheet.
    if (hasNativePlugin("Share") && typeof navigator.share !== "function") {
      const nav = navigator as unknown as Record<string, unknown>;
      try {
        Object.defineProperty(nav, "share", {
          configurable: true,
          writable: true,
          value: async (data: ShareData) => {
            const ok = await shareNative({
              title: data?.title,
              text: data?.text,
              url: data?.url,
              files: data?.files ? Array.from(data.files) : undefined,
            });
            if (!ok) throw new DOMException("Share is not available", "AbortError");
          },
        });
        Object.defineProperty(nav, "canShare", { configurable: true, writable: true, value: () => true });
        cleanups.push(() => {
          delete nav.share;
          delete nav.canShare;
        });
      } catch {
        /* ignore */
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  /* ───────── Native: Camera / Gallery choice for image uploads ───────── */
  const bypassRef = useRef<WeakSet<HTMLInputElement>>(new WeakSet());

  useEffect(() => {
    if (!APP_CAMERA_CHOOSER || !isNative() || !hasNativePlugin("Camera")) return;
    const onClick = (event: MouseEvent) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
      if (bypassRef.current.has(input)) {
        bypassRef.current.delete(input);
        return;
      }
      const accept = (input.accept || "").toLowerCase();
      const wantsImage = accept.includes("image") || /\.(png|jpe?g|webp)/.test(accept);
      if (!wantsImage || input.hasAttribute("capture") || input.disabled) return;
      event.preventDefault();
      setPickerInput(input);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [setPickerInput]);

  const pickFromGallery = useCallback(() => {
    const input = pickerInput;
    setPickerInput(null);
    if (!input || !input.isConnected) return;
    bypassRef.current.add(input);
    input.click();
  }, [pickerInput, setPickerInput]);

  const pickFromCamera = useCallback(async () => {
    const input = pickerInput;
    setPickerInput(null);
    if (!input) return;
    const file = await takePhotoWithCamera();
    if (!file || !input.isConnected) return;
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      // Could not hand the photo to the page — fall back to the normal picker.
      bypassRef.current.add(input);
      input.click();
    }
  }, [pickerInput, setPickerInput]);

  /* ───────── Account sheet actions ───────── */
  const logout = async () => {
    setSheet(null);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl: string | undefined = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const accountActive = sheet === "account" || (sheet === null && matchesRoute(pathname, ACCOUNT_ROUTES));
  const tabClass = (active: boolean) =>
    `flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-black transition active:scale-95 ${
      active ? "text-cyan-600 dark:text-cyan-300" : "text-black/45 dark:text-white/45"
    }`;

  const accountLinks: { href: string; label: string; Icon: LucideIcon; needsUser?: boolean }[] = [
    { href: "/profile", label: "My Profile", Icon: User, needsUser: true },
    { href: "/team", label: "My Team", Icon: Users, needsUser: true },
    { href: "/billing", label: "Credits", Icon: Zap, needsUser: true },
    { href: "/rewards", label: "Refer & Earn", Icon: Gift, needsUser: true },
    { href: "/gallery", label: "Gallery", Icon: Images },
    { href: "/tutorials", label: "Tutorials", Icon: PlayCircle },
    { href: "/support", label: "Support", Icon: LifeBuoy },
    { href: "/settings", label: "Settings", Icon: Settings, needsUser: true },
  ];

  const sheetPanel =
    "relative w-full max-w-xl rounded-t-[1.75rem] border-t border-black/8 bg-white text-[#111827] shadow-2xl dark:border-white/10 dark:bg-[#0b1220] dark:text-white";
  const safeBottom = { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" };

  return (
    <>
      {/* Space so page content is never hidden behind the tab bar */}
      {showTabs && <div aria-hidden className="h-24 shrink-0" />}

      {/* ───────── Bottom tabs ───────── */}
      {showTabs && (
        <nav
          aria-label="App navigation"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-black/8 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/95"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto flex h-16 max-w-xl items-stretch px-1">
            <Link href="/" className={tabClass(sheet === null && pathname === "/")}>
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link href="/agents" className={tabClass(sheet === null && pathname === "/agents")}>
              <LayoutGrid className="h-5 w-5" />
              Agents
            </Link>
            <div className="flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={() => setSheet(sheet === "create" ? null : "create")}
                aria-label="Create"
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-xl shadow-cyan-500/40 ring-4 ring-white transition active:scale-95 dark:ring-[#0b1220]"
              >
                <Plus className={`h-7 w-7 transition-transform ${sheet === "create" ? "rotate-45" : ""}`} />
              </button>
            </div>
            <Link href="/my-creations" className={tabClass(sheet === null && pathname === "/my-creations")}>
              <Images className="h-5 w-5" />
              Creations
            </Link>
            <button
              type="button"
              onClick={() => setSheet(sheet === "account" ? null : "account")}
              className={tabClass(accountActive)}
            >
              <User className="h-5 w-5" />
              Account
            </button>
          </div>
        </nav>
      )}

      {/* ───────── Create sheet ───────── */}
      {sheet === "create" && (
        <div className="fixed inset-0 z-[45] flex items-end justify-center">
          <button type="button" aria-label="Close" onClick={() => setSheet(null)} className="absolute inset-0 bg-black/45" />
          <div className={`${sheetPanel} px-4 pt-3`} style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
            <h2 className="text-lg font-black">What do you want to create?</h2>
            <div className="mt-3 grid gap-2.5">
              {APP_AGENTS.map((agent) => (
                <Link
                  key={agent.slug}
                  href={agent.link}
                  onClick={() => setSheet(null)}
                  className="flex items-center gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-3 transition active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.tint} text-white shadow-md`}>
                    <agent.Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-black leading-tight">{agent.title}</span>
                    <span className="mt-0.5 block text-[13px] text-black/55 dark:text-white/55">{agent.desc}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-black/35 dark:text-white/35" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────── Account sheet ───────── */}
      {sheet === "account" && (
        <div className="fixed inset-0 z-[45] flex items-end justify-center">
          <button type="button" aria-label="Close" onClick={() => setSheet(null)} className="absolute inset-0 bg-black/45" />
          <div
            className={`${sheetPanel} flex max-h-[86dvh] flex-col px-4 pt-3`}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-black/15 dark:bg-white/20" />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {user ? (
                <div className="flex items-center gap-3 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.06]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-base font-black text-white">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      String(displayName).charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-black">{displayName}</span>
                    <span className="block truncate text-xs text-black/55 dark:text-white/55">{user.email}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-cyan-500/10 px-3 py-1.5 text-[13px] font-black text-cyan-700 dark:text-cyan-200">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    {credits.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/signup"
                    onClick={() => setSheet(null)}
                    className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/25"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setSheet(null)}
                    className="flex h-12 items-center justify-center rounded-2xl border border-black/10 text-sm font-black dark:border-white/15"
                  >
                    Login
                  </Link>
                </div>
              )}

              <div className="mt-3 grid">
                {accountLinks
                  .filter((link) => user || !link.needsUser)
                  .map(({ href, label, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSheet(null)}
                      className="flex h-[52px] items-center gap-3 rounded-2xl px-2 text-[15px] font-bold transition active:bg-black/5 dark:active:bg-white/10"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="flex-1">{label}</span>
                      <ChevronRight className="h-4 w-4 text-black/30 dark:text-white/30" />
                    </Link>
                  ))}

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-[52px] items-center gap-3 rounded-2xl px-2 text-left text-[15px] font-bold transition active:bg-black/5 dark:active:bg-white/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                    {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                  </span>
                  <span className="flex-1">{darkMode ? "Light mode" : "Dark mode"}</span>
                </button>

                {user && (
                  <button
                    type="button"
                    onClick={logout}
                    className="flex h-[52px] items-center gap-3 rounded-2xl px-2 text-left text-[15px] font-bold text-black/60 transition active:bg-black/5 dark:text-white/60 dark:active:bg-white/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10">
                      <LogOut className="h-[18px] w-[18px]" />
                    </span>
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Camera / Gallery sheet ───────── */}
      {pickerInput && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
          <button type="button" aria-label="Close" onClick={() => setPickerInput(null)} className="absolute inset-0 bg-black/45" />
          <div className={`${sheetPanel} px-4 pt-3`} style={safeBottom}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Add photo</h2>
              <button
                type="button"
                onClick={() => setPickerInput(null)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={pickFromCamera}
                className="flex flex-col items-center gap-2 rounded-2xl border border-black/8 bg-black/[0.02] py-5 text-sm font-black transition active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.05]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md">
                  <Camera className="h-6 w-6" />
                </span>
                Camera
              </button>
              <button
                type="button"
                onClick={pickFromGallery}
                className="flex flex-col items-center gap-2 rounded-2xl border border-black/8 bg-black/[0.02] py-5 text-sm font-black transition active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.05]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                  <Images className="h-6 w-6" />
                </span>
                Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Toast ───────── */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 z-[130] flex justify-center px-4"
          style={{ bottom: showTabs ? "calc(env(safe-area-inset-bottom, 0px) + 84px)" : "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
        >
          <p className="max-w-sm rounded-full bg-[#111827] px-4 py-2.5 text-center text-[13px] font-bold text-white shadow-xl dark:bg-white dark:text-[#111827]">
            {toast}
          </p>
        </div>
      )}
    </>
  );
}
