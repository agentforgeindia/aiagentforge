// ============================================================
// Native bridge — talks to the Android shell (see /mobile)
// ============================================================
// The Android app injects `window.Capacitor` into this website.
// Every function here is a no-op / returns a "not available"
// result in a normal browser, so callers never need to check.
//
// We call the injected bridge directly instead of adding the
// @capacitor/* npm packages to the website bundle — the website's
// dependencies stay exactly as they are.
// ============================================================

import { APP_AUTH_REDIRECT } from "@/lib/appMode";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NativePlugin = Record<string, (...args: any[]) => any>;

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  Plugins?: Record<string, NativePlugin | undefined>;
};

type ListenerHandle = { remove?: () => unknown };

function capacitor(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap || typeof cap.isNativePlatform !== "function") return null;
  try {
    return cap.isNativePlatform() ? cap : null;
  } catch {
    return null;
  }
}

function plugin(name: string): NativePlugin | null {
  return capacitor()?.Plugins?.[name] ?? null;
}

/** True only inside the real Android app (not the ?source=app browser preview). */
export function isNative(): boolean {
  return capacitor() !== null;
}

export function hasNativePlugin(name: string): boolean {
  return plugin(name) !== null;
}

/* ───────────── App lifecycle ───────────── */

export function hideSplash(): void {
  try {
    void plugin("SplashScreen")?.hide?.({ fadeOutDuration: 200 });
  } catch {
    /* ignore */
  }
}

export function exitApp(): void {
  try {
    void plugin("App")?.exitApp?.();
  } catch {
    /* ignore */
  }
}

function listen(
  pluginName: string,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (data: any) => void,
): () => void {
  const p = plugin(pluginName);
  if (!p?.addListener) return () => {};
  let handle: ListenerHandle | null = null;
  let removed = false;
  try {
    const result = p.addListener(eventName, handler) as ListenerHandle | Promise<ListenerHandle>;
    Promise.resolve(result)
      .then((h) => {
        handle = h;
        if (removed) void h?.remove?.();
      })
      .catch(() => {});
  } catch {
    /* ignore */
  }
  return () => {
    removed = true;
    try {
      void handle?.remove?.();
    } catch {
      /* ignore */
    }
  };
}

/** Android hardware / gesture back. Returns an unsubscribe function. */
export function onBackButton(handler: (info: { canGoBack: boolean }) => void): () => void {
  return listen("App", "backButton", (data) => handler({ canGoBack: !!data?.canGoBack }));
}

/** Fired when the app is opened through a link (e.g. after Google login). */
export function onAppUrlOpen(handler: (url: string) => void): () => void {
  return listen("App", "appUrlOpen", (data) => {
    if (typeof data?.url === "string") handler(data.url);
  });
}

export async function getLaunchUrl(): Promise<string | null> {
  try {
    const res = await plugin("App")?.getLaunchUrl?.();
    return typeof res?.url === "string" ? res.url : null;
  } catch {
    return null;
  }
}

/* ───────────── Google login ───────────── */

/**
 * Google blocks its login page inside an app's WebView, so in the
 * app we open it in the phone's browser tab and come back through
 * the agentforge://auth/callback link.
 *
 * Returns `handled: false` in a normal browser — the caller then
 * runs the usual website flow.
 */
export async function startNativeGoogleLogin(): Promise<{ handled: boolean; error?: string }> {
  const browser = plugin("Browser");
  if (!browser?.open) return { handled: false };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: APP_AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { handled: true, error: error?.message || "Could not start Google login." };
  }
  try {
    await browser.open({ url: data.url });
    return { handled: true };
  } catch (err) {
    return { handled: true, error: err instanceof Error ? err.message : "Could not open the browser." };
  }
}

/**
 * Turns agentforge://auth/callback#access_token=… into the website's
 * own /auth/callback URL, so the existing callback page finishes the
 * login exactly as it does on the web. Returns null for other links.
 */
export function authCallbackPathFromAppUrl(url: string): string | null {
  if (!url.startsWith(APP_AUTH_REDIRECT)) return null;
  const rest = url.slice(APP_AUTH_REDIRECT.length); // "?…", "#…" or ""
  if (rest && !rest.startsWith("?") && !rest.startsWith("#")) return null;
  return `/auth/callback${rest}`;
}

export function closeInAppBrowser(): void {
  try {
    const res = plugin("Browser")?.close?.();
    if (res && typeof res.catch === "function") res.catch(() => {});
  } catch {
    /* ignore */
  }
}

