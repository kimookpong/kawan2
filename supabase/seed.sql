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
