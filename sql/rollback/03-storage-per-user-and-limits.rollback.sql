-- Rollback for sql/pending/03-storage-per-user-and-limits.sql
-- Puts the storage rules back to how they were on 2026-10-07 (after
-- the first round of fixes). Run in the Supabase SQL editor; it asks
-- for confirmation because it removes three policies.

alter policy "Public access pr0nlh_1" on storage.objects
  to anon, authenticated
  with check (bucket_id = 'designs');

alter policy "Public access pr0nlh_2" on storage.objects
  to authenticated
  using (bucket_id = 'designs' and owner = auth.uid())
  with check (bucket_id = 'designs' and owner = auth.uid());

drop policy if exists "designs owner delete" on storage.objects;
drop policy if exists "designs team demo uploads" on storage.objects;

alter policy "Public upload generation images" on storage.objects
  to anon, authenticated
  with check (bucket_id = 'generation-uploads');

drop policy if exists "generation-uploads owner delete" on storage.objects;

alter policy "Allow uploads" on storage.objects
  to anon, authenticated
  with check (bucket_id = 'cc-demo-videos');

update storage.buckets
   set file_size_limit = null, allowed_mime_types = null
 where id in ('designs', 'generation-uploads', 'cc-demo-videos');
