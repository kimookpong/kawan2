-- ============================================================
-- Kawan2 — จำกัดการเปลี่ยน username / display_name ปีละครั้ง + admin reset
-- 0011_name_cooldown.sql
-- ============================================================

alter table public.profiles
  add column if not exists username_changed_at timestamptz,
  add column if not exists display_name_changed_at timestamptz;

create or replace function public.enforce_name_cooldown()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.username is distinct from old.username then
    if old.username_changed_at is not null and old.username_changed_at > now() - interval '365 days' then
      raise exception 'เปลี่ยนชื่อผู้ใช้ได้ปีละครั้ง (ครั้งถัดไปได้ %)',
        to_char(old.username_changed_at + interval '365 days', 'DD/MM/YYYY');
    end if;
    new.username_changed_at := now();
  end if;
  if new.display_name is distinct from old.display_name then
    if old.display_name_changed_at is not null and old.display_name_changed_at > now() - interval '365 days' then
      raise exception 'เปลี่ยนชื่อที่แสดงได้ปีละครั้ง (ครั้งถัดไปได้ %)',
        to_char(old.display_name_changed_at + interval '365 days', 'DD/MM/YYYY');
    end if;
    new.display_name_changed_at := now();
  end if;
  return new;
end; $$;

drop trigger if exists enforce_name_cooldown on public.profiles;
create trigger enforce_name_cooldown before update on public.profiles
  for each row execute function public.enforce_name_cooldown();

create or replace function public.admin_reset_user_names(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  update public.profiles set username_changed_at = null, display_name_changed_at = null where id = target;
end; $$;

grant execute on function public.admin_reset_user_names(uuid) to authenticated;
