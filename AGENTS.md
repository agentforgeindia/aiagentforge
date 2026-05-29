<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Adding a new AgentForge agent

Every generate endpoint on this site MUST go through the secure factory at
`lib/createSecureGenerateRoute.ts`. The factory is the single source of truth
for auth, URL validation, atomic credit deduction, generations row insertion,
and refund-on-failure semantics. **Do not write a generate route by hand.**

This is enforced because the Pillar 5 security audit found old per-agent
routes had drifted — some trusted `body.user_id`, some skipped URL checks,
some deducted on the client. The factory makes drift impossible.

## The 6-step recipe (use this every time)

### 1. Copy the template
```
cp -r app/api/_template/generate app/api/<your-agent-slug>/generate
mv app/api/<your-agent-slug>/generate/route.example.ts \
   app/api/<your-agent-slug>/generate/route.ts
```

### 2. Edit the route — fill in
- `agentSlug` (e.g. `"election-campaign"`)
- `reasonLabel` (audit log tag, e.g. `"election_campaign_generate"`)
- `webhookEnvVars` (array of env-var names, **server-side, NOT `NEXT_PUBLIC_*`**)
- `creditMode` — pick one:
  - `"server"` → the route deducts atomically via `deduct_credits()` RPC (recommended)
  - `"n8n"`    → the workflow deducts (only OK if the workflow already uses the 4-arg RPC correctly)
- `maxCreditsPerCall` (per-call safety cap)
- `validateBody` — narrow the body to your agent's expected type
- `collectUrls` — return every URL the factory should allowlist-check
- `buildGenerationRows` — server-side generations table inserts
- `buildForwardPayload` — JSON sent to n8n
- `pickAuditId` — id used in the audit log + response

That's the whole route. Everything else (auth, URL allowlist, credits,
refunds, response shape) is handled by the factory.

### 3. Client page — always send the JWT
```ts
const { data: sess } = await supabase.auth.getSession();
const jwt = sess.session?.access_token;
fetch("/api/<your-agent-slug>/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  },
  body: JSON.stringify(payload),
});
```
Without the `Authorization` header the factory returns 401.

### 4. Analytics — wire the funnel events
```ts
import { track } from "@/lib/analytics";

track({ name: "generation_started", agent: "<your-agent>", credits });
// on success:
track({ name: "generation_completed", agent: "<your-agent>", generation_id, duration_ms });
// on failure stages — upload / deduct / n8n / polling:
track({ name: "generation_failed", agent: "<your-agent>", stage, reason });
// on credit barrier:
track({ name: "insufficient_credits", agent: "<your-agent>", required });
```
If you add a new agent slug, also add it to the `AgentName` union in
`lib/analytics.ts`.

### 5. n8n workflow — must follow these rules
- Webhook receives `body.user_id` that's **already JWT-verified**. Trust it; never re-derive.
- **Do not** insert into `generations` — the server already did it with `status='pending'`.
- **Do** update that row to `'completed'` (success) or `'failed'` (worker error).
- If `creditMode === "n8n"`, every Supabase RPC call must pass **four named arguments**:
  ```json
  {
    "p_user_id":       "{{ $json.user_id }}",
    "p_amount":         {{ $json.required_credits }},
    "p_reason":        "<your_agent>_generate",
    "p_generation_id": "{{ $json.generation_id }}"
  }
  ```
  Calling `deduct_credits` or `refund_credits` with 3 args returns PGRST203
  ("could not choose between candidates") because old overloads may still
  exist in shared DBs.

### 6. Env vars — set on every environment
```
N8N_<YOUR_AGENT>_WEBHOOK_URL=https://n8n.aiagentforge.in/webhook/<your-agent>
```
Add to `.env.local`, Vercel/host dashboard, and any preview environment.
**Never use `NEXT_PUBLIC_*` for webhook URLs** — the browser would call n8n
directly, bypassing all factory protections.

