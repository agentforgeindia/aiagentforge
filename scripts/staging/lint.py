#!/usr/bin/env python3
"""Runs Supabase's own advisor queries (github.com/supabase/splinter) on the
local replica, so "the advisor shows no warning" can be checked before
anything touches production.

  python3 lint.py <database> [--json]

splinter.sql is downloaded once into the staging work folder:
  curl -sSL -o "$AF_STAGING_WORK/splinter/splinter.sql" \
    https://raw.githubusercontent.com/supabase/splinter/main/splinter.sql

Checks that need the real Supabase platform (auth settings, extension
versions, table bloat, index usage statistics) are not run here.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get("AF_STAGING_WORK", os.path.join(HERE, "..", "..", ".staging-work"))
SQL = open(os.path.join(WORK, "splinter", "splinter.sql")).read()
RUN = [
    "multiple_permissive_policies", "auth_rls_initplan", "duplicate_index",
    "authenticated_security_definer_function_executable", "anon_security_definer_function_executable",
    "function_search_path_mutable", "rls_disabled_in_public", "policy_exists_rls_disabled",
    "rls_policy_always_true", "rls_enabled_no_policy", "security_definer_view", "no_primary_key",
    "rls_references_user_metadata",
]
db = sys.argv[1]
env = dict(os.environ, PGHOST=os.environ.get("PGHOST", "127.0.0.1"), PGPORT=os.environ.get("PGPORT", "54329"), PGUSER=os.environ.get("PGUSER", "postgres"))
parts = re.split(r"\nunion all\n", SQL)
result = {}
for name in RUN:
    part = next((p for p in parts if re.search(r"'%s' as \"?name\"?" % name, p)), None)
    if part is None:
        result[name] = "not in splinter.sql"
        continue
    # "t" holds the test tools and "af_backup_*" the snapshot copies — neither exists in the API.
    q = "select count(*), coalesce(max(level), '') from (%s) x where coalesce(metadata->>'schema', '') <> 't' and coalesce(metadata->>'schema', '') not like 'af_backup%%'" % part.strip().rstrip(";")
    r = subprocess.run(["psql", "-d", db, "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", "set search_path = ''; " + q], capture_output=True, text=True, env=env)
    if r.returncode != 0:
        result[name] = "error: " + r.stderr.strip().splitlines()[0][:120]
    else:
        n, level = r.stdout.strip().splitlines()[-1].split("|")
        result[name] = {"count": int(n), "level": level}
if "--json" in sys.argv:
    print(json.dumps(result))
else:
    for k, v in result.items():
        print(f"{(v['level'] or '-'):5} {v['count']:4}  {k}" if isinstance(v, dict) else f"  ?        {k}: {v}")
