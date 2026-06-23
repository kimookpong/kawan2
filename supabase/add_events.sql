-- ============================================================
-- Kawan2 — เพิ่มตาราง events + กิจกรรมตัวอย่าง
-- รันไฟล์นี้ถ้าคุณรัน setup_all.sql / demo_seed.sql ไปแล้วก่อนมี events
-- (ปลอดภัยต่อการรันซ้ำ — ใช้ if not exists / on conflict)
-- ============================================================

-- ---------- ตาราง events ----------
create table if not exists public.events (
  id          bigserial primary key,
  title       text not null,
  description text,
  location    text,
  province_id smallint references public.provinces(id),
  cover_url   text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);
create index if not exists events_starts_idx on public.events (starts_at);

alter table public.events enable row level security;

drop policy if exists "events_read" on public.events;
create policy "events_read" on public.events for select using (true);
drop policy if exists "events_insert_staff" on public.events;
create policy "events_insert_staff" on public.events for insert with check (public.is_staff(auth.uid()));
drop policy if exists "events_update_staff" on public.events;
create policy "events_update_staff" on public.events for update using (public.is_staff(auth.uid()));
drop policy if exists "events_delete_staff" on public.events;
create policy "events_delete_staff" on public.events for delete using (public.is_staff(auth.uid()));

-- ---------- กิจกรรมตัวอย่าง ----------
insert into public.events (title, description, location, province_id, cover_url, starts_at)
values
  ('เทศกาลอาหารพื้นถิ่นนราธิวาส',
   'รวมร้านอาหารและขนมพื้นเมืองกว่า 100 ร้าน พร้อมการแสดงศิลปวัฒนธรรม',
   'สนามหน้าศาลากลาง จ.นราธิวาส',
   (select id from public.provinces where slug = 'narathiwat'),
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
   now() + interval '5 day'),
  ('เดินชมเมืองเก่าปัตตานี',
   'กิจกรรมเดินชมย่านการค้าเก่าและสถาปัตยกรรมจีน-มลายู มีไกด์ชุมชนนำชมฟรี',
   'ย่านเมืองเก่า จ.ปัตตานี',
   (select id from public.provinces where slug = 'pattani'),
   'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
   now() + interval '9 day'),
  ('อบรมทักษะดิจิทัลสำหรับเยาวชน',
   'เวิร์กช็อปพื้นฐานการทำเว็บและออกแบบ สำหรับน้องๆ ในพื้นที่ยะลา',
   'ศูนย์เยาวชน จ.ยะลา',
   (select id from public.provinces where slug = 'yala'),
   'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
   now() + interval '14 day')
on conflict do nothing;
