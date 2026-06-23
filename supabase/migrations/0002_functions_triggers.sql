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
