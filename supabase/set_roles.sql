-- ============================================================
-- Kawan2 — ตั้ง role ให้เป็น 3 ระดับ: admin / editor / member
-- (รวมทุกขั้น: map ข้อมูล + constraint + functions + RPC + reload cache)
-- รันใน SQL Editor — idempotent รันซ้ำได้ ไม่ว่า DB อยู่สถานะไหน
-- ============================================================

-- 1) map role เดิมทั้งหมดให้เข้า 3 ค่า (รองรับทั้งชุดเก่าและชุด user/mod)
alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles set role = case role
  when 'mod'       then 'editor'   -- จากชุด user/mod/admin
  when 'moderator' then 'editor'   -- จากชุดเดิม
  when 'user'      then 'member'   -- จากชุด user/mod/admin
  else role                        -- member / editor / admin คงเดิม
end
where role in ('mod', 'moderator', 'user');

alter table public.profiles alter column role set default 'member';
alter table public.profiles
  add constraint profiles_role_check check (role in ('member', 'editor', 'admin'));

-- 2) helper functions
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role in ('editor', 'admin'));
$$;

create or replace function public.is_editor(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role in ('editor', 'admin'));
$$;

-- 3) RPC เปลี่ยน role (เฉพาะ admin)
create or replace function public.set_user_role(target uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
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

-- 4) บังคับ PostgREST รีโหลด schema cache
notify pgrst, 'reload schema';
