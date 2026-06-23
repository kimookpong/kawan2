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
