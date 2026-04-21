-- Storage bucket for play thumbnails
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'playbook-thumbnails',
  'playbook-thumbnails',
  true,
  2097152,  -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Coaches can upload thumbnails for their plays
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects'
      and schemaname = 'storage'
      and policyname = 'coach_uploads_thumbnails'
  ) then
    create policy "coach_uploads_thumbnails"
      on storage.objects for insert
      with check (
        bucket_id = 'playbook-thumbnails'
        and auth.uid() is not null
      );
  end if;
end $$;

-- Anyone can read thumbnails (public bucket)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects'
      and schemaname = 'storage'
      and policyname = 'public_reads_thumbnails'
  ) then
    create policy "public_reads_thumbnails"
      on storage.objects for select
      using (bucket_id = 'playbook-thumbnails');
  end if;
end $$;