/* ───────────── Files: save + share ───────────── */

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

function safeFileName(name: string, blob: Blob): string {
  let clean = (name || "agentforge").replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "");
  if (!clean) clean = "agentforge";
  if (!/\.[a-z0-9]{2,5}$/i.test(clean)) {
    const ext =
      blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : blob.type === "text/csv" ? "csv" : "png";
    clean = `${clean}.${ext}`;
  }
  return clean;
}

function uniqueName(name: string): string {
  const dot = name.lastIndexOf(".");
  const stamp = Date.now().toString(36);
  return dot > 0 ? `${name.slice(0, dot)}-${stamp}${name.slice(dot)}` : `${name}-${stamp}`;
}

export type SaveResult =
  | { ok: true; location: "gallery" | "downloads" | "shared"; uri?: string }
  | { ok: false };

/**
 * Saves a generated image/file on the phone.
 * Tries Pictures/AgentForge (shows in Gallery), then Download/AgentForge,
 * and finally falls back to the share sheet.
 */
export async function saveFileToDevice(blob: Blob, fileName: string): Promise<SaveResult> {
  const fs = plugin("Filesystem");
  if (!fs?.writeFile) return { ok: false };

  const name = uniqueName(safeFileName(fileName, blob));
  let data: string;
  try {
    data = await blobToBase64(blob);
  } catch {
    return { ok: false };
  }

  const isImage = blob.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(name);
  const targets: { path: string; location: "gallery" | "downloads" }[] = [];
  if (isImage) targets.push({ path: `Pictures/AgentForge/${name}`, location: "gallery" });
  targets.push({ path: `Download/AgentForge/${name}`, location: "downloads" });

  for (const target of targets) {
    try {
      const res = await fs.writeFile({
        path: target.path,
        data,
        directory: "EXTERNAL_STORAGE",
        recursive: true,
      });
      return { ok: true, location: target.location, uri: res?.uri };
    } catch {
      /* try the next location */
    }
  }

  // Last resort: private cache + share sheet ("Save to device", WhatsApp…).
  try {
    const res = await fs.writeFile({ path: name, data, directory: "CACHE" });
    if (res?.uri && plugin("Share")?.share) {
      await plugin("Share")!.share({ files: [res.uri], dialogTitle: "Save or share" });
      return { ok: true, location: "shared", uri: res.uri };
    }
  } catch {
    /* ignore */
  }
  return { ok: false };
}

export type ShareInput = { title?: string; text?: string; url?: string; files?: File[] };

