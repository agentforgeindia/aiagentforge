// ============================================================
// Client helper for POST /api/generations/finalize
// ============================================================
// Browsers cannot update the `generations` table (RLS), so the
// agent pages call this after a generation completes:
//
//   • finalizeGeneration(id, compositeUrl) — save the branded /
//     watermarked image the page just uploaded as the generation's
//     output, so My Creations shows the same picture the user saw.
//   • finalizeGeneration(id) — if the output still sits on the AI
//     provider's temporary link, copy it into AgentForge storage.
//
// Returns the permanent output URL, or null when nothing could be
// saved (the caller keeps showing the image it already has).
// Never throws.
// ============================================================

import { supabase } from "@/lib/supabase";

export async function finalizeGeneration(
  generationId: string,
  compositeUrl?: string,
): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token || !generationId) return null;

    const res = await fetch("/api/generations/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        generation_id: generationId,
        ...(compositeUrl ? { composite_url: compositeUrl } : {}),
      }),
    });
    if (!res.ok) return null;

    const json = (await res.json().catch(() => null)) as { output_url?: unknown } | null;
    return typeof json?.output_url === "string" && json.output_url ? json.output_url : null;
  } catch (error) {
    console.error("[finalizeGeneration] failed:", error);
    return null;
  }
}
