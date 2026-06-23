-- ============================================================
-- Kawan2 — Demo seed (ข้อมูลตัวอย่างสำหรับทดสอบ/เดโม)
-- รันหลังจาก setup_all.sql เรียบร้อยแล้ว
-- วางทั้งไฟล์ใน Supabase SQL Editor แล้วกด Run
--
-- สร้าง demo users 4 คน (ผ่าน auth.users → trigger สร้าง profile ให้)
-- + ข่าว 3, กระทู้ 5, ความเห็น, และไลก์ (คะแนน/ระดับคำนวณอัตโนมัติ)
--
-- หมายเหตุ: demo users มีไว้ "แสดงผล" — ทุกคนรหัสผ่าน = demo1234
--           (ล็อกอินได้ผ่าน identities ด้านล่าง) อีเมล @demo.kawan2
-- ลบข้อมูลเดโมทั้งหมด: delete from auth.users where email like '%@demo.kawan2';
-- ============================================================

-- ---------- 1) สร้าง demo users ----------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data,
   confirmation_token, recovery_token, email_change, email_change_token_new, reauthentication_token)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'admin@demo.kawan2',
   crypt('demo1234', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"adminhakim","display_name":"Hakim (Admin)"}', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'editor@demo.kawan2',
   crypt('demo1234', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"news_selatan","display_name":"กองบรรณาธิการชายแดนใต้"}', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'aminee@demo.kawan2',
   crypt('demo1234', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"aminee23","display_name":"Aminee"}', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'ruslan@demo.kawan2',
   crypt('demo1234', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"ruslan_yala","display_name":"Ruslan"}', '', '', '', '', '')
on conflict (id) do nothing;

-- ---------- 2) identities (ให้ล็อกอินด้วย email/password ได้) ----------
insert into auth.identities
  (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@demo.kawan2"}', 'email', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   '{"sub":"a0000000-0000-0000-0000-000000000002","email":"editor@demo.kawan2"}', 'email', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003',
   '{"sub":"a0000000-0000-0000-0000-000000000003","email":"aminee@demo.kawan2"}', 'email', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
   '{"sub":"a0000000-0000-0000-0000-000000000004","email":"ruslan@demo.kawan2"}', 'email', now(), now(), now())
on conflict do nothing;

-- ---------- 3) อัปเดต profile (role / จังหวัด / bio) ----------
update public.profiles set role = 'admin',
  province_id = (select id from public.provinces where slug = 'pattani'),
  bio = 'ผู้ดูแลระบบ Kawan2'
  where id = 'a0000000-0000-0000-0000-000000000001';

update public.profiles set role = 'editor',
  province_id = (select id from public.provinces where slug = 'pattani'),
  bio = 'รายงานข่าวสารและกิจกรรมในพื้นที่ 3 จังหวัดชายแดนใต้'
  where id = 'a0000000-0000-0000-0000-000000000002';

update public.profiles set
  province_id = (select id from public.provinces where slug = 'narathiwat'),
  bio = 'ชอบถ่ายรูปและเล่าเรื่องวัฒนธรรมท้องถิ่น'
  where id = 'a0000000-0000-0000-0000-000000000003';

update public.profiles set
  province_id = (select id from public.provinces where slug = 'yala'),
  bio = 'สาย dev ที่ยะลา ชอบพูดคุยเรื่องเทคโนโลยี'
  where id = 'a0000000-0000-0000-0000-000000000004';

-- ---------- 4) ข่าวสาร ----------
insert into public.news
  (author_id, province_id, category, title, slug, excerpt, body, cover_url, is_featured, status, published_at)
