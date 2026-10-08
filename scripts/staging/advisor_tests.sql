-- ============================================================
-- Test tools for migrations 06 and 07 (Supabase advisor fixes).
-- Loaded into the local replica by advisor-checks.sh — never into a
-- real database. Everything lives in schema "t".
--
--   t.setup_identities()      made-up people: a visitor, 3 customers,
--                             the founder, a team member with no
--                             permission, and one team member for
--                             every permission the rules mention
--   t.seed_rows()             up to 4 made-up rows in every table
--   t.rls_snapshot(label,tbl) who can read / insert / update / delete
--                             each of those rows
--   t.fn_snapshot(label)      what every API function answers for
--                             every one of those people
-- Two snapshots taken before and after a migration must be equal.
-- ============================================================

create schema if not exists t;

create table if not exists t.who (name text primary key, role text not null, uid uuid, email text, claims text);
create table if not exists t.seed_sql (tbl text, tag text, sql text, primary key (tbl, tag));
create table if not exists t.seed_fail (tbl text, tag text, err text);
create table if not exists t.rls_result (label text, tbl text, who text, op text, tag text, outcome text);
create table if not exists t.fn_result (label text, fn text, who text, outcome text);

create or replace function t.setup_identities() returns int language plpgsql as $$
declare
  perms text[];
  p text;
  i int := 0;
  v_uid uuid;
begin
  delete from t.who;
  insert into t.who values ('visitor', 'anon', null, null, json_build_object('role', 'anon')::text);
  insert into t.who values ('server', 'service_role', null, null, json_build_object('role', 'service_role')::text);

  for p in select unnest(array['alice', 'bob', 'carol', 'founder', 'team-no-permission']) loop
    v_uid := md5('af-' || p)::uuid;
    insert into auth.users (id, email) values (v_uid, p || '@example.test') on conflict (id) do nothing;
    insert into t.who values (p, 'authenticated', v_uid, p || '@example.test',
      json_build_object('role', 'authenticated', 'sub', v_uid, 'email', p || '@example.test')::text);
  end loop;

  insert into public.admin_roles (id, label, permissions) values ('t_founder', 'Founder', array['*']), ('t_none', 'No permission', '{}')
    on conflict (id) do nothing;
  insert into public.admin_users (email, role, active) values ('founder@example.test', 't_founder', true), ('team-no-permission@example.test', 't_none', true)
    on conflict (email) do nothing;

  -- every permission named in a rule or in an API function
  select array_agg(distinct m[1] order by m[1]) into perms
    from (
      select regexp_matches(coalesce(qual, '') || ' ' || coalesce(with_check, ''), 'has_permission\(''([^'']+)''', 'g') as m
        from pg_policies where schemaname in ('public', 'storage')
      union all
      select regexp_matches(p.prosrc, '''([a-z_]+\.[a-z_*]+)''', 'g')
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('public', 'private') and p.prosecdef
    ) x
   where m[1] <> '*';

  foreach p in array coalesce(perms, '{}') loop
    i := i + 1;
    v_uid := md5('af-perm-' || p)::uuid;
    insert into auth.users (id, email) values (v_uid, 'perm' || i || '@example.test') on conflict (id) do nothing;
    insert into public.admin_roles (id, label, permissions) values ('t_perm_' || i, p, array[p]) on conflict (id) do nothing;
    insert into public.admin_users (email, role, active) values ('perm' || i || '@example.test', 't_perm_' || i, true) on conflict (email) do nothing;
    insert into t.who values ('team:' || p, 'authenticated', v_uid, 'perm' || i || '@example.test',
      json_build_object('role', 'authenticated', 'sub', v_uid, 'email', 'perm' || i || '@example.test')::text);
  end loop;
  return (select count(*) from t.who);
end $$;

-- ── made-up rows ────────────────────────────────────────────────
create or replace function t.seed_rows() returns text language plpgsql as $$
declare
  tb record; col record; tag text; cols text; vals text; v text; stmt text;
  owner_uid uuid; owner_email text; n_ok int := 0; n_fail int := 0;
  skip constant text[] := array['admin_users', 'admin_roles'];
