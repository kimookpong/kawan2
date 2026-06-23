-- ============================================================
-- Kawan2 — Setup รวดเดียว (migrations 0001–0008 + seed)
-- วางทั้งไฟล์นี้ใน Supabase SQL Editor แล้วกด Run ครั้งเดียว
-- สร้างเมื่อ: 2026-06-23
-- ============================================================


-- >>>>>>>>>>>>>>>> 0001_schema.sql >>>>>>>>>>>>>>>>

-- ============================================================
-- Kawan2 — Schema หลัก
-- 0001_schema.sql
-- ============================================================

-- ---------- จังหวัด (รองรับเพิ่มในอนาคต) ----------
create table public.provinces (
  id          smallserial primary key,
  name_th     text not null,
  name_en     text,
  slug        text unique not null,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ---------- ระดับสมาชิก (config-driven) ----------
create table public.membership_levels (
  id          smallint primary key,
  name_th     text not null,
  name_en     text not null,
  min_points  integer not null,
  perks       jsonb default '{}'::jsonb
);

-- ---------- โปรไฟล์ (ขยาย auth.users) ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  province_id  smallint references public.provinces(id),
  role         text not null default 'member'
                 check (role in ('member','editor','admin')),
  reputation   integer not null default 0,
  level_id     smallint not null default 1 references public.membership_levels(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index profiles_province_idx on public.profiles (province_id);

-- ---------- หมวดหมู่เว็บบอร์ด ----------
create table public.categories (
  id          serial primary key,
  name_th     text not null,
  slug        text unique not null,
  description text,
  icon        text,
  sort_order  smallint default 0,
  is_active   boolean default true
);

-- ---------- กระทู้ ----------
create table public.threads (
  id           bigserial primary key,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  category_id  integer not null references public.categories(id),
  province_id  smallint references public.provinces(id),
  title        text not null,
  body         text not null,
  is_pinned    boolean default false,
  is_locked    boolean default false,
  view_count   integer default 0,
  reply_count  integer default 0,
  like_count   integer default 0,
  status       text default 'published'
                 check (status in ('published','hidden','deleted')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index threads_category_idx on public.threads (category_id, created_at desc);
create index threads_province_idx on public.threads (province_id, created_at desc);
create index threads_author_idx on public.threads (author_id);

-- ---------- ความเห็น/ตอบกลับ ----------
create table public.posts (
  id           bigserial primary key,
  thread_id    bigint not null references public.threads(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  body         text not null,
  parent_id    bigint references public.posts(id) on delete cascade,
  like_count   integer default 0,
  status       text default 'published'
                 check (status in ('published','hidden','deleted')),
  created_at   timestamptz default now()
);
create index posts_thread_idx on public.posts (thread_id, created_at);

-- ---------- reaction / like (polymorphic) ----------
create table public.reactions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('thread','post','news')),
  target_id   bigint not null,
  type        text not null default 'like',
  created_at  timestamptz default now(),
  unique (user_id, target_type, target_id, type)
);
create index reactions_target_idx on public.reactions (target_type, target_id);

-- ---------- ข่าวสาร ----------
create table public.news (
  id           bigserial primary key,
  author_id    uuid not null references public.profiles(id),
  province_id  smallint references public.provinces(id),
  category     text,
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  body         text not null,
  cover_url    text,
  is_featured  boolean default false,
  status       text default 'draft'
                 check (status in ('draft','pending','published','archived')),
  view_count   integer default 0,
  published_at timestamptz,
  created_at   timestamptz default now()
);
create index news_status_idx on public.news (status, published_at desc);
create index news_featured_idx on public.news (is_featured, published_at desc);

-- ---------- Badge / Achievement ----------
create table public.badges (
  id          serial primary key,
  code        text unique not null,
  name_th     text not null,
  description text,
  icon        text,
  criteria    jsonb
);
create table public.user_badges (
  user_id    uuid references public.profiles(id) on delete cascade,
  badge_id   integer references public.badges(id) on delete cascade,
  earned_at  timestamptz default now(),
  primary key (user_id, badge_id)
);

-- ---------- Point log ----------
create table public.point_transactions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,
  reason      text not null,
  ref_type    text,
  ref_id      bigint,
  created_at  timestamptz default now()
);
create index point_tx_user_idx on public.point_transactions (user_id, created_at desc);

-- ---------- Direct Message ----------
create table public.conversations (
  id              bigserial primary key,
  created_at      timestamptz default now(),
  last_message_at timestamptz default now()
);
create table public.conversation_members (
  conversation_id bigint references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  last_read_at    timestamptz default now(),
  primary key (conversation_id, user_id)
);
create index conv_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id              bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text,
  attachment_url  text,
  created_at      timestamptz default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

-- ---------- การแจ้งเตือน ----------
create table public.notifications (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  payload     jsonb,
  is_read     boolean default false,
  created_at  timestamptz default now()
);
create index notif_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ---------- รายงานเนื้อหา (moderation) ----------
create table public.reports (
  id          bigserial primary key,
  reporter_id uuid references public.profiles(id),
  target_type text not null,
  target_id   bigint not null,
  reason      text,
  status      text default 'open'
                check (status in ('open','reviewed','dismissed')),
  created_at  timestamptz default now()
);


-- >>>>>>>>>>>>>>>> 0002_functions_triggers.sql >>>>>>>>>>>>>>>>

-- ============================================================
-- Kawan2 — Functions & Triggers
-- 0002_functions_triggers.sql
-- ============================================================

-- ---------- helper: role = admin ----------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

-- ---------- helper: staff = editor หรือ admin ----------
create or replace function public.is_staff(uid uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('editor','admin')
  );
$$;

-- ---------- helper: is_editor (editor/admin) — ใช้ใน RLS ข่าว/storage ----------
create or replace function public.is_editor(uid uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('editor','admin')
  );
$$;

-- ---------- สร้าง profile อัตโนมัติเมื่อสมัครสมาชิก ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  uname text;
begin
  -- เลือก base username: username ที่ส่งมา > local-part ของอีเมล (รองรับ Google) > user_xxxx
  uname := nullif(meta->>'username', '');
  if uname is null then
    uname := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));
  end if;
  if uname is null or length(uname) < 3 then
    uname := 'user_' || left(new.id::text, 8);
  end if;

  -- กันชื่อซ้ำ
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || '_' || left(new.id::text, 4);
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    uname,
    coalesce(meta->>'display_name', meta->>'full_name', meta->>'name', uname),
    coalesce(meta->>'avatar_url', meta->>'picture')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ให้ point + เลื่อน level อัตโนมัติ ----------
