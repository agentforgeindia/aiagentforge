#!/usr/bin/env python3
"""Builds 00_live_replica.sql — a local stand-in for the live database.

Source: live_full_schema.json, taken from the live database with read-only
catalog queries on 2026-10-08. It holds table definitions, primary/unique
keys, indexes, row-level-security rules, storage rules, bucket settings and
the functions the app calls. It holds NO rows.

What is deliberately simpler than live:
  * foreign keys and CHECK constraints exist only on the 21 tables the
    payment / credit tests use (the rule tests insert made-up rows into
    every table, which the other constraints would refuse);
  * the notify_* / email_* triggers are left out (they call services);
  * auth and storage are small stand-ins for the Supabase schemas.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.environ.get("AF_STAGING_WORK", HERE), "00_live_replica.sql")
d = json.load(open(os.path.join(HERE, "live_full_schema.json")))

out = []
out.append(
    """
-- ===== Supabase-like base (local stand-in) =====
do $r$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin; create role authenticated nologin;
    create role service_role nologin bypassrls; create role supabase_admin nologin;
    create role authenticator login password 'local-only' noinherit;
    grant anon, authenticated, service_role to authenticator;
  end if;
end $r$;
create schema auth; create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, phone text,
  created_at timestamptz default now(), last_sign_in_at timestamptz, email_confirmed_at timestamptz,
  raw_user_meta_data jsonb default '{}'::jsonb, raw_app_meta_data jsonb default '{}'::jsonb);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create function auth.role() returns text language sql stable as $$ select coalesce(auth.jwt()->>'role', current_user) $$;