values
  ('a0000000-0000-0000-0000-000000000002',
   (select id from public.provinces where slug = 'pattani'),
   'วัฒนธรรม',
   'เปิดเส้นทางมรดกเมืองปัตตานี เชื่อมประวัติศาสตร์การค้าโบราณ',
   'pattani-heritage-trail-2026',
   'เส้นทางท่องเที่ยวเชิงวัฒนธรรมที่พาย้อนรอยเมืองท่าการค้าเก่าแก่ของปัตตานี',
   E'เทศบาลร่วมกับชุมชนเปิดเส้นทางเดินชมเมืองเก่าปัตตานี ครอบคลุมมัสยิดเก่า ย่านการค้า และสถาปัตยกรรมผสมผสานจีน-มลายู\n\nกิจกรรมจัดทุกสุดสัปดาห์ มีไกด์ชุมชนนำชมฟรี เพื่อส่งเสริมเศรษฐกิจฐานรากและอนุรักษ์มรดกวัฒนธรรม',
   'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200',
   true, 'published', now() - interval '2 hour'),
  ('a0000000-0000-0000-0000-000000000002',
   (select id from public.provinces where slug = 'yala'),
   'การศึกษา',
   'ทุนการศึกษาเยาวชนชายแดนใต้ ปี 2569 เปิดรับสมัครแล้ว',
   'youth-scholarship-2569',
   'ทุนสำหรับนักเรียนในพื้นที่ 3 จังหวัด ระดับมัธยมถึงปริญญาตรี',
   E'โครงการทุนการศึกษาเปิดรับสมัครนักเรียน-นักศึกษาในพื้นที่ปัตตานี นราธิวาส และยะลา\n\nผู้สนใจสามารถสมัครผ่านโรงเรียนต้นสังกัด ภายในสิ้นเดือนนี้',
   'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
   false, 'published', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000002',
   (select id from public.provinces where slug = 'narathiwat'),
   'กิจกรรม',
   'เทศกาลอาหารพื้นถิ่นนราธิวาส รวมของอร่อยกว่า 100 ร้าน',
   'narathiwat-food-festival-2026',
   'งานเทศกาลอาหารประจำปี รวมเมนูเด็ดประจำถิ่นและของหวานมลายู',
   E'เทศกาลอาหารพื้นถิ่นจัดขึ้นที่สนามหน้าศาลากลาง รวมร้านอาหารและขนมพื้นเมืองกว่า 100 ร้าน พร้อมการแสดงศิลปวัฒนธรรม',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
   false, 'published', now() - interval '3 day')
on conflict (slug) do nothing;

-- ---------- 5) กระทู้ ----------
insert into public.threads (author_id, category_id, province_id, title, body)
values
  ('a0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'travel'),
   (select id from public.provinces where slug = 'pattani'),
   'แนะนำร้านน้ำชาเก่าแก่ในตัวเมืองปัตตานีหน่อยครับ',
   E'กำลังจะไปเที่ยวปัตตานีสุดสัปดาห์นี้ อยากลองบรรยากาศร้านน้ำชาแบบดั้งเดิม\nมีร้านไหนแนะนำบ้างครับ?'),
  ('a0000000-0000-0000-0000-000000000004',
   (select id from public.categories where slug = 'general'),
   (select id from public.provinces where slug = 'yala'),
   'มีใครทำงานสาย IT อยู่ยะลาบ้าง มารวมกลุ่มกัน',
   E'อยากหาเพื่อนสาย dev/ดีไซน์ในพื้นที่ยะลา ไว้แลกเปลี่ยนความรู้และอาจทำโปรเจกต์ชุมชนด้วยกัน'),
  ('a0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'travel'),
   (select id from public.provinces where slug = 'narathiwat'),
   'รีวิวหาดนราทัศน์ ช่วงเช้าสวยมาก',
   E'ไปเดินเล่นริมหาดตอนเช้า อากาศดีมาก คนไม่เยอะ เหมาะพาครอบครัวไป\nแนะนำให้ไปก่อน 8 โมงครับ'),
  ('a0000000-0000-0000-0000-000000000004',
   (select id from public.categories where slug = 'education'),
   (select id from public.provinces where slug = 'yala'),
   'รวมแหล่งทุนเรียนต่อสำหรับน้องๆ ในพื้นที่',
   E'รวบรวมลิงก์ทุนการศึกษาที่เปิดรับช่วงนี้ ใครมีข้อมูลเพิ่มมาช่วยกันเติมได้เลยครับ'),
  ('a0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'general'),
   (select id from public.provinces where slug = 'pattani'),
   'ส่งต่อจักรยานมือสอง สภาพดี ราคาคุยกันได้',
   E'มีจักรยานเสือภูเขาส่งต่อ ใช้น้อย สภาพดี อยู่ปัตตานี สนใจทักได้ครับ')
on conflict do nothing;

-- ---------- 6) ความเห็น ----------
insert into public.posts (thread_id, author_id, body)
values
  ((select id from public.threads where title = 'แนะนำร้านน้ำชาเก่าแก่ในตัวเมืองปัตตานีหน่อยครับ'),
   'a0000000-0000-0000-0000-000000000004',
   'แถวย่านตลาดเก่ามีหลายร้านเลยครับ ลองถามคนในพื้นที่ได้ บรรยากาศดีมาก'),
  ((select id from public.threads where title = 'แนะนำร้านน้ำชาเก่าแก่ในตัวเมืองปัตตานีหน่อยครับ'),
   'a0000000-0000-0000-0000-000000000001',
   'ขอ pin ไว้ให้นะครับ เป็นคำถามที่หลายคนน่าจะอยากรู้'),
  ((select id from public.threads where title = 'มีใครทำงานสาย IT อยู่ยะลาบ้าง มารวมกลุ่มกัน'),
   'a0000000-0000-0000-0000-000000000003',
   'สนใจครับ! ถึงจะไม่ใช่สาย dev โดยตรงแต่ทำคอนเทนต์ได้'),
  ((select id from public.threads where title = 'รีวิวหาดนราทัศน์ ช่วงเช้าสวยมาก'),
   'a0000000-0000-0000-0000-000000000004',
   'ภาพสวยมากครับ ว่าจะพาครอบครัวไปพอดี ขอบคุณสำหรับรีวิว'),
  ((select id from public.threads where title = 'รวมแหล่งทุนเรียนต่อสำหรับน้องๆ ในพื้นที่'),
   'a0000000-0000-0000-0000-000000000003',
   'มีประโยชน์มากครับ ขอแชร์ต่อให้น้องๆ ที่รู้จักนะครับ')
