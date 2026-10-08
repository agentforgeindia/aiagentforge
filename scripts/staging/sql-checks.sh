#!/bin/bash
# Runs the pending migrations and their rollbacks on a local copy of the
# live schema and checks who can do what before / after / after rollback.
# Needs a local PostgreSQL (see README.md). Changes nothing outside it.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
export AF_STAGING_WORK="${AF_STAGING_WORK:-$REPO/.staging-work}"; mkdir -p "$AF_STAGING_WORK"; W="$AF_STAGING_WORK"
export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}" PGUSER="${PGUSER:-postgres}"
DB=afstaging; P="psql -d $DB -v ON_ERROR_STOP=1 -q"; R="$REPO/sql"
PENDING="00-backup-snapshot 01-meetings-one-booking-per-payment 02-creator-tables-private 03-storage-per-user-and-limits 04-ledger-lookup-and-one-duplicate-refund"
REVERSE="04-ledger-lookup-and-one-duplicate-refund 03-storage-per-user-and-limits 02-creator-tables-private 01-meetings-one-booking-per-payment"
snap() { psql -d "$1" -At -f "$HERE/snapshot.sql" > "$2"; }
phase() { python3 "$HERE/checks.py" "$1" "$2" | $P -At > /dev/null; }

python3 "$HERE/build_schema.py" > /dev/null
psql -d postgres -q -c "select pg_terminate_backend(pid) from pg_stat_activity where datname in ('$DB','${DB}_rb') and pid <> pg_backend_pid()" > /dev/null
psql -d postgres -q -v ON_ERROR_STOP=1 -c "drop database if exists ${DB}_rb" -c "drop database if exists $DB" -c "create database $DB"
$P -f "$W/00_live_replica.sql"; $P -f "$HERE/seed.sql"; $P -f "$HERE/harness.sql"
$P -c "insert into public.credit_transactions(user_id,type,amount,delta,reason,generation_id,balance_after) values ('11111111-1111-4111-8111-111111111111','deduct',15,-15,'seed','gen-seed',185)"
snap $DB "$W/snap_before.txt";                     phase 1-before before
for f in $PENDING; do $P -1 -f "$R/pending/$f.sql"; done;  echo "applied: 00 01 02 03 04"
snap $DB "$W/snap_after.txt";                      phase 2-after-migrations after
for f in $REVERSE; do $P -1 -f "$R/rollback/$f.rollback.sql"; done; echo "rolled back: 04 03 02 01"
snap $DB "$W/snap_rolledback.txt";                 phase 3-after-rollback before
diff "$W/snap_before.txt" "$W/snap_rolledback.txt" > /dev/null && echo "OK   state after rollback is identical to the state before (rules, indexes, buckets, functions, triggers)" || { echo "FAIL rollback did not restore the original state"; exit 1; }
for f in $(echo $PENDING | cut -d' ' -f2-); do $P -1 -f "$R/pending/$f.sql"; done; echo "re-applied: 01 02 03 04"
snap $DB "$W/snap_reapplied.txt";                  phase 4-after-reapply after
diff "$W/snap_after.txt" "$W/snap_reapplied.txt" > /dev/null && echo "OK   state after re-apply is identical to the first apply" || { echo "FAIL re-apply differs"; exit 1; }

# The rollback for the changes that are ALREADY live, on a throw-away copy.
psql -d postgres -q -v ON_ERROR_STOP=1 -c "create database ${DB}_rb template $DB"
P2="psql -d ${DB}_rb -v ON_ERROR_STOP=1 -q"
for f in $REVERSE; do $P2 -1 -f "$R/rollback/$f.rollback.sql"; done
$P2 -1 -f "$R/rollback/2026-10-07-p0-security.rollback.sql" && echo "OK   rollback of the already-live changes runs cleanly (5 sections)"
psql -d postgres -q -c "drop database ${DB}_rb"

echo; $P -At -F ' | ' -c "select phase, count(*) filter (where ok) || ' pass', count(*) filter (where not ok) || ' fail' from t.results group by 1 order by 1"
FAILS=$($P -At -c "select count(*) from t.results where not ok")
[ "$FAILS" = "0" ] || { $P -At -F ' | ' -c "select phase, name, expected, got, detail from t.results where not ok"; exit 1; }
echo "database left with migrations 00-04 applied (ready for stack.sh + e2e.cjs)"