create or replace function public.apply_point_transaction()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  new_rep integer;
  new_level smallint;
begin
  update public.profiles
    set reputation = greatest(0, reputation + new.amount), updated_at = now()
    where id = new.user_id
    returning reputation into new_rep;

  select id into new_level
    from public.membership_levels
    where min_points <= new_rep
    order by min_points desc
    limit 1;

  if new_level is not null then
    update public.profiles
      set level_id = new_level
      where id = new.user_id and level_id <> new_level;
  end if;
  return new;
end; $$;

drop trigger if exists on_point_tx on public.point_transactions;
create trigger on_point_tx
  after insert on public.point_transactions
  for each row execute function public.apply_point_transaction();

-- ---------- helper: บันทึก point (ใช้จาก app/triggers) ----------
create or replace function public.award_points(p_user uuid, p_amount int, p_reason text, p_ref_type text default null, p_ref_id bigint default null)
returns void
language sql security definer set search_path = public as $$
  insert into public.point_transactions (user_id, amount, reason, ref_type, ref_id)
  values (p_user, p_amount, p_reason, p_ref_type, p_ref_id);
$$;

-- ---------- denormalize: reply_count ----------
create or replace function public.bump_reply_count()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.threads set reply_count = reply_count + 1, updated_at = now()
      where id = new.thread_id;
    perform public.award_points(new.author_id, 5, 'post_create', 'post', new.id);
  elsif tg_op = 'DELETE' then
    update public.threads set reply_count = greatest(0, reply_count - 1)
      where id = old.thread_id;
  end if;
  return null;
end; $$;

drop trigger if exists on_post_change on public.posts;
create trigger on_post_change
  after insert or delete on public.posts
  for each row execute function public.bump_reply_count();

-- ---------- ให้ point เมื่อสร้างกระทู้ ----------
create or replace function public.on_thread_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.award_points(new.author_id, 10, 'thread_create', 'thread', new.id);
  return new;
end; $$;

drop trigger if exists on_thread_created on public.threads;
create trigger on_thread_created
  after insert on public.threads
  for each row execute function public.on_thread_insert();

-- ---------- denormalize: like_count + ให้ point เจ้าของ ----------
create or replace function public.on_reaction_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner_id uuid;
begin
  if tg_op = 'INSERT' and new.type = 'like' then
    if new.target_type = 'thread' then
      update public.threads set like_count = like_count + 1 where id = new.target_id
        returning author_id into owner_id;
    elsif new.target_type = 'post' then
      update public.posts set like_count = like_count + 1 where id = new.target_id
        returning author_id into owner_id;
    end if;
    if owner_id is not null and owner_id <> new.user_id then
      perform public.award_points(owner_id, 2, 'received_like', new.target_type, new.target_id);
    end if;
  elsif tg_op = 'DELETE' and old.type = 'like' then
    if old.target_type = 'thread' then
      update public.threads set like_count = greatest(0, like_count - 1) where id = old.target_id;
    elsif old.target_type = 'post' then
      update public.posts set like_count = greatest(0, like_count - 1) where id = old.target_id;
    end if;
  end if;
  return null;