/** Opens the Android share sheet. Returns false when not available. */
export async function shareNative(input: ShareInput): Promise<boolean> {
  const share = plugin("Share");
  if (!share?.share) return false;

  const options: Record<string, unknown> = { dialogTitle: "Share" };
  if (input.title) options.title = input.title;
  if (input.text) options.text = input.text;
  if (input.url && /^https?:\/\//i.test(input.url)) options.url = input.url;

  if (input.files?.length) {
    const fs = plugin("Filesystem");
    const uris: string[] = [];
    if (fs?.writeFile) {
      for (const file of input.files) {
        try {
          const res = await fs.writeFile({
            path: uniqueName(safeFileName(file.name, file)),
            data: await blobToBase64(file),
            directory: "CACHE",
          });
          if (res?.uri) uris.push(res.uri);
        } catch {
          /* skip this file */
        }
      }
    }
    if (uris.length) options.files = uris;
  }

  if (!options.text && !options.url && !options.files) return false;
  try {
    await share.share(options);
  } catch {
    /* user closed the sheet — not an error */
  }
  return true;
}

/* ───────────── Camera ───────────── */

/** Opens the phone camera and returns the photo as a File (null if cancelled / unavailable). */
export async function takePhotoWithCamera(): Promise<File | null> {
  const camera = plugin("Camera");
  if (!camera?.getPhoto) return null;
  try {
    const photo = await camera.getPhoto({
      source: "CAMERA",
      resultType: "base64",
      quality: 92,
      width: 2400,
      height: 2400,
      correctOrientation: true,
      saveToGallery: false,
    });
    const base64: string | undefined = photo?.base64String;
    if (!base64) return null;
    const format = String(photo?.format || "jpeg").toLowerCase();
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new File([bytes], `photo-${Date.now()}.${format === "png" ? "png" : "jpg"}`, { type: mime });
  } catch {
    return null;
  }
}

/* ───────────── Google Play Billing (credit packs) ───────────── */

export type PlayStoreProduct = {
  productId: string;
  /** Price text from Google Play, already formatted for the user's country. */
  priceString: string;
};

export type PlayPurchase = {
  productId: string;
  purchaseToken: string;
  /** False while a slow payment method is still pending. */
  purchased: boolean;
};

/** True when this build of the app can sell through Google Play. */
export async function isPlayBillingAvailable(): Promise<boolean> {
  const billing = plugin("NativePurchases");
  if (!billing?.isBillingSupported) return false;
  try {
    const res = await billing.isBillingSupported();
    return !!res?.isBillingSupported;
  } catch {
    return false;
  }
}

/** Loads the packs (with live prices) that exist in Play Console. */
export async function getPlayProducts(productIds: string[]): Promise<PlayStoreProduct[]> {
  const billing = plugin("NativePurchases");
  if (!billing?.getProducts || productIds.length === 0) return [];
  try {
    const res = await billing.getProducts({ productIdentifiers: productIds, productType: "inapp" });
    const list: unknown[] = Array.isArray(res?.products) ? res.products : [];
    const out: PlayStoreProduct[] = [];
    for (const item of list) {
      const p = item as { identifier?: unknown; priceString?: unknown };
      if (typeof p.identifier === "string" && typeof p.priceString === "string" && p.priceString) {
        if (!out.some((o) => o.productId === p.identifier)) {
          out.push({ productId: p.identifier, priceString: p.priceString });
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlayPurchase(raw: any): PlayPurchase | null {
  const productId = raw?.productIdentifier;
  const purchaseToken = raw?.purchaseToken;
  if (typeof productId !== "string" || typeof purchaseToken !== "string" || !purchaseToken) return null;
  // Play's client library: 1 = PURCHASED, 2 = PENDING.
  return { productId, purchaseToken, purchased: String(raw?.purchaseState) === "1" };
}

/**
 * Opens Google Play's payment sheet for one pack.
 * `accountId` (the Supabase user id) is attached to the purchase so the
 * server can check the purchase belongs to this user.
 *
 * Nothing is consumed or acknowledged here — the server does that after
 * it has added the credits (/api/play-billing/verify).
 */
export async function buyPlayProduct(
  productId: string,
  accountId: string,
): Promise<
  | { ok: true; purchase: PlayPurchase }
  | { ok: false; cancelled: boolean; alreadyOwned: boolean; message: string }
> {
  const billing = plugin("NativePurchases");
  if (!billing?.purchaseProduct) {
    return { ok: false, cancelled: false, alreadyOwned: false, message: "In-app purchases are not available." };
  }
  try {
    const res = await billing.purchaseProduct({
      productIdentifier: productId,
      productType: "inapp",
      quantity: 1,
      appAccountToken: accountId,
      isConsumable: false,
      autoAcknowledgePurchases: false,
    });
    const purchase = toPlayPurchase(res);
    if (!purchase) {
      return { ok: false, cancelled: false, alreadyOwned: false, message: "Google Play did not return a purchase." };
    }
    return { ok: true, purchase };
  } catch (err) {
    // The bridge rejects with { message, code } (not always an Error instance).
    const e = (err ?? {}) as { message?: unknown; code?: unknown };
    const message = typeof e.message === "string" ? e.message : "";
    const all = `${message} ${typeof e.code === "string" ? e.code : ""}`;
    return {
      ok: false,
      cancelled: /cancel/i.test(all),
      alreadyOwned: /ALREADY_OWNED/i.test(all),
      message: message || "Purchase failed.",
    };
  }
}

/** Purchases Google Play still lists for this device (paid but not finished, or pending). */
export async function getOpenPlayPurchases(): Promise<PlayPurchase[]> {
  const billing = plugin("NativePurchases");
  if (!billing?.getPurchases) return [];
  try {
    const res = await billing.getPurchases({ productType: "inapp" });
    const list: unknown[] = Array.isArray(res?.purchases) ? res.purchases : [];
    return list.map(toPlayPurchase).filter((p): p is PlayPurchase => p !== null);
  } catch {
    return [];
  }
}

/**
 * Tells Google Play on the phone that the pack was used, so it can be
 * bought again. Safe to call when the server already consumed it.
 */
export async function finishPlayPurchase(purchaseToken: string): Promise<void> {
  const billing = plugin("NativePurchases");
  if (!billing?.consumePurchase) return;
  try {
    await billing.consumePurchase({ purchaseToken });
  } catch {
    /* already consumed on the server — fine */
  }
}
