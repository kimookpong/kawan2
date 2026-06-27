-- ============================================================
-- Kawan2 — ย้ายฟังก์ชันที่ใช้ใน RLS เท่านั้นไป schema private
-- 0037_move_internal_funcs_to_private.sql
-- PostgREST exposed เฉพาะ schema 'public' โดย default → ฟังก์ชันใน
-- 'private' จะไม่ถูก advisor flag และไม่เปิด REST
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon;

-- is_conversation_member ใช้ใน RLS เท่านั้น (ตัด recursion)
CREATE OR REPLACE FUNCTION private.is_conversation_member(p_conv bigint)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conv AND user_id = auth.uid()
  );
$$;
REVOKE EXECUTE ON FUNCTION private.is_conversation_member(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.is_conversation_member(bigint) TO authenticated;

DROP POLICY IF EXISTS "conv_members_select" ON public.conversation_members;
CREATE POLICY "conv_members_select" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid() OR private.is_conversation_member(conversation_id)
  );

DROP POLICY IF EXISTS "conv_select_member" ON public.conversations;
CREATE POLICY "conv_select_member" ON public.conversations
  FOR SELECT USING (private.is_conversation_member(id));

DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (private.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "messages_insert_member" ON public.messages;
CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND NOT public.is_blocked(auth.uid())
    AND private.is_conversation_member(conversation_id)
  );

DROP FUNCTION IF EXISTS public.is_conversation_member(bigint);
