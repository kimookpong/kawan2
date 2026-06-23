-- ============================================================
-- Kawan2 — Row Level Security
-- 0003_rls.sql
-- หลักการ: default-deny, เปิด RLS ทุกตาราง, least-privilege
-- ============================================================

-- ---------- provinces / membership_levels / categories / badges (อ่านสาธารณะ) ----------
alter table public.provinces enable row level security;
create policy "provinces_read" on public.provinces for select using (true);

alter table public.membership_levels enable row level security;
create policy "levels_read" on public.membership_levels for select using (true);

alter table public.categories enable row level security;
create policy "categories_read" on public.categories for select using (is_active or public.is_staff(auth.uid()));

alter table public.badges enable row level security;
create policy "badges_read" on public.badges for select using (true);

-- ---------- profiles ----------
alter table public.profiles enable row level security;
create policy "profiles_read_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- หมายเหตุ: insert ทำผ่าน trigger handle_new_user (security definer) — ไม่เปิด insert ตรง

-- ---------- threads ----------
alter table public.threads enable row level security;
create policy "threads_select" on public.threads
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_staff(auth.uid())
  );
create policy "threads_insert" on public.threads
  for insert with check (auth.uid() = author_id);
create policy "threads_update" on public.threads
  for update using (auth.uid() = author_id or public.is_staff(auth.uid()));
create policy "threads_delete" on public.threads
  for delete using (auth.uid() = author_id or public.is_staff(auth.uid()));

-- ---------- posts ----------
alter table public.posts enable row level security;
create policy "posts_select" on public.posts
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_staff(auth.uid())
  );
create policy "posts_insert" on public.posts
  for insert with check (
    auth.uid() = author_id
    and not exists (select 1 from public.threads t where t.id = thread_id and t.is_locked)
  );
create policy "posts_update" on public.posts
  for update using (auth.uid() = author_id or public.is_staff(auth.uid()));
create policy "posts_delete" on public.posts
  for delete using (auth.uid() = author_id or public.is_staff(auth.uid()));

-- ---------- reactions ----------
alter table public.reactions enable row level security;
create policy "reactions_select" on public.reactions for select using (true);
create policy "reactions_insert" on public.reactions
  for insert with check (auth.uid() = user_id);
create policy "reactions_delete" on public.reactions
  for delete using (auth.uid() = user_id);

-- ---------- news ----------
alter table public.news enable row level security;
create policy "news_select" on public.news
  for select using (status = 'published' or public.is_editor(auth.uid()));
create policy "news_insert" on public.news
  for insert with check (public.is_editor(auth.uid()) and auth.uid() = author_id);
create policy "news_update" on public.news
  for update using (public.is_editor(auth.uid()));
create policy "news_delete" on public.news
  for delete using (public.is_admin(auth.uid()));

-- ---------- user_badges ----------
alter table public.user_badges enable row level security;
create policy "user_badges_read" on public.user_badges for select using (true);
-- มอบ badge ทำผ่าน security-definer function เท่านั้น

-- ---------- point_transactions (เจ้าของ + staff อ่านได้) ----------
alter table public.point_transactions enable row level security;
create policy "point_tx_read_own" on public.point_transactions
  for select using (auth.uid() = user_id or public.is_staff(auth.uid()));
-- insert ทำผ่าน award_points (security definer)

-- ---------- conversations ----------
alter table public.conversations enable row level security;
create policy "conv_select_member" on public.conversations
  for select using (
    exists (select 1 from public.conversation_members m
            where m.conversation_id = conversations.id and m.user_id = auth.uid())
  );

-- ---------- conversation_members ----------
alter table public.conversation_members enable row level security;
create policy "conv_members_select" on public.conversation_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.conversation_members m2
               where m2.conversation_id = conversation_members.conversation_id
                 and m2.user_id = auth.uid())
  );
create policy "conv_members_update_own" on public.conversation_members
  for update using (user_id = auth.uid());
-- การสร้างห้อง + เพิ่มสมาชิก ทำผ่าน RPC start_conversation (security definer)

-- ---------- messages ----------
alter table public.messages enable row level security;
create policy "messages_select_member" on public.messages
  for select using (
    exists (select 1 from public.conversation_members m
            where m.conversation_id = messages.conversation_id and m.user_id = auth.uid())
  );
create policy "messages_insert_member" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversation_members m
                where m.conversation_id = messages.conversation_id and m.user_id = auth.uid())
  );

-- ---------- notifications ----------
alter table public.notifications enable row level security;
create policy "notif_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notif_update_own" on public.notifications
  for update using (auth.uid() = user_id);
create policy "notif_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- ---------- reports ----------
alter table public.reports enable row level security;
create policy "reports_insert" on public.reports
  for insert with check (auth.uid() = reporter_id);
create policy "reports_select_staff" on public.reports
  for select using (public.is_staff(auth.uid()) or auth.uid() = reporter_id);
create policy "reports_update_staff" on public.reports
  for update using (public.is_staff(auth.uid()));

-- ============================================================
-- RPC: เริ่ม/หา conversation ระหว่างผู้ใช้สองคน (กันห้องซ้ำ)
-- ============================================================
create or replace function public.start_conversation(other_user uuid)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  conv_id bigint;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if other_user = me then raise exception 'cannot DM yourself'; end if;

  -- หาห้องที่มีทั้งสองคนเป็นสมาชิก (1:1)
  select cm1.conversation_id into conv_id
  from public.conversation_members cm1
  join public.conversation_members cm2
    on cm1.conversation_id = cm2.conversation_id
  where cm1.user_id = me and cm2.user_id = other_user
  group by cm1.conversation_id
  having count(*) = 2
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations default values returning id into conv_id;
  insert into public.conversation_members (conversation_id, user_id)
    values (conv_id, me), (conv_id, other_user);
  return conv_id;
end; $$;

grant execute on function public.start_conversation(uuid) to authenticated;

-- ============================================================
-- RPC: เปลี่ยน role ผู้ใช้ (เฉพาะ admin) — ใช้ในหน้า /admin/users
-- ============================================================
create or replace function public.set_user_role(target uuid, new_role text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden: เฉพาะ admin เท่านั้น';
  end if;
  if new_role not in ('member', 'editor', 'admin') then
    raise exception 'invalid role';
  end if;
  if target = auth.uid() then
    raise exception 'cannot change your own role';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target;
end; $$;

grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
