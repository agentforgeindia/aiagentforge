-- Rollback for sql/pending/07-advisor-definer-functions.sql
-- Removes the pass-through functions, moves the originals back into
-- public (same function objects, so rules that use them keep working),
-- restores log_admin_action() and the old generation_log grant.
-- Run in the Supabase SQL editor (it asks for confirmation because
-- functions are removed).

begin;

do $do$
declare f record;
begin
  if to_regnamespace('private') is null then return; end if;
  for f in
    select p.proname, pg_get_function_identity_arguments(p.oid) as iargs
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.prokind = 'f'
     order by p.proname
  loop
    execute format('drop function if exists public.%I(%s)', f.proname, f.iargs);
    execute format('alter function private.%I(%s) set schema public', f.proname, f.iargs);
  end loop;
end
$do$;

CREATE OR REPLACE FUNCTION public.log_admin_action(p_action text, p_target_type text DEFAULT NULL::text, p_target_id text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_email text;
begin
  select u.email into v_email from auth.users u where u.id = auth.uid();
  insert into public.admin_audit(actor_user_id, actor_email, action, target_type, target_id, details)
    values (auth.uid(), v_email, p_action, p_target_type, p_target_id, p_details)
    returning id into v_id;
  return v_id;
end;
$function$;

grant execute on function public.generation_log(integer, text, text) to authenticated;

drop schema if exists private;

commit;

notify pgrst, 'reload schema';
