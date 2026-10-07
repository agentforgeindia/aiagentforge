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

Steps 3–5 need the new code to be live first (see the note at the top of
each file). Every file has a matching rollback in `sql/rollback/`.

All three were dry-run against the live database inside a transaction that
was rolled back (2026-10-07): they apply cleanly and the access checks
behave as described in each file.
