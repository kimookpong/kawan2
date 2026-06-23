-- ============================================================
-- Kawan2 — เพิ่มหมวด "กีฬา" ในเว็บบอร์ด
-- รันใน SQL Editor (ปลอดภัย รันซ้ำได้)
-- ============================================================

-- เพิ่มหมวดกีฬา (sort_order 6) แล้วเลื่อน "ซื้อ-ขาย" ไปท้าย (7)
insert into public.categories (name_th, slug, description, icon, sort_order)
values ('กีฬา', 'sports', 'ฟุตบอล ตะกร้อ และกีฬาในพื้นที่', 'sports_soccer', 6)
on conflict (slug) do nothing;

update public.categories set sort_order = 7 where slug = 'market';

-- (ไม่บังคับ) กระทู้ตัวอย่างในหมวดกีฬา — ต้องมี demo users จาก demo_seed.sql ก่อน
insert into public.threads (author_id, category_id, province_id, title, body)
select aid, cid, pid, title, body from (values
  ('a0000000-0000-0000-0000-000000000004'::uuid,
   (select id from public.categories where slug = 'sports'),
   (select id from public.provinces where slug = 'yala'),
   'ชวนเตะบอลเย็นวันเสาร์ที่สนามในเมืองยะลา',
   E'รวมทีมเตะบอลกันเย็นวันเสาร์ ใครสนใจมาเข้าร่วมได้ ไม่จำกัดฝีเท้า เน้นสนุกและออกกำลังกาย'),
  ('a0000000-0000-0000-0000-000000000003'::uuid,
   (select id from public.categories where slug = 'sports'),
   (select id from public.provinces where slug = 'narathiwat'),
   'แนะนำสนามตะกร้อในนราธิวาสหน่อยครับ',
   E'อยากหาสนามตะกร้อไว้เล่นช่วงเย็น มีที่ไหนแนะนำบ้างครับ พร้อมเวลาที่คนเยอะๆ จะได้ไปหาเพื่อนเล่น')
) as v(aid, cid, pid, title, body)
where exists (select 1 from public.profiles where id = 'a0000000-0000-0000-0000-000000000004')
on conflict do nothing;
