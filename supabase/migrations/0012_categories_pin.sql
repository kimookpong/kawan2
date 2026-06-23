-- ============================================================
-- Kawan2 — ปรับหมวดเหลือ 4 + ฟังก์ชันปักหมุดกระทู้ (admin)
-- 0012_categories_pin.sql
-- ============================================================

update public.categories set name_th='ทั่วไป',     sort_order=1, is_active=true  where slug='general';
update public.categories set name_th='กีฬา',       sort_order=2, is_active=true  where slug='sports';
update public.categories set name_th='ท่องเที่ยว', sort_order=3, is_active=true  where slug='travel';
update public.categories set name_th='การศึกษา',   sort_order=4, is_active=true  where slug='education';
update public.categories set is_active=false where slug in ('local-news','culture','market');

create or replace function public.set_thread_pin(p_thread bigint, p_pinned boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  update public.threads set is_pinned = p_pinned, updated_at = now() where id = p_thread;
end; $$;
grant execute on function public.set_thread_pin(bigint, boolean) to authenticated;
