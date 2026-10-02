// ============================================================
// POST /api/play-billing/verify
// ============================================================
// Called by the Android app after a Google Play purchase of a
// credit pack. The app sends only the product ID and the purchase
// token; everything else is checked here:
//
//   1. user comes from the Supabase JWT (never from the body)
//   2. the purchase is looked up at Google with our service account
//   3. it must be PURCHASED and must belong to this user
//   4. credits are added through the same idempotent RPC the
//      Razorpay flow uses (add_credits_for_payment) — a repeated
//      call for the same purchase adds nothing
//   5. the purchase is consumed at Google so the pack can be
//      bought again
//
// Env vars (server only — add to .env.local and the VPS):
//   GOOGLE_PLAY_SA_EMAIL         service account e-mail
//   GOOGLE_PLAY_SA_PRIVATE_KEY   its private key (\n escaped is fine)
//   GOOGLE_PLAY_PACKAGE_NAME     optional, default in.aiagentforge.mobile
// ============================================================

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { findPlayProduct, PLAY_PACKAGE_NAME_DEFAULT } from "@/lib/playBilling";
import { requireUser } from "@/lib/serverAuth";

export const runtime = "nodejs";

const PUBLISHER_API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

type GooglePurchase = {
  /** 0 = purchased, 1 = cancelled, 2 = pending */
  purchaseState?: number;
  /** 0 = not consumed yet, 1 = consumed */
  consumptionState?: number;
  orderId?: string;
  obfuscatedExternalAccountId?: string;
  /** 0 = test (licence tester) purchase; absent for real purchases */
  purchaseType?: number;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** OAuth access token for the Play Developer API (service account, JWT bearer grant). */
async function getPlayAccessToken(): Promise<string | null> {
  const email = process.env.GOOGLE_PLAY_SA_EMAIL?.trim();
  let key = process.env.GOOGLE_PLAY_SA_PRIVATE_KEY?.trim();
  if (!email || !key) return null;
  // Strip accidental surrounding quotes and turn escaped \n into real newlines.
  key = key.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n").trim();

  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsigned}.${signature}`,
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!json.access_token) {
    throw new Error(`Google sign-in for Play Billing failed: ${json.error_description || res.status}`);
  }
  return json.access_token;
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const body = (await request.json().catch(() => null)) as { productId?: unknown; purchaseToken?: unknown } | null;
    const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
    const purchaseToken = typeof body?.purchaseToken === "string" ? body.purchaseToken.trim() : "";

    if (!productId || !purchaseToken || purchaseToken.length > 2000) {
      return NextResponse.json({ error: "Missing purchase details." }, { status: 400 });
    }

    const product = findPlayProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "Unknown credit pack." }, { status: 400 });
    }

    const accessToken = await getPlayAccessToken();
    if (!accessToken) {
      console.error("[play-billing] GOOGLE_PLAY_SA_EMAIL / GOOGLE_PLAY_SA_PRIVATE_KEY are not set.");
      return NextResponse.json({ error: "In-app purchases are not set up on the server yet." }, { status: 503 });
    }

    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || PLAY_PACKAGE_NAME_DEFAULT;
    const purchaseUrl = `${PUBLISHER_API}/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(
      product.productId,
    )}/tokens/${encodeURIComponent(purchaseToken)}`;

    // ── 1. Ask Google whether this purchase is real ──────────────
    const lookup = await fetch(purchaseUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!lookup.ok) {
      const detail = await lookup.text().catch(() => "");
      console.error("[play-billing] purchase lookup failed:", lookup.status, detail.slice(0, 300));
      // 400/404/410 = Google does not know this token for this product.
      const unknown = lookup.status === 400 || lookup.status === 404 || lookup.status === 410;
      return NextResponse.json(
        { error: unknown ? "Google Play could not find this purchase." : "Could not reach Google Play. Try again." },
        { status: unknown ? 400 : 502 },
      );
    }
    const purchase = (await lookup.json()) as GooglePurchase;

    if (purchase.purchaseState === 2) {
      // Slow payment methods — credits are added once Google marks it paid.
      return NextResponse.json({ success: false, pending: true });
    }
    if (purchase.purchaseState !== 0) {
      return NextResponse.json({ error: "This purchase was cancelled." }, { status: 400 });
    }

    // The app tags every purchase with the buyer's user id. A token that was
    // bought for another account must not credit this one.
    if (purchase.obfuscatedExternalAccountId && purchase.obfuscatedExternalAccountId !== user.id) {
      return NextResponse.json({ error: "This purchase belongs to a different account." }, { status: 403 });
    }

    // ── 2. Add credits (idempotent on the payment id) ────────────
    const tokenHash = crypto.createHash("sha256").update(purchaseToken).digest("hex").slice(0, 32);
    const orderId = purchase.orderId || `gplay_${tokenHash}`;
    const paymentId = `gplay:${tokenHash}`;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("add_credits_for_payment", {
      p_user_id: user.id,
      p_amount: product.amount,
      p_credits: product.credits,
      p_plan: product.plan,
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId,
      p_razorpay_signature: purchase.purchaseType === 0 ? "google_play_test" : "google_play",
      p_billing_name: null,
      p_billing_phone: null,
      p_billing_email: user.email,
      p_billing_company: null,
      p_billing_address: null,
      p_billing_gstin: null,
    });

    if (error) {
      console.error("[play-billing] add_credits_for_payment failed:", error);
      return NextResponse.json({ error: error.message || "Could not credit account." }, { status: 500 });
    }

    const result = (data ?? {}) as { added?: boolean; credits_added?: number; new_balance?: number };

    // ── 3. Same follow-ups as a website payment (best effort) ────
    if (result.added) {
      try {
        await supabaseAdmin.rpc("record_referral_earning", {
          p_user_id: user.id,
          p_order_id: orderId,
          p_amount: product.amount,
          p_payment_id: paymentId,
        });
      } catch (e) {
        console.error("[play-billing] record_referral_earning failed:", e);
      }
      try {
        await supabaseAdmin.rpc("add_user_notification", {
          p_user_id: user.id,
          p_title: "Payment successful ✅",
          p_body: `${product.credits.toLocaleString("en-IN")} credits added to your account (${product.plan} plan).`,
          p_link: "/billing",
        });
      } catch (e) {
        console.error("[play-billing] add_user_notification failed:", e);
      }
    }

    // ── 4. Consume at Google so the pack can be bought again ─────
    // (Also counts as acknowledging — unacknowledged purchases are
    // refunded by Google after 3 days.) The app retries this on its
    // side too, so a failure here is not fatal.
    if (purchase.consumptionState !== 1) {
      try {
        const consume = await fetch(`${purchaseUrl}:consume`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (!consume.ok) {
          console.error("[play-billing] consume failed:", consume.status, (await consume.text().catch(() => "")).slice(0, 300));
        }
      } catch (e) {
        console.error("[play-billing] consume failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: !result.added,
      creditsAdded: result.credits_added ?? 0,
      totalCredits: result.new_balance ?? 0,
    });
  } catch (error) {
    console.error("[play-billing] verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Purchase verification failed." },
      { status: 500 },
    );
  }
}
