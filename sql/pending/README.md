# Pending migrations

These files are **not applied** to the live database yet. They go live
together with the code on this branch.

Order:

1. `00-backup-snapshot.sql` — copy of the affected tables and rules into a
   private schema. Run first.
2. Deploy the code.
3. `01-meetings-one-booking-per-payment.sql`
4. `02-creator-tables-private.sql`
5. `03-storage-per-user-and-limits.sql`
6. `04-ledger-lookup-and-one-duplicate-refund.sql`

Steps 3–5 need the new code to be live first (see the note at the top of
each file); step 6 can run at any time. Every file has a matching rollback
in `sql/rollback/` — roll back in reverse order (04, 03, 02, 01).

How they were checked:

- 2026-10-07 — 01, 02 and 03 were dry-run against the live database inside
  a transaction that was rolled back: they apply cleanly there.
- 2026-10-08 — all five, and all rollbacks, were run for real on a local
  copy of the live schema, rules and functions (`scripts/staging/`):
  44 access checks before, after, after rollback and after re-apply; the
  rollbacks return every rule, index, bucket setting, function and trigger
  to exactly the state before. The rollback file for the changes that are
  already live (`2026-10-07-p0-security.rollback.sql`) was run there too.
  The local copy is PostgreSQL 16; the live database is PostgreSQL 17.
