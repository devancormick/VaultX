-- Private assets bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  false,
  524288000, -- 500MB
  array['model/gltf-binary', 'model/gltf+json', 'image/png', 'image/jpeg', 'image/hdr', 'application/octet-stream']
);

-- Public thumbnails bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/webp']
);

-- Storage RLS: assets bucket — users can only read/write their own files
create policy "Users upload own assets"
  on storage.objects for insert
  with check (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own assets"
  on storage.objects for select
  using (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own assets"
  on storage.objects for delete
  using (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Thumbnails bucket — public read, authenticated write
create policy "Public read thumbnails"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

create policy "Authenticated upload thumbnails"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnails' AND
    auth.role() = 'authenticated'
  );
