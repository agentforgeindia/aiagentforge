<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Admin training rule (MANDATORY for every backend change)

The admin panel has a role-wise self-training course at `/admin/training`.
**Any new admin module, tab, workflow or important button must be added to the
training in the same change.**

1. New page → add it to a hub in `app/admin/adminHubs.tsx` (existing hub tab or a new hub, with EN + Hinglish label/description). New page not in `adminNav.tsx` TILES → add its permission to `EXTRA_PERM`.
2. Write/extend the lesson in `app/admin/training/lessons.ts` (EN + Hinglish): intro, steps, at least one quiz question. Spread correct answers across A/B/C/D — never always the same letter.
3. Changed how an existing screen works → update that hub's lesson steps/quiz too.
4. A hub without a written lesson gets an automatic basic lesson, and the founder sees it under Training → Team progress as "Needs a written lesson". That is a safety net, not a substitute.

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
| `client_source` on every row (app / mobile_web / web) | `detectClientSource(request)` from `lib/clientSource.ts` — the admin panel shows it |
| `user_id` always trustworthy in n8n | factory overwrites from JWT before forward |
| Auto-refund on any failure path | factory tracks `creditMode === "server"` deductions |
| Uniform response shape | `{ success, agent, generation_id, new_balance, webhook_response }` |

## Reference implementations

- `app/api/jewellery/generate/route.ts` — `creditMode: "server"`, single + bulk
- `app/api/textile/generate/route.ts` — the ROUTE charges (personal or team) and tells n8n to skip (`skip_credit_deduction: true`), single per-item
- `app/api/productography/generate/route.ts` — team: route charges; personal: n8n charges the server-computed amount, single per-item

When in doubt, copy the closest reference, then strip what doesn't apply.

## Database invariants (don't break these)

- `public.deduct_credits` and `public.refund_credits` must each have **exactly one** overload — the 4-arg `(uuid, bigint, text, text)` version. Old overloads cause PGRST203 ambiguity errors in n8n.
- The `BEFORE UPDATE` trigger `profiles_block_credit_tampering` may be DISABLED during migration but should be re-enabled after every workflow uses the RPC pattern. Verify with:
  ```sql
  select tgname, tgenabled from pg_trigger
  where tgname = 'profiles_block_credit_tampering';
  ```
  `tgenabled = 'O'` = enabled, `'D'` = disabled.
- `generations.client_source` (`app` / `mobile_web` / `web`, NULL = before tracking) must be set by every route that inserts a generations row: `client_source: detectClientSource(request)` (`lib/clientSource.ts`). The factory does it automatically; the hand-written textile / jewellery / productography routes do it themselves. Admin reads it through `generation_log_v2` and `generation_source_stats`.
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

## Credits, payments and storage — rules added 2026-10-07 (P0 security fixes)

