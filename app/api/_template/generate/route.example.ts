// ============================================================
// TEMPLATE — secure generate route for a new AgentForge agent
// ============================================================
// HOW TO USE
//   1. Copy this entire folder to app/api/<your-agent-slug>/generate
//      and rename `route.example.ts` → `route.ts`.
//   2. Pick a creditMode:
//        "server" → this route deducts atomically (recommended).
//        "n8n"    → the n8n workflow deducts inside the flow
//                   (only if your workflow already calls
//                   deduct_credits() correctly with 4 args).
//   3. Add the n8n webhook URL to .env.local (server-side, NOT
//      NEXT_PUBLIC_*) and list its var name in webhookEnvVars.
//   4. Fill in validateBody / collectUrls / buildGenerationRows /
//      buildForwardPayload for your agent's shape.
//   5. From the client, POST here with:
//        headers.Authorization = `Bearer ${session.access_token}`
//        body = whatever your validateBody expects
//
// WHAT THIS GUARANTEES (without you writing any boilerplate)
//   ✅ 401 if the caller has no/invalid Supabase JWT
//   ✅ 400 if the body fails your validator
//   ✅ 400 if any URL in the body isn't AgentForge-hosted (SSRF block)
//   ✅ 400 if required_credits > maxCreditsPerCall
//   ✅ 402 if the user has insufficient credits (server mode)
//   ✅ Atomic credit deduction + audit row in credit_transactions
//   ✅ Server-side generations row insert (no client tampering)
//   ✅ user_id is overwritten from the verified JWT before
//      forwarding — agents cannot trust client-supplied IDs
//   ✅ Credits refunded automatically on every failure path:
//      DB insert error · n8n unreachable · n8n 4xx/5xx
//   ✅ Consistent response shape across every agent:
//      { success, agent, generation_id, new_balance, webhook_response }
// ============================================================

import {
  createSecureGenerateRoute,
  isAgentForgeHostedUrl,
  isUuidish,
  type GenerationRow,
} from "@/lib/createSecureGenerateRoute";

export const runtime = "nodejs";

// ────────────────────────────────────────────────────────────
// 1. Body shape — what the client must send.
// ────────────────────────────────────────────────────────────
type Body = {
  generation_mode: "single";
  generation_id: string;          // UUID, generated client-side with crypto.randomUUID()
  required_credits: number;       // billed amount (must be ≤ maxCreditsPerCall)
  source_image_url: string;       // Supabase Storage public URL of the upload
  // Add agent-specific fields here…
};

// ────────────────────────────────────────────────────────────
// 2. Compose the secure handler.
// ────────────────────────────────────────────────────────────
export const POST = createSecureGenerateRoute<Body>({
  agentSlug: "your-agent-slug",            // e.g. "ugc-forge", "election-campaign"
  reasonLabel: "your_agent_generate",      // shows up in credit_transactions.reason
  webhookEnvVars: ["N8N_YOUR_AGENT_WEBHOOK_URL"],
  creditMode: "server",                    // "server" deducts here, "n8n" lets workflow do it
  maxCreditsPerCall: 1000,                 // safety cap
  maxBulkItems: 50,                        // if you support bulk; ignore otherwise

  // ── 2a. Validate the body shape (NO auth/URL checks here — factory does those)
  validateBody: (raw) => {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "Body must be JSON." };
    }
    const b = raw as any;

    if (b.generation_mode !== "single") {
      return { ok: false, error: "generation_mode must be 'single'." };
    }
    if (!isUuidish(b.generation_id)) {
      return { ok: false, error: "generation_id missing / not a UUID." };
    }
    // Don't validate URLs here — collectUrls below feeds them to the factory's
    // SSRF check, which is uniform across every agent.
    return { ok: true, body: b as Body };
  },

  // ── 2b. List every URL in the body that the factory should allowlist-check.
  collectUrls: (body) => [body.source_image_url],

  // ── 2c. Build the generations row(s) inserted server-side before forwarding.
  buildGenerationRows: (body, userId): GenerationRow[] => [
    {
      id: body.generation_id,
      user_id: userId,
      status: "pending",
      design_url: body.source_image_url,
      input_image_url: body.source_image_url,
      agent_type: "your-agent-slug",
      category: "your-agent-slug",
    },
  ],

  // ── 2d. Build the JSON payload forwarded to n8n. The factory overwrites
  //       user_id from the JWT — you don't need to set it here.
  buildForwardPayload: (body) => ({
    ...body,
    // Any agent-specific transformations / additions go here
  }),

  // ── 2e. Which id goes into the audit log + response.
  pickAuditId: (body) => body.generation_id,
});

// ────────────────────────────────────────────────────────────
// 3. CLIENT-SIDE — wire your page like this:
// ────────────────────────────────────────────────────────────
//
//   import { supabase } from "@/lib/supabase";
//   import { track } from "@/lib/analytics";
//
//   async function generate(payload) {
//     const { data: sess } = await supabase.auth.getSession();
//     const jwt = sess.session?.access_token;
//     if (!jwt) {
//       alert("Please sign in.");
//       return;
//     }
//
//     track({ name: "generation_started", agent: "your-agent-slug" as never, credits: payload.required_credits });
//
//     const res = await fetch("/api/your-agent-slug/generate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${jwt}`,
//       },
//       body: JSON.stringify(payload),
//     });
//     const data = await res.json();
//
//     if (!res.ok) {
//       track({
//         name: "generation_failed",
//         agent: "your-agent-slug" as never,
//         stage: "n8n",
//         reason: data?.error ?? `status_${res.status}`,
//       });
//       alert(data?.error ?? "Generation failed.");
//       return;
//     }
//
//     // success — `data.new_balance` is the freshly deducted balance.
//     // Save data.generation_id, poll generations.status for completion,
//     // then call refreshProfile().
//   }
//
// ────────────────────────────────────────────────────────────
// 4. n8n WORKFLOW — what the webhook receives:
// ────────────────────────────────────────────────────────────
//   {
//     ...body fields you sent...,
//     user_id: "<JWT-verified UUID>"   ← always trustworthy
//   }
//
//   Your workflow MUST NOT:
//     ❌ insert into generations (server already did)
//     ❌ trust any user_id from anywhere other than this payload
//
//   Your workflow MUST:
//     ✅ update generations SET status='completed' (success) or
//        'failed' (worker error) on the row whose id = body.generation_id
//     ✅ if creditMode === "n8n", call deduct_credits with FOUR args:
//          {
//            "p_user_id":       "{{ $json.user_id }}",
//            "p_amount":        {{ $json.required_credits }},
//            "p_reason":        "your_agent_generate",
//            "p_generation_id": "{{ $json.generation_id }}"
//          }
//        and call refund_credits with the same 4 args on failure.
//
// ────────────────────────────────────────────────────────────
// 5. ENV VARS — add to .env.local AND production:
// ────────────────────────────────────────────────────────────
//   N8N_YOUR_AGENT_WEBHOOK_URL=https://n8n.aiagentforge.in/webhook/your-agent
//
// ────────────────────────────────────────────────────────────