create function auth.email() returns text language sql stable as $$ select auth.jwt()->>'email' $$;
create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create function storage.foldername(name text) returns text[] language plpgsql immutable as $$
declare _parts text[]; begin select string_to_array(name, '/') into _parts; return _parts[1:array_length(_parts,1)-1]; end $$;
create function storage.filename(name text) returns text language plpgsql immutable as $$
declare _parts text[]; begin select string_to_array(name, '/') into _parts; return _parts[array_length(_parts,1)]; end $$;
create function storage.extension(name text) returns text language plpgsql immutable as $$
declare _parts text[]; _filename text; begin select string_to_array(name, '/') into _parts; select _parts[array_length(_parts,1)] into _filename; return reverse(split_part(reverse(_filename), '.', 1)); end $$;
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid, created_at timestamptz default now(), updated_at timestamptz default now(), last_accessed_at timestamptz default now(), metadata jsonb, path_tokens text[] generated always as (string_to_array(name, '/')) stored, version text, owner_id text, user_metadata jsonb, unique (bucket_id, name));
alter table storage.objects enable row level security;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
grant execute on all functions in schema auth, storage to anon, authenticated, service_role;
"""
)

# ── sequences used by column defaults ────────────────────────────
seqs = set()
for t in d["tables"]:
    for c in t["cols"]:
        for m in re.finditer(r"nextval\('([^']+)'::regclass\)", c.get("def") or ""):
            seqs.add(m.group(1))
for s in sorted(seqs):
    out.append(f"create sequence if not exists {s if '.' in s else 'public.' + s};")

# ── tables ───────────────────────────────────────────────────────
detail = d["detail_cons"]
names = [t["name"] for t in d["tables"]]
for t in d["tables"]:
    cols = []
    for c in t["cols"]:
        line = f'"{c["c"]}" {c["t"]}'
        if c.get("gen"):
            line += f' generated always as ({c["def"]}) stored'
        elif c.get("def") is not None:
            line += f' default {c["def"]}'
        if c.get("nn"):
            line += " not null"
        cols.append(line)
    out.append(f'create table public."{t["name"]}" ({", ".join(cols)});')

# keys: full detail (p/u/c, later f) for the tables the money tests use, p/u for the rest
for name in names:
    if name in detail:
        for c in detail[name]:
            if c["t"] in ("p", "u", "c"):
                out.append(f'alter table public."{name}" add constraint "{c["n"]}" {c["d"]};')
for c in d["cons"]:
    if c["t"] not in detail:
        out.append(f'alter table public."{c["t"]}" add constraint "{c["n"]}" {c["d"]};')
    elif not any(x["n"] == c["n"] for x in detail[c["t"]]):
        out.append(f'alter table public."{c["t"]}" add constraint "{c["n"]}" {c["d"]};')
for name in names:
    if name in detail:
        for c in detail[name]:
            if c["t"] == "f":
                out.append(f'alter table public."{name}" add constraint "{c["n"]}" {c["d"]};')
for t in d["tables"]:
    if t["rls"]:
        out.append(f'alter table public."{t["name"]}" enable row level security;')
for ix in d["indexes"]:
    out.append(ix["d"] + ";")
for v in d["views"] or []:
    out.append(f'create view public."{v["name"]}" with (security_invoker = true) as {v["def"].rstrip().rstrip(";")};')

# ── functions ────────────────────────────────────────────────────
seen = set()
for f in d["money_defs"] + d["secdef_defs"]:
    body = f["def"].replace("\r", "")
    key = re.sub(r"\s+", " ", body[:400])
    if key in seen:
        continue
    seen.add(key)
    out.append(body + ";")

skip_trg = {"notify_on_payment_change", "email_on_payment_paid", "notify_on_new_signup", "email_on_profile_insert", "fn_log_candidate_stage"}
for t in d["triggers"]:
    if t["fn"] not in skip_trg:
        out.append(t["def"] + ";")

# ── rules ────────────────────────────────────────────────────────
for p in d["policies"] + d["storage_policies"]:
    s = f'create policy "{p["n"]}" on {p["s"]}."{p["t"]}" as {p["perm"]} for {p["cmd"]} to {", ".join(p["roles"])}'
    if p["qual"] is not None:
        s += f' using ({p["qual"]})'
    if p["chk"] is not None:
        s += f' with check ({p["chk"]})'
    out.append(s + ";")
for b in d["buckets"]:
    mt = "null" if b["allowed_mime_types"] is None else "array[" + ",".join("'%s'" % x for x in b["allowed_mime_types"]) + "]"
    out.append(
        f"insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('{b['id']}','{b['name']}',{str(b['public']).lower()},{b['file_size_limit'] or 'null'},{mt});"
    )

# ── grants, exactly as on live ───────────────────────────────────
out.append("grant all on all tables in schema public to service_role;")
out.append("grant usage on all sequences in schema public to anon, authenticated, service_role;")
by_table = {}
for g in d["grants"]:
    by_table.setdefault((g["t"], g["g"]), []).append(g["p"])
table_set = set(names) | {v["name"] for v in (d["views"] or [])}
for (t, g), privs in sorted(by_table.items()):
    if t in table_set:
        out.append(f'grant {", ".join(sorted(set(privs)))} on public."{t}" to {g};')
out.append("revoke execute on all functions in schema public from public, anon, authenticated;")
out.append(
    "do $g$ declare f record; acl jsonb := %s::jsonb; r jsonb; begin\n"
    "  for f in select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as iargs from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' loop\n"
    "    select x into r from jsonb_array_elements(acl) x where x->>'n' = f.proname and x->>'iargs' = f.iargs limit 1;\n"
    "    if r is null then continue; end if;\n"
    "    if (r->>'anon_x')::boolean then execute format('grant execute on function %%s to anon', f.oid::regprocedure); end if;\n"
    "    if (r->>'auth_x')::boolean then execute format('grant execute on function %%s to authenticated', f.oid::regprocedure); end if;\n"
    "    if (r->>'svc_x')::boolean then execute format('grant execute on function %%s to service_role', f.oid::regprocedure); end if;\n"
    "  end loop;\nend $g$;"
    % ("'" + json.dumps(d["funcs_acl"]).replace("'", "''") + "'")
)

open(OUT, "w").write("\n".join(out) + "\n")
print(len(out), "statements ->", OUT)
