"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getStoredUtm, clearStoredUtm } from "@/lib/utmAttribution";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    let active = true;

    const handleCallback = async () => {
      try {
        // onAuthStateChange will detect the hash fragment (#access_token=...)
        // and automatically establish the session
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!active) return;

          if (event === "SIGNED_IN" && session?.user) {
            setStatus("Logged in! Redirecting...");

            // Ensure profile exists with credits
            const userId = session.user.id;
            const { data: existing } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", userId)
              .single();

            if (!existing) {
              // Pick up the first-touch attribution captured by
              // UtmCapture on the visitor's landing page.
              const utm = getStoredUtm();
              const refCode = localStorage.getItem("af_ref_code");

              await supabase.from("profiles").upsert(
                {
                  id: userId,
                  email: session.user.email,
                  full_name:
                    session.user.user_metadata?.full_name ||
                    session.user.user_metadata?.name ||
                    session.user.email?.split("@")[0] ||
                    "Creator",
                  credits: 100,
                  utm_source: utm.utm_source ?? null,
                  utm_medium: utm.utm_medium ?? null,
                  utm_campaign: utm.utm_campaign ?? null,
                  utm_content: utm.utm_content ?? null,
                  utm_term: utm.utm_term ?? null,
                  referrer: utm.referrer ?? null,
                  landing_path: utm.landing_path ?? null,
                  first_seen_at: utm.first_seen_at ?? null,
                  // Direct referral attribution — always write so dashboard tracks
                  ...(refCode ? { referred_by: refCode.trim().toUpperCase() } : {}),
                },
                { onConflict: "id" },
              );

              // One-shot — clear so the next user on the same
              // device doesn't inherit this attribution.
              clearStoredUtm();
            }

            // Referral reward — process regardless of whether the profile
            // was just created here or already existed (email/password flow
            // creates the profile in ensureUserProfile before this callback
            // fires). process_referral() is idempotent — duplicate-safe.
            try {
              const refCode = localStorage.getItem("af_ref_code");
              if (refCode) {
                await supabase.rpc("process_referral", { p_ref_code: refCode });
                localStorage.removeItem("af_ref_code");
              }
            } catch { /* ignore referral errors */ }

            subscription.unsubscribe();
            router.replace("/");
            return;
          }

          if (event === "INITIAL_SESSION" && session?.user) {
            // Already signed in from a previous session
            setStatus("Session found! Redirecting...");
            subscription.unsubscribe();
            router.replace("/");
            return;
          }
        });

        // Fallback: if no auth event fires within 8 seconds, redirect to login
        setTimeout(() => {
          if (!active) return;
          setStatus("Authentication timed out. Redirecting to login...");
          router.replace("/login");
        }, 8000);
      } catch (err) {
        console.error("Auth callback error:", err);
        if (active) {
          setStatus("Something went wrong. Redirecting...");
          router.replace("/login");
        }
      }
    };

    handleCallback();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        <p className="text-lg font-bold">{status}</p>
        <p className="mt-2 text-sm text-white/50">Please wait...</p>
      </div>
    </main>
  );
}
