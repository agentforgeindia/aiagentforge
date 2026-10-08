# Local staging stack

There is no hosted staging environment. This folder builds one on a
developer machine so the pending database migrations, their rollbacks and
the money-related API routes can be exercised for real **without touching
production**.

Everything here talks to `127.0.0.1` only. The "keys" in these files are
made-up local values — never put a real key in this folder.

## What it is

| Piece | What it stands in for |
|---|---|
| local PostgreSQL, database `afstaging` | the Supabase database — all 99 tables, their rules (RLS), indexes, storage rules and the functions the app calls, rebuilt from `live_full_schema.json` (schema only, **no customer data**) |
| PostgREST | the Supabase REST API the app and n8n talk to |
| `gateway.cjs` | Supabase auth (`/auth/v1/user`), the Razorpay API (orders / payments you register for a test) and the n8n webhooks |
| the built app (`next start`) | the real application code of this branch |

The stand-in n8n workflow has modes (`patched`, `old`, `fail`,
`fail-old-refund`, `hang`, `dead`) so the app can be tested against a
workflow that honours `skip_credit_deduction`, one that ignores it, one
that fails, one that never answers, and one that is not there.

## Run it

Needs: PostgreSQL 16+ (`initdb`, `pg_ctl`, `psql`), Node 22, Python 3, and
the PostgREST binary (https://github.com/PostgREST/postgrest/releases —
put it at `.staging-work/postgrest` or set `POSTGREST_BIN`).

```bash
# 0. a throw-away PostgreSQL on port 54329 (once)
initdb -D /var/lib/postgresql/afstaging/data -U postgres --auth=trust
pg_ctl -D /var/lib/postgresql/afstaging/data -o "-p 54329 -c listen_addresses=127.0.0.1" -l /tmp/afstaging.log start

# 1. Supabase advisor fixes (06, 07): regenerate 06, compare before / after
#    for every table and API function, run Supabase's own advisor queries
mkdir -p .staging-work/splinter && curl -sSL -o .staging-work/splinter/splinter.sql \
  https://raw.githubusercontent.com/supabase/splinter/main/splinter.sql
scripts/staging/advisor-checks.sh

# 2. migrations 00–07 + rollbacks + access checks (44 checks × 4 phases)
scripts/staging/sql-checks.sh

# 3. build the app with the staging environment, start the stack
scripts/staging/build-app.sh
scripts/staging/stack.sh up

# 4. unit checks (24), end-to-end checks (112), browser checks (15)
node scripts/staging/unit.cjs
node scripts/staging/e2e.cjs
node scripts/staging/ui.cjs        # needs Playwright + Chromium

scripts/staging/stack.sh down
```

`sql-checks.sh` rebuilds the database from scratch each time and leaves it
with migrations 00–07 applied, which is the state step 4 expects.
`stack.sh up` refuses to continue if an older app server is still holding
the port or the server is not serving the current build.

## What the checks cover

- `sql-checks.sh` — applies `sql/pending/00…04`, runs every rollback in
  `sql/rollback/`, and proves the rollback returns rules, indexes, bucket
  settings, functions and triggers to exactly the state before. Before and
  after each step it tries 44 actions as a visitor, a customer, another
  customer, a team role without the permission, the founder and the server.
- `e2e.cjs` — price list (15 / 17 / 30 / 32) for all three agents with a
  browser that lies about the price; one payer per generation; refunds
  (amount from the ledger, once, also under concurrency); stuck jobs and
  the sweeper; rating reward; Razorpay verification for plans, meetings'
  order type, the careers deposit and workshop seats, incl. the webhook;
  every `/api/admin/*` endpoint without login and as an ordinary customer;
  creator portal sessions; direct database access from the browser; rate
  limits.
- `unit.cjs` — the duplicate-charge arithmetic and order verification.
- `advisor-checks.sh` — for migrations 06 and 07: 53 made-up people and up
  to 4 made-up rows in every table; who can read / insert / update / delete
  what (81,620 actions) and what every API function answers (2,226 calls),
  before, after and after rollback; then Supabase's advisor queries
  (`lint.py`).
- `ui.cjs` — in a real browser: the mobile-number popup (30 seconds,
  "Later", required at Generate, validation, save), pricing text, hidden
  Social Publisher pages.
- e2e sections 10–11 — lifetime plans (no expiry on purchase), Empire is
  charged credits, the API functions after the advisor clean-up.

## What it does NOT prove

- The real n8n workflows (the stand-in only imitates their credit steps).
- Real Razorpay / RazorpayX, Zoom, email, WhatsApp.
- The Supabase Storage service itself (file size / MIME limits are checked
  as settings; the upload rules are checked at the database level).
- PostgreSQL 17 specifics (live is 17, this is whatever is installed).
- nginx (`X-Real-IP`) and the systemd timer on the VPS.

## Refreshing `live_full_schema.json`

It was taken from the live database on 2026-10-08 with read-only catalog
queries (table definitions, keys, indexes, policies, the functions signed-in
users can call plus the credit functions, bucket settings, grants). If the
live schema changes, re-take it the same way; never export rows.
`lint.py` on a freshly built replica must print the same counts as the
Supabase advisor — that is the check that the copy is faithful.