end; $$;

drop trigger if exists on_reaction on public.reactions;
create trigger on_reaction
  after insert or delete on public.reactions
  for each row execute function public.on_reaction_change();

-- ---------- เพิ่ม view count (best-effort, ไม่ผ่าน RLS) ----------
create or replace function public.increment_view(p_thread bigint)
returns void
language sql security definer set search_path = public as $$
  update public.threads set view_count = view_count + 1 where id = p_thread;
$$;
grant execute on function public.increment_view(bigint) to anon, authenticated;

-- ---------- DM: อัปเดต last_message_at + สร้าง notification ----------
create or replace function public.on_message_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;

  insert into public.notifications (user_id, type, payload)
  select cm.user_id, 'dm',
         jsonb_build_object('conversation_id', new.conversation_id, 'sender_id', new.sender_id)
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id;
  return new;
end; $$;

drop trigger if exists on_message on public.messages;
create trigger on_message
  after insert on public.messages
  for each row execute function public.on_message_insert();


-- >>>>>>>>>>>>>>>> 0003_rls.sql >>>>>>>>>>>>>>>>

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
  for delete using (public.is_editor(auth.uid()));

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


-- >>>>>>>>>>>>>>>> 0004_storage.sql >>>>>>>>>>>>>>>>

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


-- >>>>>>>>>>>>>>>> 0005_realtime.sql >>>>>>>>>>>>>>>>

-- ============================================================
-- Kawan2 — เปิด Realtime สำหรับ DM และ notifications
-- 0005_realtime.sql
-- ============================================================
-- เพิ่มตารางเข้า publication ของ Supabase Realtime
-- (RLS ยังคงคุมว่า client เห็น row ไหน)

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;


-- >>>>>>>>>>>>>>>> 0006_events.sql >>>>>>>>>>>>>>>>

-- ============================================================
-- Kawan2 — ตารางกิจกรรม (Events)
-- 0006_events.sql
-- ============================================================

create table public.events (
  id          bigserial primary key,
  title       text not null,
  description text,
  location    text,
  province_id smallint references public.provinces(id),
  cover_url   text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);
create index events_starts_idx on public.events (starts_at);

alter table public.events enable row level security;
create policy "events_read" on public.events
  for select using (true);
create policy "events_insert_staff" on public.events
  for insert with check (public.is_staff(auth.uid()));
create policy "events_update_staff" on public.events
  for update using (public.is_staff(auth.uid()));
create policy "events_delete_staff" on public.events
  for delete using (public.is_staff(auth.uid()));


-- >>>>>>>>>>>>>>>> 0007_subscriptions.sql >>>>>>>>>>>>>>>>

-- ============================================================
-- Kawan2 — ระบบสมาชิกแบบเสียเงิน (Stripe subscription)
-- 0007_subscriptions.sql
-- ============================================================

-- ขยาย profiles: เก็บ Stripe customer + ระดับสมาชิกที่เสียเงิน
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists membership_tier text not null default 'free'
    check (membership_tier in ('free', 'supporter', 'patron')),
  add column if not exists membership_until timestamptz;

-- ตาราง subscription (sync จาก Stripe ผ่าน webhook)
create table if not exists public.subscriptions (
  id                    text primary key,          -- Stripe subscription id (sub_...)
  user_id               uuid not null references public.profiles(id) on delete cascade,
  status                text not null,             -- active / trialing / past_due / canceled / ...
  tier                  text not null check (tier in ('supporter', 'patron')),
  price_id              text,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- RLS: เจ้าของอ่าน subscription ตัวเองได้ — การเขียนทำผ่าน service role (webhook) เท่านั้น
alter table public.subscriptions enable row level security;
drop policy if exists "subs_select_own" on public.subscriptions;
create policy "subs_select_own" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));


-- >>>>>>>>>>>>>>>> 0008_admin_levels.sql >>>>>>>>>>>>>>>>

-- ============================================================
-- Kawan2 — ให้ admin แก้ชื่อ/เกณฑ์ระดับสมาชิกได้
-- 0008_admin_levels.sql
-- ============================================================

