-- ============================================================
-- 03 — Storage: own folder only, size and format limits
--                                               (NOT applied yet)
-- ============================================================
-- Narrows what a browser may upload to the `designs`,
-- `generation-uploads` and `cc-demo-videos` buckets.
--
-- After this migration:
--
--   designs / generation-uploads  (customer images)
--     • a signed-in customer can upload only into THEIR OWN folder
--       <folder>/<their user id>/…          (e.g. brand-logos/<id>/x.png)
--     • a visitor who has not signed up yet can upload only into
--       <folder>/guest/…                    (the "try before sign-up" flow)
--     • only image files: jpg jpeg jfif png webp avif heic heif tif tiff
--     • a customer can replace / delete only files they uploaded
--     • the team can still upload demo videos / stills from
--       Admin → Demo requests (demo-videos/, demo-stills/)
--     • bucket limit: 50 MB per file (generated Ultra HD images are up
--       to ~32 MB and are stored in `designs` too; customer SOURCE
--       images are limited to 20 MB by the pages)
--
--   cc-demo-videos  (creator application videos)
--     • only video files: mp4 mov webm m4v, 100 MB per file
--
-- The server (n8n and our API routes use the service role) is not
-- affected by the folder / extension rules. The bucket size + type
-- limits DO apply to it — they are set wide enough for everything
-- that is stored today (checked 2026-10-07: largest file 32 MB;
-- types present: jpeg, png, webp, avif, heic, tiff, mp4 — plus ONE
-- .dng camera-raw file, which is no longer accepted for new uploads).
--
-- REQUIRES the new code to be live first: until then the Textile page
-- uploads source images to textile-designs/<file> (no user folder)
-- and would be refused.
--
-- Rollback: sql/rollback/03-storage-per-user-and-limits.rollback.sql
-- ============================================================

-- ── designs: upload ─────────────────────────────────────────
alter policy "Public access pr0nlh_1" on storage.objects
  to anon, authenticated
  with check (
    bucket_id = 'designs'
    and lower(storage.extension(name)) = any (array[
      'jpg','jpeg','jfif','png','webp','avif','heic','heif','tif','tiff'
    ])
    and array_length(storage.foldername(name), 1) >= 2
    and (
      (storage.foldername(name))[2] = 'guest'
      or (
        auth.role() = 'authenticated'
        and (storage.foldername(name))[2] = (auth.uid())::text
      )
    )
  );

-- ── designs: replace own file (stays owner-only, now also inside the own folder)
alter policy "Public access pr0nlh_2" on storage.objects
  to authenticated
  using (bucket_id = 'designs' and owner = auth.uid())
  with check (
    bucket_id = 'designs'
    and owner = auth.uid()
    and (storage.foldername(name))[2] = (auth.uid())::text
  );

-- ── designs: a customer may delete files they uploaded ──────
create policy "designs owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'designs' and owner = auth.uid());

-- ── designs: team uploads for Admin → Demo requests ─────────
create policy "designs team demo uploads" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'designs'
    and (storage.foldername(name))[1] in ('demo-videos', 'demo-stills')
    and public.is_admin()
  );

-- ── generation-uploads: same rules as designs ───────────────
alter policy "Public upload generation images" on storage.objects
  to anon, authenticated
  with check (
    bucket_id = 'generation-uploads'
    and lower(storage.extension(name)) = any (array[
      'jpg','jpeg','jfif','png','webp','avif','heic','heif','tif','tiff'
    ])
    and array_length(storage.foldername(name), 1) >= 2
    and (
      (storage.foldername(name))[2] = 'guest'
      or (
        auth.role() = 'authenticated'
        and (storage.foldername(name))[2] = (auth.uid())::text
      )
    )
  );

create policy "generation-uploads owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'generation-uploads' and owner = auth.uid());

-- ── cc-demo-videos: videos only ─────────────────────────────
alter policy "Allow uploads" on storage.objects
  to anon, authenticated
  with check (
    bucket_id = 'cc-demo-videos'
    and lower(storage.extension(name)) = any (array['mp4','mov','webm','m4v'])
  );

-- ── Bucket limits (apply to every uploader, server included) ─
update storage.buckets
   set file_size_limit    = 52428800,                       -- 50 MB
       allowed_mime_types = array['image/*', 'video/mp4', 'video/webm', 'video/quicktime']
 where id = 'designs';

update storage.buckets
   set file_size_limit    = 20971520,                       -- 20 MB
       allowed_mime_types = array['image/*']
 where id = 'generation-uploads';

update storage.buckets
   set file_size_limit    = 104857600,                      -- 100 MB
       allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']
 where id = 'cc-demo-videos';
