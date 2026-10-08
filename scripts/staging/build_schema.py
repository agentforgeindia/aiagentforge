import json,re
import os
HERE=os.path.dirname(os.path.abspath(__file__))
d=json.load(open(os.path.join(HERE,'live_schema.json')))
out=[]
out.append('''
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
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create function auth.role() returns text language sql stable as $$ select coalesce(auth.jwt()->>'role', current_user) $$;
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
''')
tables={t['relname']:t for t in d['tables']}
order=['admin_roles','admin_users','teams','team_members','profiles','candidates','candidate_payments','content_creator_social','credit_transactions','team_credit_transactions','error_logs','feedback','generations','influencer_withdrawals','meetings','payments','recruitment_notifications','referral_earnings','referrals','workshop_slots','workshop_registrations']
assert set(order)==set(tables), set(tables)^set(order)
for name in order:
    t=tables[name]; ddl=t['ddl']
    # generated column on candidates
    ddl=re.sub(r'assessment_pct numeric default \s*(CASE.*?END)\)', r'assessment_pct numeric generated always as (\1) stored)', ddl, flags=re.S)
    out.append(ddl)
for name in order:
    for c in tables[name]['cons']:
        if c['t'] in ('p','u','c'):
            out.append(f'alter table public.{name} add constraint "{c["n"]}" {c["d"]};')
for name in order:
    for c in tables[name]['cons']:
        if c['t']=='f':
            out.append(f'alter table public.{name} add constraint "{c["n"]}" {c["d"]};')
    if tables[name]['rls']:
        out.append(f'alter table public.{name} enable row level security;')
m=d['meta'][0]['j']
for ix in m['indexes']: out.append(ix+';')
for f in d['fn2'][0]['j']+d['fn1'][0]['j']:
    out.append(f['def'].replace('\r','')+';')
skip_trg={'notify_on_payment_change','email_on_payment_paid','notify_on_new_signup','email_on_profile_insert','fn_log_candidate_stage'}
for t in m['triggers']:
    if t['fn'] in skip_trg: continue
    out.append(t['def']+';')
def roles(r): return ', '.join(r)
for p in m['policies']:
    s=f'create policy "{p["n"]}" on {p["s"]}.{p["t"]} as {p["perm"]} for {p["cmd"]} to {roles(p["roles"])}'
    if p['qual'] is not None: s+=f' using ({p["qual"]})'
    if p['chk'] is not None: s+=f' with check ({p["chk"]})'
    out.append(s+';')
for b in m['buckets']:
    mt='null' if b['allowed_mime_types'] is None else "array["+','.join("'%s'"%x for x in b['allowed_mime_types'])+"]"
    out.append(f"insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('{b['id']}','{b['name']}',{str(b['public']).lower()},{b['file_size_limit'] or 'null'},{mt});")
out.append('grant all on all tables in schema public to anon, authenticated, service_role;')
out.append('grant execute on all functions in schema public to anon, authenticated, service_role;')
# Mirror the live grants: the money functions are server-only (checked on the live database 2026-10-08).
out.append("""do $g$ declare r record; begin
  for r in select p.oid::regprocedure as f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in ('add_credits_for_payment','deduct_credits','deduct_team_credits','refund_credits','refund_team_credits','register_workshop_seat','record_referral_earning','log_error')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.f);
    execute format('grant execute on function %s to service_role', r.f);
  end loop;
end $g$;""")
open(os.path.join(os.environ.get('AF_STAGING_WORK', HERE), '00_live_replica.sql'),'w').write('\n'.join(out)+'\n')
print(len(out),'statements')