-- คำนวณ level ใหม่ของสมาชิกทุกคนตามเกณฑ์ปัจจุบัน (เรียกหลังแก้ threshold)
create or replace function public.recalc_all_levels()
returns void language sql security definer set search_path = public as $$
  update public.profiles p set level_id = coalesce((
    select id from public.membership_levels ml
    where ml.min_points <= p.reputation
    order by ml.min_points desc limit 1
  ), 1);
$$;

-- แก้ระดับสมาชิก (เฉพาะ admin) แล้ว recalc ให้สมาชิกทันที
create or replace function public.update_level(
  p_id smallint, p_name_th text, p_name_en text, p_min_points integer
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden: เฉพาะ admin เท่านั้น';
  end if;
  if p_min_points < 0 then raise exception 'min_points ต้องไม่ติดลบ'; end if;

  update public.membership_levels
    set name_th = p_name_th, name_en = p_name_en, min_points = p_min_points
    where id = p_id;

  perform public.recalc_all_levels();
end; $$;

grant execute on function public.update_level(smallint, text, text, integer) to authenticated;
grant execute on function public.recalc_all_levels() to authenticated;


-- >>>>>>>>>>>>>>>> seed.sql >>>>>>>>>>>>>>>>

-- ============================================================
-- Kawan2 — Seed data
-- รัน: supabase db reset (จะรัน migrations + seed อัตโนมัติ)
-- ============================================================

-- ---------- จังหวัด (3 จังหวัดชายแดนใต้) ----------
insert into public.provinces (name_th, name_en, slug) values
  ('ปัตตานี',   'Pattani',     'pattani'),
  ('นราธิวาส',  'Narathiwat',  'narathiwat'),
  ('ยะลา',      'Yala',        'yala')
on conflict (slug) do nothing;

-- ---------- ระดับสมาชิก ----------
insert into public.membership_levels (id, name_th, name_en, min_points, perks) values
  (1, 'สัมฤทธิ์',   'Bronze',   0,
     '{"post":true,"reply":true,"dm":true}'::jsonb),
  (2, 'เงิน',       'Silver',   500,
     '{"attach_file":true,"create_poll":true}'::jsonb),
  (3, 'ทอง',        'Gold',     2000,
     '{"pin_own":true,"custom_title":true}'::jsonb),
  (4, 'แพลทินัม',   'Platinum', 5000,
     '{"submit_news":true,"mod_lite":true,"special_badge":true}'::jsonb)
on conflict (id) do nothing;

-- ---------- หมวดหมู่เว็บบอร์ด ----------
insert into public.categories (name_th, slug, description, icon, sort_order) values
  ('พูดคุยทั่วไป',  'general',   'พูดคุยเรื่องทั่วไปของชุมชน',        'forum',       1),
  ('ข่าวสารท้องถิ่น','local-news','แลกเปลี่ยนข่าวในพื้นที่',           'newspaper',   2),
  ('วัฒนธรรม',     'culture',   'ประเพณี ภาษา อาหาร และมรดกวัฒนธรรม', 'temple_buddhist', 3),
  ('การศึกษา',     'education', 'ทุน การเรียน และโอกาสทางการศึกษา',   'school',      4),
  ('ท่องเที่ยว',   'travel',    'สถานที่ ที่พัก และของกิน',          'travel',      5),
  ('กีฬา',         'sports',    'ฟุตบอล ตะกร้อ และกีฬาในพื้นที่',     'sports_soccer', 6),
  ('ซื้อ-ขาย',     'market',    'ประกาศซื้อขายแลกเปลี่ยน',           'storefront',  7)
on conflict (slug) do nothing;

-- ---------- Badge ตัวอย่าง ----------
insert into public.badges (code, name_th, description, icon, criteria) values
  ('first_post',   'โพสต์แรก',        'สร้างกระทู้แรกของคุณ',           'edit',     '{"threads":1}'::jsonb),
  ('helper',       'ผู้ช่วยเหลือ',     'ตอบกระทู้ครบ 100 ครั้ง',         'volunteer_activism', '{"posts":100}'::jsonb),
  ('popular',      'ยอดนิยม',         'ได้รับไลก์รวม 1,000 ครั้ง',       'favorite', '{"likes":1000}'::jsonb),
  ('veteran',      'รุ่นเก๋า',         'เป็นสมาชิกครบ 1 ปี',             'military_tech', '{"days":365}'::jsonb)
on conflict (code) do nothing;

-- ============================================================
-- หมายเหตุ: ข้อมูล profiles/threads/news ต้องผูกกับ auth.users จริง
-- หลังสมัครสมาชิกผ่านแอป สามารถตั้ง role เป็น admin ได้ด้วย:
--   update public.profiles set role = 'admin' where username = 'YOUR_USERNAME';
-- ============================================================
