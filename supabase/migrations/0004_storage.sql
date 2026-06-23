-- ============================================================
-- Kawan2 — Storage buckets & policies
-- 0004_storage.sql
-- ============================================================

-- สร้าง buckets (public-read ยกเว้น dm-attachments)
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('thread-images', 'thread-images', true),
  ('news-covers', 'news-covers', true),
  ('dm-attachments', 'dm-attachments', false)
on conflict (id) do nothing;

-- ---------- avatars ----------
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_write_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- thread-images ----------
create policy "thread_images_read" on storage.objects
  for select using (bucket_id = 'thread-images');
create policy "thread_images_write" on storage.objects
  for insert with check (
    bucket_id = 'thread-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- news-covers (เฉพาะ editor/admin) ----------
create policy "news_covers_read" on storage.objects
  for select using (bucket_id = 'news-covers');
create policy "news_covers_write" on storage.objects
  for insert with check (
    bucket_id = 'news-covers' and public.is_editor(auth.uid())
  );

-- ---------- dm-attachments (private: สมาชิกห้องเท่านั้น) ----------
-- path convention: <conversation_id>/<filename>
create policy "dm_read_member" on storage.objects
  for select using (
    bucket_id = 'dm-attachments'
    and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = ((storage.foldername(name))[1])::bigint
        and m.user_id = auth.uid()
    )
  );
create policy "dm_write_member" on storage.objects
  for insert with check (
    bucket_id = 'dm-attachments'
    and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = ((storage.foldername(name))[1])::bigint
        and m.user_id = auth.uid()
    )
  );
