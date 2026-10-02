// ============================================================
// App mode — the website running inside the AgentForge Android app
// ============================================================
// The Android app (see /mobile) is a native shell that loads this
// same website. It adds "AgentForgeApp/<version>" to the browser's
// user-agent and injects `window.Capacitor`. When we see either one
// (the first APK had no user-agent suffix) we switch to "app mode":
//
//   • website navbar / footer / marketing sections are hidden
//   • the app shell (top bar + bottom tabs) is shown instead
//
// Nothing here changes what a normal browser visitor sees.
//
// Preview without the APK: open any page with ?source=app
// (stays on for that browser tab; ?source=web turns it off).
// ============================================================

/** Token the Android shell appends to the user-agent (mobile/capacitor.config.json). */
export const APP_UA_TOKEN = "AgentForgeApp";

/** Class set on <html> before first paint when in app mode. */
export const APP_MODE_CLASS = "af-app";

/**
 * Website (Razorpay) checkout inside the app.
 *
 * Google Play requires Play Billing for digital goods sold inside an
 * app, so the website's /pricing and /billing pages stay OFF in the
 * app. Credits are sold there through Google Play Billing instead
 * (AppCredits screen + lib/playBilling.ts). Turning this on shows the
 * Razorpay pages inside the app — only for an APK that is not
 * distributed through Play Store.
 */
export const APP_PURCHASES_ENABLED = false;

/** Offer "Camera / Gallery" when an image upload field is tapped in the app. */
export const APP_CAMERA_CHOOSER = true;

/** Deep link the app listens on for Google login (mobile/android AndroidManifest.xml). */
export const APP_AUTH_REDIRECT = "agentforge://auth/callback";

/**
 * Inline script for <head>. Runs before first paint so app-mode CSS
 * applies immediately (no flash of the website navbar inside the app).
 */
export const APP_MODE_BOOT_SCRIPT =
  "(function(){try{var d=document.documentElement,s=window.sessionStorage,q=location.search;" +
  "if(/[?&]source=app(&|$)/.test(q))s.setItem('af_app_mode','1');" +
  "if(/[?&]source=web(&|$)/.test(q))s.removeItem('af_app_mode');" +
  "var c=window.Capacitor,n=false;try{n=!!(c&&c.isNativePlatform&&c.isNativePlatform());}catch(e){}" +
  "if(n||navigator.userAgent.indexOf('" +
  APP_UA_TOKEN +
  "')>-1||s.getItem('af_app_mode')==='1')d.classList.add('" +
  APP_MODE_CLASS +
  "');}catch(e){}})();";

/** True when the page is running in app mode. Client only. */
export function isAppMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains(APP_MODE_CLASS);
}