begin
  delete from t.seed_sql; delete from t.seed_fail;
  for tb in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r' and c.relname <> all (skip) order by 1 loop
    execute format('alter table public.%I add column if not exists af_tag text', tb.relname);
    foreach tag in array array['A', 'B', 'C', 'D'] loop
      select uid, email into owner_uid, owner_email from t.who
       where name = case tag when 'A' then 'alice' when 'B' then 'bob' when 'C' then 'carol' else 'founder' end;
      cols := 'af_tag'; vals := quote_literal(tag);
      for col in
        select a.attname, format_type(a.atttypid, a.atttypmod) as typ, a.attnotnull as nn,
               (d.adbin is not null) as has_def, a.attgenerated <> '' as gen
          from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
         where a.attrelid = format('public.%I', tb.relname)::regclass and a.attnum > 0 and not a.attisdropped
           and a.attname <> 'af_tag'
         order by a.attnum
      loop
        continue when col.gen;
        v := null;
        if col.typ = 'uuid' and not col.has_def then
          v := case when tag = 'C' and not col.nn then 'null' else quote_literal(owner_uid) end;
        elsif col.typ in ('text', 'character varying') and col.attname ~ 'email' then
          v := quote_literal(owner_email);
        elsif col.typ in ('text', 'character varying') and col.attname = 'status' then
          v := quote_literal(case tag when 'A' then 'approved' when 'B' then 'pending' when 'C' then 'published' else 'open' end);
        elsif col.typ = 'boolean' and (col.attname in ('active', 'is_active') or (col.nn and not col.has_def)) then
          v := case when tag in ('A', 'C') then 'true' else 'false' end;
        elsif col.nn and not col.has_def then
          v := case
            when col.typ in ('text', 'character varying') then quote_literal(tag || '-' || col.attname)
            when col.typ in ('integer', 'bigint', 'smallint', 'numeric', 'double precision', 'real') or col.typ like 'numeric(%' then ascii(tag)::text
            when col.typ = 'date' then format('(current_date + %s)', ascii(tag) - 65)
            when col.typ like 'timestamp%' then 'now()'
            when col.typ in ('jsonb', 'json') then quote_literal('{}') || '::' || col.typ
            when col.typ like '%[]' then quote_literal('{}') || '::' || col.typ
            when col.typ like 'time%' then quote_literal('10:00')
            else 'null' end;
        end if;
        if v is not null then cols := cols || ', ' || quote_ident(col.attname); vals := vals || ', ' || v; end if;
      end loop;
      stmt := format('insert into public.%I (%s) values (%s)', tb.relname, cols, vals);
      begin
        execute stmt;
        insert into t.seed_sql values (tb.relname, tag, stmt);
        n_ok := n_ok + 1;
      exception when others then
        insert into t.seed_fail values (tb.relname, tag, sqlstate || ': ' || left(sqlerrm, 100));
        n_fail := n_fail + 1;
      end;
    end loop;
  end loop;
  -- All rows were inserted at the same instant; spread their timestamps so
  -- that "newest first" lists come out in the same order on every run.
  for col in
    select c.relname, a.attname
      from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
       and format_type(a.atttypid, null) like 'timestamp%'
       and exists (select 1 from t.seed_sql s where s.tbl = c.relname)
  loop
    execute format('update public.%I set %I = %I - (ascii(af_tag) - 60) * interval ''1 hour'' where af_tag is not null and %I is not null',
                   col.relname, col.attname, col.attname, col.attname);
  end loop;
  return n_ok || ' rows seeded, ' || n_fail || ' could not be seeded';
end $$;

-- ── one action as one person, always undone ─────────────────────
create or replace function t.as_person(p_role text, p_claims text, p_sql text, p_count boolean) returns text language plpgsql as $$
declare n bigint; outcome text;
begin
  begin
    perform set_config('request.jwt.claims', p_claims, true);
    execute format('set local role %I', p_role);
    if p_count then execute p_sql into n; else execute p_sql; get diagnostics n = row_count; end if;
    raise exception using errcode = 'AF001', message = coalesce(n::text, 'null');
  exception
    when sqlstate 'AF001' then outcome := 'rows=' || sqlerrm;
    when others then outcome := sqlstate || ': ' || left(sqlerrm, 70);
  end;
  return outcome;
