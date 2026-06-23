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
-- บรรดาศักดิ์ขุนนางมลายูโบราณ (แหลมมลายู/ปาตานี) — สามัญชน → อัครมหาเสนาบดี
insert into public.membership_levels (id, name_th, name_en, min_points, perks) values
  (1, 'รายัต',       'Rakyat',     0,     '{"post":true,"reply":true,"dm":true}'::jsonb),
  (2, 'ฮูลูบาลัง',   'Hulubalang', 200,   '{}'::jsonb),
  (3, 'เบินตารา',    'Bentara',    600,   '{}'::jsonb),
  (4, 'ออรัง กายอ',  'Orang Kaya', 1200,  '{"attach_file":true}'::jsonb),
  (5, 'ปังลีมา',     'Panglima',   2500,  '{}'::jsonb),
  (6, 'เตอเมิงกุง',  'Temenggung', 4500,  '{}'::jsonb),
  (7, 'ลักษมณา',     'Laksamana',  7000,  '{"submit_news":true}'::jsonb),
  (8, 'เบินดาฮารา',  'Bendahara',  10000, '{"submit_news":true,"special_badge":true}'::jsonb)
on conflict (id) do nothing;

-- ---------- หมวดหมู่เว็บบอร์ด (4 หมวด) ----------
insert into public.categories (name_th, slug, description, icon, sort_order) values
  ('ทั่วไป',     'general',   'พูดคุยเรื่องทั่วไปของชุมชน',         'forum',         1),
  ('กีฬา',       'sports',    'ฟุตบอล ตะกร้อ และกีฬาในพื้นที่',     'sports_soccer', 2),
  ('ท่องเที่ยว', 'travel',    'สถานที่ ที่พัก และของกิน',          'travel',        3),
  ('การศึกษา',   'education', 'ทุน การเรียน และโอกาสทางการศึกษา',   'school',        4)
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
