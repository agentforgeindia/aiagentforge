// ============================================================
// Browser helper — ask the server to refund a FAILED generation.
// ============================================================
// The server decides whether anything is owed and how much (see
// lib/generationRefund.ts); this only says "please look at this
// one now" so the user does not wait for the sweeper. Never throws.
// ============================================================

import { supabase } from "@/lib/supabase";

export async function requestGenerationRefund(
  generationId: string,
  reason = "client_detected_failure",
): Promise<void> {
  try {
    if (!generationId) return;
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token;
    if (!jwt) return;
    await fetch("/api/credits/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ generation_id: generationId, reason }),
    });
  } catch (err) {
    console.warn("[requestGenerationRefund] skipped:", err);
  }
}

/** Shown when a generation fails after the credits were charged. */
export const GENERATION_FAILED_MESSAGE =
  "Generation failed. Any credits charged for it are returned to your balance automatically.";