end $$;

create or replace function t.rls_snapshot(p_label text, p_tbl text) returns int language plpgsql as $$
declare w record; s record; n int := 0; new_sql text;
begin
  delete from t.rls_result where label = p_label and tbl = p_tbl;
  for w in select * from t.who order by name loop
    for s in select * from t.seed_sql where tbl = p_tbl order by tag loop
      insert into t.rls_result values (p_label, p_tbl, w.name, 'read', s.tag,
        t.as_person(w.role, w.claims, format('select count(*) from public.%I where af_tag = %L', p_tbl, s.tag), true));
      -- same row again, as this person (new primary key where it has a default)
      new_sql := replace(s.sql, format('values (%L', s.tag), format('values (%L', s.tag || '-new'));
      insert into t.rls_result values (p_label, p_tbl, w.name, 'insert', s.tag, t.as_person(w.role, w.claims, new_sql, false));
      insert into t.rls_result values (p_label, p_tbl, w.name, 'update', s.tag,
        t.as_person(w.role, w.claims, format('update public.%I set af_tag = af_tag where af_tag = %L', p_tbl, s.tag), false));
      insert into t.rls_result values (p_label, p_tbl, w.name, 'delete', s.tag,
        t.as_person(w.role, w.claims, format('delete from public.%I where af_tag = %L', p_tbl, s.tag), false));
      n := n + 4;
    end loop;
  end loop;
  return n;
end $$;

-- ── every API function, as every person ─────────────────────────
create or replace function t.fn_snapshot(p_label text, p_names text[]) returns int language plpgsql as $$
declare f record; w record; args text; call text; raw text; outcome text; n int := 0; a record;
begin
  delete from t.fn_result where label = p_label;
  for f in
    select p.oid, p.proname, p.proretset, pg_get_function_result(p.oid) as res, p.pronargs, p.pronargdefaults, p.proargtypes
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f' and p.proname = any (p_names)
     order by p.proname, p.oid
  loop
    -- required arguments only; the ones with defaults are left to their defaults
    args := '';
    for a in select i, format_type((string_to_array(f.proargtypes::text, ' '))[i]::oid, null) as typ
               from generate_series(1, f.pronargs - f.pronargdefaults) i loop
      args := args || case when a.i > 1 then ', ' else '' end || case
        when f.proname = 'has_permission' then quote_literal('hr.view')
        when a.typ = 'uuid' then quote_literal(md5('af-alice')::uuid) || '::uuid'
        when a.typ = 'uuid[]' then format('array[%L]::uuid[]', md5('af-alice')::uuid)
        when a.typ in ('integer', 'bigint') then '5'
        when a.typ = 'date' then 'current_date'
        when a.typ in ('jsonb', 'json') then quote_literal('{}') || '::' || a.typ
        else quote_literal('alice') end;
    end loop;
    call := case when f.proretset or f.res like 'TABLE(%'
      then format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb)::text from public.%I(%s) x', f.proname, args)
      -- (a function "returning void" hands back an empty value from PL/pgSQL and
      --  NULL from SQL — both mean "nothing"; coalesce makes them compare equal)
      else format('select coalesce((public.%I(%s))::text, '''')', f.proname, args) end;
    for w in select * from t.who order by name loop
      begin
        perform set_config('request.jwt.claims', w.claims, true);
        execute format('set local role %I', w.role);
        execute call into raw;
        raise exception using errcode = 'AF001', message = coalesce(raw, 'null');
      exception
        when sqlstate 'AF001' then
          raw := regexp_replace(sqlerrm, '\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(\+\d{2}(:\d{2})?)?', 'TS', 'g');
          raw := regexp_replace(raw, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'UUID', 'g');
          outcome := 'ok ' || md5(raw) || ' ' || left(raw, 60);
        when others then outcome := sqlstate || ': ' || left(sqlerrm, 90);
      end;
      insert into t.fn_result values (p_label, f.proname, w.name, outcome);
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;