on conflict do nothing;

-- ---------- 7) ไลก์ (trigger จะอัปเดต like_count + ให้คะแนนเจ้าของ) ----------
insert into public.reactions (user_id, target_type, target_id, type)
values
  ('a0000000-0000-0000-0000-000000000001', 'thread',
   (select id from public.threads where title = 'รีวิวหาดนราทัศน์ ช่วงเช้าสวยมาก'), 'like'),
  ('a0000000-0000-0000-0000-000000000004', 'thread',
   (select id from public.threads where title = 'รีวิวหาดนราทัศน์ ช่วงเช้าสวยมาก'), 'like'),
  ('a0000000-0000-0000-0000-000000000003', 'thread',
   (select id from public.threads where title = 'มีใครทำงานสาย IT อยู่ยะลาบ้าง มารวมกลุ่มกัน'), 'like'),
  ('a0000000-0000-0000-0000-000000000001', 'thread',
   (select id from public.threads where title = 'แนะนำร้านน้ำชาเก่าแก่ในตัวเมืองปัตตานีหน่อยครับ'), 'like'),
  ('a0000000-0000-0000-0000-000000000004', 'thread',
   (select id from public.threads where title = 'แนะนำร้านน้ำชาเก่าแก่ในตัวเมืองปัตตานีหน่อยครับ'), 'like'),
  ('a0000000-0000-0000-0000-000000000003', 'thread',
   (select id from public.threads where title = 'รวมแหล่งทุนเรียนต่อสำหรับน้องๆ ในพื้นที่'), 'like')
on conflict (user_id, target_type, target_id, type) do nothing;

-- ---------- 8) มอบ badge "โพสต์แรก" ให้คนที่มีกระทู้ ----------
insert into public.user_badges (user_id, badge_id)
select distinct t.author_id, b.id
from public.threads t
cross join public.badges b
where b.code = 'first_post'
on conflict do nothing;

-- ---------- 9) ปักหมุดกระทู้ตัวอย่าง 1 อัน ----------
update public.threads set is_pinned = true
  where title = 'รวมแหล่งทุนเรียนต่อสำหรับน้องๆ ในพื้นที่';

-- ---------- 10) กิจกรรมตัวอย่าง (ต้องมีตาราง events จาก 0006/add_events ก่อน) ----------
insert into public.events (title, description, location, province_id, cover_url, starts_at, created_by)
values
  ('เทศกาลอาหารพื้นถิ่นนราธิวาส',
   'รวมร้านอาหารและขนมพื้นเมืองกว่า 100 ร้าน พร้อมการแสดงศิลปวัฒนธรรม',
   'สนามหน้าศาลากลาง จ.นราธิวาส',
   (select id from public.provinces where slug = 'narathiwat'),
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
   now() + interval '5 day', 'a0000000-0000-0000-0000-000000000002'),
  ('เดินชมเมืองเก่าปัตตานี',
   'กิจกรรมเดินชมย่านการค้าเก่าและสถาปัตยกรรมจีน-มลายู มีไกด์ชุมชนนำชมฟรี',
   'ย่านเมืองเก่า จ.ปัตตานี',
   (select id from public.provinces where slug = 'pattani'),
   'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
   now() + interval '9 day', 'a0000000-0000-0000-0000-000000000002'),
  ('อบรมทักษะดิจิทัลสำหรับเยาวชน',
   'เวิร์กช็อปพื้นฐานการทำเว็บและออกแบบ สำหรับน้องๆ ในพื้นที่ยะลา',
   'ศูนย์เยาวชน จ.ยะลา',
   (select id from public.provinces where slug = 'yala'),
   'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
   now() + interval '14 day', 'a0000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- เสร็จแล้ว! เปิดหน้าแรกจะเห็นข่าวเด่น กระทู้ กิจกรรม และหอเกียรติยศมีข้อมูล
