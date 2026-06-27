-- ============================================================
-- Kawan2 — แก้ infinite recursion ใน conversation_members RLS
-- 0026_fix_conversation_members_recursion.sql
--
-- ปัญหา: conv_members_select policy เดิม subquery กลับมาที่ตัวเอง
-- → ทำให้ทุก policy ที่ subquery บน conversation_members
--   (รวม messages_select_member, messages_insert_member, conv_select_member)
--   trigger recursion → ส่งข้อความใน DM ไม่ได้
--
-- วิธีแก้: ใช้ SECURITY DEFINER function ที่ bypass RLS เป็น guard
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conv bigint)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conv AND user_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_conversation_member(bigint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(bigint) TO authenticated;

-- conversation_members.SELECT
DROP POLICY IF EXISTS "conv_members_select" ON public.conversation_members;
CREATE POLICY "conv_members_select" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_conversation_member(conversation_id)
  );

-- conversations.SELECT
DROP POLICY IF EXISTS "conv_select_member" ON public.conversations;
CREATE POLICY "conv_select_member" ON public.conversations
  FOR SELECT USING (
    public.is_conversation_member(id)
  );

-- messages.SELECT
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (
    public.is_conversation_member(conversation_id)
  );

-- messages.INSERT (รักษาเงื่อนไข is_blocked จาก 0013_moderation.sql)
DROP POLICY IF EXISTS "messages_insert_member" ON public.messages;
CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND NOT public.is_blocked(auth.uid())
    AND public.is_conversation_member(conversation_id)
  );
