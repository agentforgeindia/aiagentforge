select 'policy', schemaname, tablename, policyname, permissive, roles::text, cmd, coalesce(qual,''), coalesce(with_check,'') from pg_policies where schemaname in ('public','storage')
union all select 'index', schemaname, tablename, indexname, indexdef, '', '', '', '' from pg_indexes where schemaname='public'
union all select 'bucket', id, coalesce(file_size_limit::text,'null'), coalesce(allowed_mime_types::text,'null'), '', '', '', '', '' from storage.buckets
union all select 'func', p.proname, pg_get_function_identity_arguments(p.oid), md5(pg_get_functiondef(p.oid)), '', '', '', '', '' from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'
union all select 'trigger', c.relname, t.tgname, t.tgenabled::text, '', '', '', '', '' from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public'
order by 1,2,3,4;
