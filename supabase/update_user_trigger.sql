-- ============================================================
-- Kawan2 — อัปเดต trigger handle_new_user ให้รองรับ Google OAuth
-- ตั้ง username จากอีเมล, display_name + avatar จากบัญชี Google
-- รันไฟล์นี้ใน SQL Editor (แทนที่ฟังก์ชันเดิม — ปลอดภัย รันซ้ำได้)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  uname text;
begin
  -- 1) เลือก base username: username ที่ส่งมา > local-part ของอีเมล > user_xxxx
  uname := nullif(meta->>'username', '');
  if uname is null then
    uname := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));
  end if;
  if uname is null or length(uname) < 3 then
    uname := 'user_' || left(new.id::text, 8);
  end if;

  -- 2) กันชื่อซ้ำ
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

-- trigger เดิมยังใช้ฟังก์ชันนี้อยู่แล้ว ไม่ต้องสร้างใหม่
