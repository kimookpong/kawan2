-- ============================================================
-- Kawan2 — แก้ไขชื่อกิลด์
-- หัวหน้ากิลด์ (owner) เปลี่ยนชื่อได้ปีละครั้ง · แอดมินเปลี่ยนได้ตลอด
-- 0018_guild_rename.sql
-- ============================================================

alter table public.guilds
  add column if not exists name_changed_at timestamptz;

create or replace function public.rename_guild(p_guild bigint, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_owner   uuid;
  v_changed timestamptz;
  v_admin   boolean;
  v_name    text := btrim(p_name);
begin
  if v_uid is null then
    raise exception 'ต้องเข้าสู่ระบบก่อน';
  end if;
  if char_length(v_name) < 2 then
    raise exception 'ชื่อกิลด์ต้องมีอย่างน้อย 2 ตัวอักษร';
  end if;
  if char_length(v_name) > 50 then
    raise exception 'ชื่อกิลด์ต้องไม่เกิน 50 ตัวอักษร';
  end if;

  select owner_id, name_changed_at into v_owner, v_changed
  from public.guilds where id = p_guild;
  if not found then
    raise exception 'ไม่พบกิลด์';
  end if;

  v_admin := is_admin(v_uid);

  if not v_admin then
    if v_uid <> v_owner then
      raise exception 'เฉพาะหัวหน้ากิลด์หรือแอดมินเท่านั้นที่แก้ไขชื่อได้';
    end if;
    if v_changed is not null and v_changed > now() - interval '1 year' then
      raise exception 'หัวหน้ากิลด์เปลี่ยนชื่อได้ปีละครั้ง — เปลี่ยนได้อีกครั้งหลังวันที่ %',
        to_char((v_changed + interval '1 year') at time zone 'Asia/Bangkok', 'DD/MM/YYYY');
    end if;
  end if;

  update public.guilds
  set name = v_name,
      -- นับโควตาเฉพาะเมื่อหัวหน้าเปลี่ยนเอง; แอดมินเปลี่ยนไม่กินโควตาของหัวหน้า
      name_changed_at = case when v_admin then name_changed_at else now() end
  where id = p_guild;
end;
$$;

grant execute on function public.rename_guild(bigint, text) to authenticated;
