create schema if not exists t;
create table if not exists t.results(n serial, phase text, name text, expected text, got text, ok boolean, detail text);
create or replace function t.try(p_phase text, p_name text, p_role text, p_sub text, p_email text, p_kind text, p_sql text, p_expect text)
returns void language plpgsql as $$
declare got text; cnt bigint; det text := '';
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('role',p_role,'sub',p_sub,'email',p_email)::text, true);
    execute format('set local role %I', p_role);
    if p_kind = 'read' then
      execute 'select count(*) from (' || p_sql || ') q' into cnt;
    else
      execute p_sql;
      get diagnostics cnt = row_count;
    end if;
    raise exception 'T_UNDO %', case when cnt > 0 then 'ok' else 'zero' end;
  exception when others then
    if sqlerrm like 'T_UNDO %' then got := substr(sqlerrm, 8);
    else got := 'denied'; det := left(sqlerrm, 90); end if;
  end;
  insert into t.results(phase,name,expected,got,ok,detail) values (p_phase,p_name,p_expect,got,got=p_expect,det);
end $$;
