-- ============================================================
-- Kawan2 — ปฏิทินกิจกรรม: จำกัดสิทธิ์ลบให้เฉพาะ admin
-- (เพิ่ม/แก้ไข ยังคงเป็น staff = admin + editor ตามเดิม)
-- 0022_events_delete_admin_only.sql
-- ============================================================

drop policy if exists events_delete_staff on public.events;

create policy events_delete_admin on public.events
  for delete
  using (is_admin(auth.uid()));
