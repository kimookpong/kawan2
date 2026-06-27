-- ============================================================
-- Kawan2 — เพิ่มฟีเจอร์ "เห็นเฉพาะสมาชิก" สำหรับกระทู้
-- 0024_members_only_threads.sql
-- หมายเหตุ: แยกจาก is_locked (ปิดการตอบ) ที่มีอยู่เดิม
-- ============================================================

ALTER TABLE public.threads
  ADD COLUMN IF NOT EXISTS members_only boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS threads_members_only_idx
  ON public.threads (members_only) WHERE members_only;

-- threads_select: anon (ผู้ไม่ล็อกอิน) เห็นเฉพาะกระทู้ที่ไม่ได้ตั้งค่า members_only
DROP POLICY IF EXISTS "threads_select" ON public.threads;
CREATE POLICY "threads_select" ON public.threads
  FOR SELECT USING (
    (status = 'published' AND (NOT members_only OR auth.uid() IS NOT NULL))
    OR author_id = auth.uid()
    OR public.is_staff(auth.uid())
  );

-- posts_select: anon ไม่เห็นความเห็นที่อยู่ในกระทู้ members_only
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts
  FOR SELECT USING (
    (
      status = 'published'
      AND NOT EXISTS (
        SELECT 1 FROM public.threads t
        WHERE t.id = posts.thread_id
          AND t.members_only
          AND auth.uid() IS NULL
      )
    )
    OR author_id = auth.uid()
    OR public.is_staff(auth.uid())
  );
