#!/usr/bin/env python3
"""Writes sql/pending/06-advisor-policies-and-indexes.sql and its rollback.

It reads the row-level-security rules of a database that is in the state
"live + pending migrations 00–05" (the local replica) and produces rules
that give exactly the same access but no longer trip two Supabase advisor
warnings:

  * auth_rls_initplan — auth.uid() / auth.jwt() / auth.role() written as
    (select auth.uid()) so they are worked out once per query, not per row;
  * multiple_permissive_policies — where several rules apply to the same
    role and action they are folded into ONE rule whose condition is the
    OR of the old conditions (which is how Postgres combines them anyway).

  python3 gen_policy_migration.py <database>
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
db = sys.argv[1]
env = dict(os.environ, PGHOST=os.environ.get("PGHOST", "127.0.0.1"), PGPORT=os.environ.get("PGPORT", "54329"), PGUSER=os.environ.get("PGUSER", "postgres"))


def q(sql):
    r = subprocess.run(["psql", "-d", db, "-At", "-v", "ON_ERROR_STOP=1", "-c", sql], capture_output=True, text=True, env=env, check=True)
    return r.stdout


rows = json.loads(
    q(
        "select coalesce(json_agg(json_build_object('t',tablename,'n',policyname,'perm',permissive,'roles',roles,'cmd',cmd,'qual',qual,'chk',with_check) order by tablename, policyname),'[]') "
        "from pg_policies where schemaname='public'"
    )
)
by_table = {}
for p in rows:
    by_table.setdefault(p["t"], []).append(p)

BROWSER = ("anon", "authenticated")
ACTIONS = ("SELECT", "INSERT", "UPDATE", "DELETE")
AUTH_CALL = re.compile(r"(?<!SELECT )auth\.(uid|jwt|role|email)\(\)")


def wrap(expr):
    return None if expr is None else AUTH_CALL.sub(r"( SELECT auth.\1())", expr)


def needs_wrap(p):
    return any(e is not None and AUTH_CALL.search(e) for e in (p["qual"], p["chk"]))


def applies(p, role, action):
    return p["perm"] == "PERMISSIVE" and (role in p["roles"] or "public" in p["roles"]) and p["cmd"] in (action, "ALL")


def lit(name):
    return '"' + name.replace('"', '""') + '"'


def create_sql(t, p):
    s = f'create policy {lit(p["n"])} on public.{lit(t)} as {p["perm"].lower()} for {p["cmd"].lower()} to {", ".join(p["roles"])}'
    if p["qual"] is not None:
        s += f'\n  using ({p["qual"]})'
    if p["chk"] is not None:
        s += f'\n  with check ({p["chk"]})'
    return s + ";"


def alter_sql(t, name, qual, chk):
    s = f"alter policy {lit(name)} on public.{lit(t)}"
    if qual is not None:
        s += f"\n  using ({qual})"
    if chk is not None:
        s += f"\n  with check ({chk})"
    return s + ";"


def any_of(exprs):
    seen = []
    for e in exprs:
        e = "true" if e is None else e
        if e not in seen:
            seen.append(e)
    if not seen:
        return None
    if "true" in seen:
        return "true"
    return seen[0] if len(seen) == 1 else " OR ".join(f"({e})" for e in seen)


up, down, summary = [], [], []
for t in sorted(by_table):
    pols = by_table[t]
    overlapping = any(sum(1 for p in pols if applies(p, r, a)) > 1 for r in BROWSER for a in ACTIONS)
    browser_pols = [p for p in pols if p["perm"] == "PERMISSIVE" and (set(p["roles"]) & {"anon", "authenticated", "public"})]
    other_pols = [p for p in pols if p not in browser_pols]

    if not overlapping:
        changed = [p for p in pols if needs_wrap(p)]
        if changed:
            up.append(f"\n-- {t}: same rules, auth.*() worked out once per query")
            down.append(f"\n-- {t}")
            for p in changed:
                up.append(alter_sql(t, p["n"], wrap(p["qual"]), wrap(p["chk"])))
                down.append(alter_sql(t, p["n"], p["qual"], p["chk"]))
            summary.append((t, "in place", len(changed), len(changed)))
        continue

    # Fold the browser-facing rules of this table into one per role + action.
    new = []
    for a in ACTIONS:
        per_role = {}
        for r in BROWSER:
            app = [p for p in browser_pols if applies(p, r, a)]
            if not app:
                continue
            using = any_of([wrap(p["qual"]) for p in app]) if a != "INSERT" else None
            check = any_of([wrap(p["chk"] if p["chk"] is not None else p["qual"]) for p in app]) if a in ("INSERT", "UPDATE") else None
            per_role[r] = (using, check)
        if not per_role:
            continue
        if len(per_role) == 2 and per_role["anon"] == per_role["authenticated"]:
            groups = [(["anon", "authenticated"], per_role["anon"], "")]
        else:
            groups = [([r], per_role[r], " (visitors)" if r == "anon" else " (signed-in)") for r in BROWSER if r in per_role]
            if len(groups) == 1:
                groups = [(groups[0][0], groups[0][1], "")]
        for roles, (using, check), suffix in groups:
            new.append({"n": f"{t}: {a.lower()}{suffix}", "perm": "PERMISSIVE", "roles": roles, "cmd": a, "qual": using, "chk": check})

    up.append(f"\n-- {t}: {len(browser_pols)} rules -> {len(new)} (one per role and action)")
    down.append(f"\n-- {t}")
    for p in browser_pols:
        up.append(f"drop policy {lit(p['n'])} on public.{lit(t)};")
    for p in new:
        up.append(create_sql(t, p))
        down.append(f"drop policy if exists {lit(p['n'])} on public.{lit(t)};")
    for p in browser_pols:
        down.append(create_sql(t, p))
    for p in other_pols:  # server-only rules stay; only the auth.*() form changes
        if needs_wrap(p):
            up.append(alter_sql(t, p["n"], wrap(p["qual"]), wrap(p["chk"])))
            down.append(alter_sql(t, p["n"], p["qual"], p["chk"]))
    summary.append((t, "folded", len(browser_pols), len(new)))

folded = [s for s in summary if s[1] == "folded"]
inplace = [s for s in summary if s[1] == "in place"]
HEAD = f"""-- ============================================================
-- 06 — Supabase advisor: policy and index warnings   (NOT applied yet)
-- ============================================================
-- Generated by scripts/staging/gen_policy_migration.py from the rules
-- as they are after migrations 00–05. Clears three performance
-- warnings of the Supabase advisor without changing who can see or
-- change what:
--
--   • "Auth RLS Initialization Plan" — auth.uid() / auth.jwt() /
--     auth.role() are written as (select auth.uid()) so Postgres
--     works them out once per query instead of once per row.
--   • "Multiple Permissive Policies" — on {len(folded)} tables several rules
--     applied to the same role and action. They are folded into one
--     rule per role and action; its condition is the OR of the old
--     conditions, which is exactly how Postgres combined them.
--     Rules that were written "to public" now name the two browser
--     roles (anon, authenticated) — the server role is not affected
--     by row-level security at all.
--   • "Duplicate Index" — two pairs of identical unique indexes.
--
-- {len(inplace)} tables are changed in place (same rule names), {len(folded)} tables get
-- new rule names "<table>: <action>".
--
-- Checked on the local replica (scripts/staging/advisor-checks.sh):
-- every table, as a visitor, two customers, the founder and one team
-- member per permission, reads / inserts / updates / deletes sample
-- rows before and after — the results are identical; Supabase's own
-- advisor queries then report 0 for these three checks.
--
-- Run in ONE transaction (the Supabase SQL editor does that; it will
-- ask for confirmation because rules are replaced).
-- Rollback: sql/rollback/06-advisor-policies-and-indexes.rollback.sql
-- ============================================================