## What the factory always gives you

| Guarantee | How |
|---|---|
| `401` if no/invalid JWT | `requireUser(req)` |
| `400` on bad body shape | your `validateBody` |
| `400` on external/SSRF URLs | `firstUntrustedUrl(urls)` via `collectUrls` |
| `400` if credits > cap | `maxCreditsPerCall` |
| `402` on insufficient credits | atomic `deduct_credits()` (server mode) |
| Server-side generations row | `buildGenerationRows` + service-role insert |
| `user_id` always trustworthy in n8n | factory overwrites from JWT before forward |
| Auto-refund on any failure path | factory tracks `creditMode === "server"` deductions |
| Uniform response shape | `{ success, agent, generation_id, new_balance, webhook_response }` |

## Reference implementations

- `app/api/jewellery/generate/route.ts` — `creditMode: "server"`, single + bulk
- `app/api/textile/generate/route.ts` — `creditMode: "n8n"`, single per-item
- `app/api/productography/generate/route.ts` — `creditMode: "n8n"`, single per-item

When in doubt, copy the closest reference, then strip what doesn't apply.

## Database invariants (don't break these)

- `public.deduct_credits` and `public.refund_credits` must each have **exactly one** overload — the 4-arg `(uuid, bigint, text, text)` version. Old overloads cause PGRST203 ambiguity errors in n8n.
- The `BEFORE UPDATE` trigger `profiles_block_credit_tampering` may be DISABLED during migration but should be re-enabled after every workflow uses the RPC pattern. Verify with:
  ```sql
  select tgname, tgenabled from pg_trigger
  where tgname = 'profiles_block_credit_tampering';
  ```
  `tgenabled = 'O'` = enabled, `'D'` = disabled.
- `credit_transactions` columns: `id`, `user_id`, `delta` (bigint), `reason` (text), `generation_id` (text), `balance_after` (integer/bigint). The legacy `type` and `amount` columns are nullable and populated for backward compat.

## Common mistakes (caught in code review)

| Anti-pattern | Why it's wrong | Right way |
|---|---|---|
| Writing a route by hand instead of using the factory | Drift — security guarantees disappear | `createSecureGenerateRoute(...)` |
| `fetch(N8N_PUBLIC_WEBHOOK_URL, ...)` from the browser | n8n becomes publicly callable | Route through `/api/<agent>/generate` |
| Reading `body.user_id` in the route | Spoofable | Use the `user` returned by `requireUser` |
| `supabase.from("profiles").update({ credits: ... })` on client | Trigger throws + race condition | `deduct_credits()` / `refund_credits()` RPC |
| Calling RPC with 3 args | PGRST203 ambiguity | Always 4 named args |
| Inserting into `generations` from n8n | Duplicate with server insert | Only UPDATE; server INSERTs |
| Forgetting `Authorization` header on client fetch | 401 from factory | Always send `Bearer ${session.access_token}` |
| Adding `NEXT_PUBLIC_*` for webhook URL | Leaks URL to browser | Server-side env var only |

## Existing security primitives (don't reinvent)

- `lib/serverAuth.ts` — `requireUser(req)`, `getUserFromRequest(req)`
- `lib/creditsServer.ts` — `deductCredits`, `refundCredits`, `readCredits`
- `lib/uploadValidation.ts` — `isAllowedImageMime`, `isAgentForgeHostedUrl`, `firstUntrustedUrl`, `validateImageFile`
- `lib/analytics.ts` — `track`, `identify`, `reportAdsConversion`
- `lib/posts.ts` — typed CMS data layer (for content pages, not agents)
- `sql/credits.sql` — canonical credit functions + trigger + audit table
- `sql/posts.sql` — CMS schema

## When this doc gets out of date

If a future change needs every agent to do something new (e.g. a new safety
classifier, a new event), add it to the factory — not to each route. The
whole point is that one update propagates to all agents at once.
