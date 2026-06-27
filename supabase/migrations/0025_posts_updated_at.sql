-- ============================================================
-- Kawan2 — เพิ่ม posts.updated_at สำหรับแสดงสถานะ "แก้ไขเมื่อ"
-- 0025_posts_updated_at.sql
-- ============================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