begin;
"""
INDEXES_UP = """
-- ── Duplicate indexes ───────────────────────────────────────────
-- feedback: two identical unique indexes on (user_id, generation_id).
-- "feedback_user_generation_unique" is the older one and stays.
drop index if exists public.feedback_user_generation_uniq;

-- payments: two identical UNIQUE constraints on razorpay_payment_id.
-- "payments_razorpay_payment_id_key" stays (add_credits_for_payment's
-- ON CONFLICT (razorpay_payment_id) works with either).
alter table public.payments drop constraint if exists unique_razorpay_payment_id;

commit;
"""
INDEXES_DOWN = """
-- ── Duplicate indexes back ──────────────────────────────────────
create unique index if not exists feedback_user_generation_uniq
  on public.feedback (user_id, generation_id) where (generation_id is not null);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'unique_razorpay_payment_id') then
    alter table public.payments add constraint unique_razorpay_payment_id unique (razorpay_payment_id);
  end if;
end $$;

commit;
"""
open(os.path.join(REPO, "sql/pending/06-advisor-policies-and-indexes.sql"), "w").write(HEAD + "\n".join(up) + "\n" + INDEXES_UP)
open(os.path.join(REPO, "sql/rollback/06-advisor-policies-and-indexes.rollback.sql"), "w").write(
    "-- Rollback for sql/pending/06-advisor-policies-and-indexes.sql\n"
    "-- Puts every rule back exactly as it was after migrations 00–05 and\n"
    "-- re-creates the two duplicate indexes. Generated together with 06.\n"
    "-- Run in the Supabase SQL editor (one transaction).\n\nbegin;\n" + "\n".join(down) + "\n" + INDEXES_DOWN
)
print(f"{len(folded)} tables folded ({sum(s[2] for s in folded)} rules -> {sum(s[3] for s in folded)}), {len(inplace)} tables changed in place ({sum(s[2] for s in inplace)} rules)")
