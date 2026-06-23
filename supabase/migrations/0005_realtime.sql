-- ============================================================
-- Kawan2 — เปิด Realtime สำหรับ DM และ notifications
-- 0005_realtime.sql
-- ============================================================
-- เพิ่มตารางเข้า publication ของ Supabase Realtime
-- (RLS ยังคงคุมว่า client เห็น row ไหน)

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;
