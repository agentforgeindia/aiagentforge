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
| local PostgreSQL, database `afstaging` | the Supabase database — same tables, rules (RLS), indexes, functions and storage rules as live, rebuilt from `live_schema.json` (schema only, **no customer data**) |
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

# 1. migrations + rollbacks + access checks (44 checks × 4 phases)
scripts/staging/sql-checks.sh

# 2. build the app with the staging environment, start the stack
eval "$(scripts/staging/stack.sh env)"
npx next build
scripts/staging/stack.sh up

# 3. unit checks + end-to-end checks (96)
node scripts/staging/unit.cjs
node scripts/staging/e2e.cjs

scripts/staging/stack.sh down
```

`sql-checks.sh` rebuilds the database from scratch each time and leaves it
with migrations 00–04 applied, which is the state step 3 expects.

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

## What it does NOT prove

- The real n8n workflows (the stand-in only imitates their credit steps).
- Real Razorpay / RazorpayX, Zoom, email, WhatsApp.
- The Supabase Storage service itself (file size / MIME limits are checked
  as settings; the upload rules are checked at the database level).
- PostgreSQL 17 specifics (live is 17, this is whatever is installed).
- nginx (`X-Real-IP`) and the systemd timer on the VPS.

## Refreshing `live_schema.json`

It was taken from the live database on 2026-10-08 with read-only catalog
queries (table definitions, constraints, indexes, policies, the functions
the tests call, bucket settings). If the live schema changes, re-take it the
same way; never export rows.
