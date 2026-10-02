"use client";

// Credits screen — shown at "/billing" and "/pricing" inside the
// Android app (while APP_PURCHASES_ENABLED is false, lib/appMode.ts).
//
// Credit packs are sold here through Google Play Billing — Play Store
// does not allow another checkout for digital credits inside an app.
// Flow: Google Play payment sheet → /api/play-billing/verify checks the
// purchase with Google and adds the credits → balance refreshes.
//
// If this build of the app has no Play Billing (older APK, browser
// preview) or the packs are not created in Play Console yet, the
// screen falls back to a plain "buy on the website" note.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RefreshCw, Zap } from "lucide-react";

import { useAuth } from "@/app/components/AuthProvider";
import {
  buyPlayProduct,
  finishPlayPurchase,
  getOpenPlayPurchases,
  getPlayProducts,
  isPlayBillingAvailable,
  type PlayPurchase,
  type PlayStoreProduct,
} from "@/lib/native";
import { PLAY_PRODUCTS } from "@/lib/playBilling";
import { supabase } from "@/lib/supabase";

type Notice = { kind: "ok" | "info" | "error"; text: string };

const card =
  "rounded-3xl border border-black/8 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]";

export default function AppCredits() {
  const { user, profile, credits, loading, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [storeProducts, setStoreProducts] = useState<PlayStoreProduct[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const userId = user?.id;

  // Always call the latest refreshProfile without re-running the effects below.
  const refreshRef = useRef(refreshProfile);
  useEffect(() => {
    refreshRef.current = refreshProfile;
  }, [refreshProfile]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  /** Sends a paid purchase to the server, which checks it with Google and adds the credits. */
  const settle = useCallback(async (purchase: PlayPurchase, opts: { quiet?: boolean } = {}) => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const jwt = sess.session?.access_token;
      const res = await fetch("/api/play-billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ productId: purchase.productId, purchaseToken: purchase.purchaseToken }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        pending?: boolean;
        alreadyProcessed?: boolean;
        creditsAdded?: number;
        error?: string;
      };

      if (json.pending) {
        setNotice({ kind: "info", text: "Payment is still pending. Your credits are added as soon as Google Play confirms it." });
        return;
      }
      if (!res.ok || !json.success) {
        if (!opts.quiet) {
          setNotice({
            kind: "error",
            text: `${json.error || "We could not confirm the purchase yet."} Open this screen again in a minute — you will not be charged twice.`,
          });
        }
        return;
      }

      // Credits are in — let Google Play know the pack was used, then show the new balance.
      await finishPlayPurchase(purchase.purchaseToken);
      await refreshRef.current();
      if (!json.alreadyProcessed) {
        setNotice({ kind: "ok", text: `${(json.creditsAdded ?? 0).toLocaleString("en-IN")} credits added to your account.` });
      }
    } catch {
      if (!opts.quiet) {
        setNotice({
          kind: "error",
          text: "No internet while confirming the purchase. Open this screen again when you are online — you will not be charged twice.",
        });
      }
    }
  }, []);

  // Load packs from Google Play, and finish any purchase that was paid
  // but not completed (app closed mid-way, slow payment that came through).
  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      if (!(await isPlayBillingAvailable())) return;
      const products = await getPlayProducts(PLAY_PRODUCTS.map((p) => p.productId));
      if (!active) return;
      setStoreProducts(products);
      const open = await getOpenPlayPurchases();
      for (const purchase of open) {
        if (!active) return;
        if (purchase.purchased) await settle(purchase, { quiet: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, settle]);

  const buy = async (productId: string) => {
    if (!userId || buying) return;
    setBuying(productId);
    setNotice(null);
    try {
      const result = await buyPlayProduct(productId, userId);
      if (result.ok) {
        if (result.purchase.purchased) await settle(result.purchase);
        else setNotice({ kind: "info", text: "Payment is still pending. Your credits are added as soon as Google Play confirms it." });
        return;
      }
      if (result.cancelled) return;
      if (result.alreadyOwned) {
        // Paid earlier but never finished — finish it now instead of failing.
        const open = await getOpenPlayPurchases();
        const mine = open.find((p) => p.productId === productId && p.purchased);
        if (mine) {
          await settle(mine);
          return;
        }
      }
      setNotice({ kind: "error", text: result.message });
    } finally {
      setBuying(null);
    }
  };

  const packs = PLAY_PRODUCTS.flatMap((pack) => {
    const store = storeProducts.find((s) => s.productId === pack.productId);
    return store ? [{ ...pack, priceString: store.priceString }] : [];
  });

  if (!loading && !user) {
    return (
      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-6 pb-6 pt-16 text-center text-[#111827] dark:text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
          <Zap className="h-8 w-8 fill-current" />
        </span>
        <h2 className="mt-5 text-xl font-black">Login to see your credits</h2>
        <p className="mt-2 text-sm leading-6 text-black/55 dark:text-white/55">New accounts start with 100 free credits.</p>
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-600/25">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" />
        <div className="relative">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Credit balance</p>
          <p className="mt-1 flex items-center gap-2 text-5xl font-black leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
            <Zap className="h-8 w-8 fill-current" />
            {credits.toLocaleString("en-IN")}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider">
              {String(profile?.plan || "Free")} plan
            </p>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/20 px-3.5 text-[13px] font-black transition active:scale-95 disabled:opacity-70"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {notice && (
        <p
          role="status"
          className={`mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${
            notice.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : notice.kind === "info"
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-100"
                : "border-black/15 bg-black/[0.04] text-[#111827] dark:border-white/20 dark:bg-white/10 dark:text-white"
          }`}
        >
          {notice.kind === "ok" && <Check className="mt-1 h-4 w-4 shrink-0" />}
          <span>{notice.text}</span>
        </p>
      )}

      {packs.length > 0 ? (
        <>
          <h2 className="mb-3 mt-6 text-lg font-black">Buy credits</h2>
          <div className="grid gap-3">
            {packs.map((pack) => (
              <article key={pack.productId} className={`flex items-center gap-3 p-4 ${card}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">{pack.plan}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xl font-black leading-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <Zap className="h-4 w-4 fill-current text-cyan-500" />
                    {pack.credits.toLocaleString("en-IN")} credits
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-black/55 dark:text-white/55">{pack.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() => buy(pack.productId)}
                  disabled={buying !== null}
                  className="flex h-12 min-w-[104px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {buying === pack.productId ? "Please wait…" : pack.priceString}
                </button>
              </article>
            ))}
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-black/45 dark:text-white/45">
            Paid through Google Play. Credits are added right after payment.
          </p>
        </>
      ) : (
        <section className={`mt-4 p-5 ${card}`}>
          <h2 className="text-base font-black">Need more credits?</h2>
          <p className="mt-2 text-sm leading-6 text-black/60 dark:text-white/60">
            Credit packs are available on our website. Open{" "}
            <span className="font-black text-[#111827] dark:text-white">aiagentforge.in</span> in your browser, log in
            with this same account and buy a pack. Your new balance shows here right away — tap Refresh.
          </p>
        </section>
      )}

      <section className={`mt-4 p-5 ${card}`}>
        <h2 className="text-base font-black">How credits work</h2>
        <ul className="mt-3 grid gap-2.5 text-sm leading-6 text-black/60 dark:text-white/60">
          <li>Every image you generate uses credits from this balance.</li>
          <li>If a generation fails, its credits are returned automatically.</li>
          <li>Credits are shared across the app and the website.</li>
        </ul>
      </section>
    </main>
  );
}
