alter table public.messages
  add column if not exists kind text not null default 'text',
  add column if not exists media_url text,
  add column if not exists media_duration integer;

drop policy if exists "chat media read" on storage.objects;
create policy "chat media read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'chat-media');

drop policy if exists "chat media upload" on storage.objects;
create policy "chat media upload" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'chat-media');