- **Price list (Textile, Jewellery, Productography):** Premium 15 · Premium mobile 1080x1920 17 · Ultra HD 30 · Ultra HD mobile 32, +2 own scene, +2 own model, +1 per branding item. **Price is decided on the server:** `lib/creditPricing.ts` recomputes it from the request options and clamps the browser's `required_credits` into that range. If you change a price on an agent page, change it there in the same commit.
- **`deduct_credits()` returns JSON** (`{ success, remaining_credits | error }`), not a number. Always go through `deductCredits()` / `parseDeductResult()` in `lib/creditsServer.ts`. The n8n workflows read `.success` from the same JSON — do not change the return shape.
- **Every charge and refund is in the ledger** (`credit_transactions` / `team_credit_transactions`; the database functions write the rows). Set `credits_used` on the generations row only when the ROUTE charged the credits.
- **Refunds have ONE implementation: `lib/generationRefund.ts`.** The amount is what the ledger says is still charged (charged − already refunded), a generation is refunded once (atomic claim on `credits_refunded`), team generations go back to the team pool. It is used by `/api/credits/refund` (page asks), `/api/cron/generation-sweeper` (nobody asked) and the generate routes (`failAndRefundGeneration`, `closeRefundedGenerations`). Never write another refund path, and never take a refund amount from the browser. A route that refunds a whole request itself must call `closeRefundedGenerations()` for its rows.
- **Sweeper:** `/api/cron/generation-sweeper` (CRON_SECRET) closes generations stuck in pending/processing/queued, refunds failed ones from the ledger, and copies images that still sit on the provider's temporary link into storage.
- **Generation rows are inserted with `insertGenerationRowsStrict()`** (`lib/generationRows.ts`): a re-used id is a 409, never an overwrite. Browsers cannot insert or update `generations`; to save a branded/composite image or make a provider image permanent, call `finalizeGeneration()` (`lib/finalizeGeneration.ts` → `/api/generations/finalize`).
- **`skip_credit_deduction` is set by the route only.** Never forward the browser's value.
- **One payer per generation.** Team generation → the team pool (route). Personal generation → the user, once: either the route (Textile, Jewellery) or n8n (Productography personal), never both. When the route has charged it sends `skip_credit_deduction: true`, and every n8n workflow with a "deduct credits" step must honour it (cost 0 → no deduction, no refund of its own). The sweeper's "one payer" pass gives back a personal charge that duplicates the real one (ledger reason `refund:duplicate_charge`, at most one per generation); a non-zero `duplicate_charges_refunded` in the sweeper report means a workflow is ignoring the switch — fix the workflow.
- **PostgREST filters on writes:** on an `update()` / `delete()` that returns rows, use plain column filters (`.eq`, `.in`, `.neq`, `.not("col", "is", true)`). An `.or(...)` filter on a column that is not in the returned `select` makes the whole request fail ("column … does not exist"). `.or(...)` is fine on reads.
- **Rewards:** amounts live in `REWARD_RULES` (`lib/referral.ts`) — rating a completed generation = 1 credit, once, no extra for written feedback. Referral credits are given by `/api/referral/claim` (server), never by a browser RPC.
- **Razorpay:** the plan, buyer and amount come from the ORDER fetched back from Razorpay (`verifyPlanOrder()` / `verifyFixedPriceOrder()` in `lib/razorpayPlans.ts`) — never from the request body or `payment.notes`. A checkout signature alone is not proof of what was paid. One payment may create one thing (plan credits, one meeting, one workshop seat, one deposit). Every order our server creates carries `notes.type` (`credit_plan`, `meeting`, `workshop`, `security_deposit`); the route that confirms it must check that type, the exact amount and whom it was for (`verifyFixedPriceOrder`). The webhook files only `workshop` orders and untyped external payments (hosted pages, QR, links) as workshop registrations, and answers 503 (Razorpay retries) when it cannot read the order.
- **Admin routes:** EVERY `/api/admin/*` route calls `requireAdminPermission(req, "<permission>")` (or `adminFromAuthHeader`) from `lib/adminAuth.ts` before doing anything else — valid login + ACTIVE `admin_users` row + the role permission. "Is in admin_users" alone is not a check. Use the screen's permission for reads and the stricter one for money / destructive actions (`affiliates.manage`, `credits.grant`, `payments.manual_entry`, `invoices.refund`, `hr.manage`, `support.manage`). Admin pages must send `Authorization: Bearer <jwt>`.
- **Public endpoints that cost money or send messages** (AI analysis, OCR, chat, order creation, logins) call `rateLimit()` from `lib/rateLimit.ts`. `proxy.ts` adds a coarse per-IP limit to all of `/api/*`.
- **Never fetch a URL from a request directly.** Use `fetchTrustedImage()` (`lib/fetchTrustedImage.ts`) — own hosts only, redirects checked, size/type capped. `isAgentForgeHostedUrl()` trusts only our own Supabase project host and `aiagentforge.in`.
- **n8n webhooks:** send `n8nHeaders()` (adds `x-af-webhook-secret` when `N8N_WEBHOOK_SECRET` is set). Webhook URLs are server-only env vars — never reference them (or any `NEXT_PUBLIC_*N8N*` var) in a page.
- **Creator (influencer) portal:** a creator's record id is NOT a secret. Every creator API checks the signed session from `lib/influencerSession.ts` (`authorizeInfluencer`); the browser side is `lib/influencerClient.ts`. Payouts are only ever sent from the admin withdrawals route after approval.
- **Uploads from the browser** go to `<folder>/<user id | "guest">/<file>` with `storageSafeName(file)`; accepted formats are `ALLOWED_SOURCE_IMAGE_EXTENSIONS` in `lib/uploadValidation.ts` (the storage rules use the same list).
- **Database:** live changes are in `sql/2026-10-07-p0-security.sql`; migrations waiting for go-live are in `sql/pending/` (run `00-backup-snapshot.sql` first), each with a rollback in `sql/rollback/`. `profiles` columns other than contact/company/UTM fields cannot be changed from the browser; `referred_by` can be set once.

## Existing security primitives (don't reinvent)

- `lib/serverAuth.ts` — `requireUser(req)`, `getUserFromRequest(req)`
- `lib/adminAuth.ts` — `requireAdminPermission`, `adminFromAuthHeader`, `auditAdminAction`
- `lib/creditsServer.ts` — `deductCredits`, `refundCredits`, `readCredits`, `serviceDb`
- `lib/generationRefund.ts` — `refundFailedGeneration`, `failAndRefundGeneration`, `closeRefundedGenerations`
- `lib/rateLimit.ts` — `rateLimit`, `clientIp` · `lib/cronAuth.ts` — `authorizedCron`
- `lib/fetchTrustedImage.ts` — `fetchTrustedImage` · `lib/mirrorProviderImage.ts` — `mirrorProviderImage`
- `lib/influencerSession.ts` — `authorizeInfluencer`, `issueInfluencerToken`
- `lib/uploadValidation.ts` — `isAllowedImageMime`, `isAgentForgeHostedUrl`, `firstUntrustedUrl`, `validateImageFile`
- `lib/analytics.ts` — `track`, `identify`, `reportAdsConversion`
- `lib/posts.ts` — typed CMS data layer (for content pages, not agents)
- `sql/credits.sql` — canonical credit functions + trigger + audit table
- `sql/posts.sql` — CMS schema

## When this doc gets out of date

If a future change needs every agent to do something new (e.g. a new safety
classifier, a new event), add it to the factory — not to each route. The
whole point is that one update propagates to all agents at once.
