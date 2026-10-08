#!/bin/bash
# Proves that migrations 06 and 07 (Supabase advisor fixes) change the
# advisor's verdict and nothing else. Runs on a local copy of the live
# schema (database "afadvisor"); needs the same PostgreSQL as sql-checks.sh
# and Supabase's advisor queries in $AF_STAGING_WORK/splinter/splinter.sql
# (see lint.py).
#
#   1. build the replica, apply pending 00–05
#   2. make up people and rows; record who can do what on every table
#   3. regenerate + apply 06  → same answers, policy warnings gone
#   4. record what every API function answers for every person
#   5. apply 07               → same answers, function warnings gone
#   6. roll 07 and 06 back    → rules identical to step 2, answers too
#   7. apply both again (final state) and print the advisor result
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
export AF_STAGING_WORK="${AF_STAGING_WORK:-$REPO/.staging-work}"; mkdir -p "$AF_STAGING_WORK"; W="$AF_STAGING_WORK"
export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}" PGUSER="${PGUSER:-postgres}"
DB=afadvisor; P="psql -d $DB -v ON_ERROR_STOP=1 -q"; R="$REPO/sql"
FUNCS="$(python3 -c "import json;d=json.load(open('$HERE/live_full_schema.json'));print(','.join(sorted({m['name'] for m in d['secdef_meta']})))")"
pol() { psql -d $DB -At -c "select tablename, policyname, permissive, roles::text, cmd, coalesce(qual,''), coalesce(with_check,'') from pg_policies where schemaname='public' order by 1,2" > "$1"; }
rls() { for t in $(psql -d $DB -At -c "select distinct tbl from t.seed_sql order by 1"); do psql -d $DB -q -At -c "select t.rls_snapshot('$1', '$t')" > /dev/null; done; }
same() { # same <kind> <label a> <label b> <what>
  local n
  if [ "$1" = rls ]; then n=$(psql -d $DB -At -c "select count(*) from (select tbl,who,op,tag,outcome from t.rls_result where label='$2' except select tbl,who,op,tag,outcome from t.rls_result where label='$3' union all select tbl,who,op,tag,outcome from t.rls_result where label='$3' except select tbl,who,op,tag,outcome from t.rls_result where label='$2') x")
  else n=$(psql -d $DB -At -c "select count(*) from (select fn,who,outcome from t.fn_result where label='$2' except select fn,who,outcome from t.fn_result where label='$3' union all select fn,who,outcome from t.fn_result where label='$3' except select fn,who,outcome from t.fn_result where label='$2') x"); fi
  if [ "$n" = "0" ]; then echo "OK   $4"; else echo "FAIL $4 — $n differences"; psql -d $DB -c "select * from t.${1}_result where label in ('$2','$3') order by 2,3,4,1 limit 40" | head -60; exit 1; fi
}
lint() { python3 "$HERE/lint.py" $DB --json; }
want_zero() { python3 - "$1" <<'PY'
import json,sys
r=json.loads(sys.argv[1]); bad={k:v for k,v in r.items() if isinstance(v,dict) and v["level"] in ("WARN","ERROR") and v["count"]>0}
print("advisor (WARN/ERROR):", {k:v["count"] for k,v in bad.items()} or "none")
sys.exit(1 if bad else 0)
PY
}

python3 "$HERE/build_schema.py" > /dev/null
psql -d postgres -q -c "select pg_terminate_backend(pid) from pg_stat_activity where datname='$DB' and pid <> pg_backend_pid()" > /dev/null
psql -d postgres -q -v ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB"
$P -f "$W/00_live_replica.sql"
for f in 00-backup-snapshot 01-meetings-one-booking-per-payment 02-creator-tables-private 03-storage-per-user-and-limits 04-ledger-lookup-and-one-duplicate-refund 05-lifetime-plans-and-empire-credits; do $P -f "$R/pending/$f.sql"; done
echo "replica built, pending 00-05 applied"
echo "advisor before:  $(lint)"

# test rows must not be refused by foreign keys / value lists
$P -c "do \$\$ declare c record; begin for c in select conrelid::regclass t, conname from pg_constraint where connamespace='public'::regnamespace and contype in ('f','c') loop execute format('alter table %s drop constraint %I', c.t, c.conname); end loop; end \$\$"
$P -f "$HERE/advisor_tests.sql"
echo "people: $($P -At -c 'select t.setup_identities()')   rows: $($P -At -c 'select t.seed_rows()')"
pol "$W/pol_before.txt"; rls before
echo "recorded $($P -At -c "select count(*) from t.rls_result where label='before'") table actions (who can read / insert / update / delete what)"

python3 "$HERE/gen_policy_migration.py" $DB
$P -f "$R/pending/06-advisor-policies-and-indexes.sql"
rls after06;  same rls before after06 "06 applied: every table action gives the same result as before"

$P -At -c "select t.fn_snapshot('before', string_to_array('$FUNCS', ','))" > /dev/null
echo "recorded $($P -At -c "select count(*) from t.fn_result where label='before'") function calls"
$P -f "$R/pending/07-advisor-definer-functions.sql"
$P -At -c "select t.fn_snapshot('after07', string_to_array('$FUNCS', ','))" > /dev/null
# two intended differences: the unused generation_log is closed to signed-in users, and
# log_admin_action now refuses people who are not team members
psql -d $DB -At -F ' | ' -c "select b.fn, count(*) || ' people get a different answer', min(b.outcome) || '  ->  ' || min(a.outcome) from t.fn_result b join t.fn_result a on a.fn = b.fn and a.who = b.who and a.label = 'after07' where b.label = 'before' and a.outcome is distinct from b.outcome and b.fn in ('generation_log','log_admin_action') group by 1" | cut -c1-260 | sed 's/^/     intended: /'
psql -d $DB -q -c "create table if not exists t.fn_intended as select * from t.fn_result where false; insert into t.fn_intended select * from t.fn_result where fn in ('generation_log','log_admin_action'); delete from t.fn_result where fn in ('generation_log','log_admin_action')"
same fn before after07 "07 applied: 40 untouched functions answer every person exactly as before"
rls after07;  same rls before after07 "07 applied: every table action still gives the same result"
L="$(lint)"; echo "advisor after:   $L"; want_zero "$L"

$P -f "$R/rollback/07-advisor-definer-functions.rollback.sql"
$P -At -c "select t.fn_snapshot('rb07', string_to_array('$FUNCS', ','))" > /dev/null
psql -d $DB -q -c "delete from t.fn_result where fn in ('generation_log','log_admin_action')"
same fn before rb07 "07 rolled back: functions answer as before"
$P -f "$R/rollback/06-advisor-policies-and-indexes.rollback.sql"
pol "$W/pol_rolledback.txt"
diff "$W/pol_before.txt" "$W/pol_rolledback.txt" > /dev/null && echo "OK   06 rolled back: every rule is identical to before" || { echo "FAIL rules differ after rollback"; diff "$W/pol_before.txt" "$W/pol_rolledback.txt" | head -20; exit 1; }
rls rb06;  same rls before rb06 "06 rolled back: every table action gives the same result"

$P -f "$R/pending/06-advisor-policies-and-indexes.sql"; $P -f "$R/pending/07-advisor-definer-functions.sql"
echo "re-applied 06 + 07"; L="$(lint)"; echo "advisor final:   $L"; want_zero "$L"
