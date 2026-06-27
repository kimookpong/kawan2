-- ============================================================
-- Kawan2 — "ลบแชต" แบบซ่อนจากรายการของผู้ใช้คนเดียว
-- 0028_hide_conversation_member.sql
-- ห้องจะยังอยู่ และจะกลับมาแสดงเมื่อมีข้อความใหม่ในห้องนั้น
-- ============================================================

ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

-- ขยาย on_message_insert ให้เคลียร์ hidden_at เมื่อมีข้อความใหม่
CREATE OR REPLACE FUNCTION public.on_message_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
    SET last_message_at = new.created_at
    WHERE id = new.conversation_id;

  UPDATE public.conversation_members
    SET hidden_at = NULL
    WHERE conversation_id = new.conversation_id
      AND hidden_at IS NOT NULL;

  INSERT INTO public.notifications (user_id, type, payload)
  SELECT cm.user_id, 'dm',
         jsonb_build_object('conversation_id', new.conversation_id, 'sender_id', new.sender_id)
  FROM public.conversation_members cm
  WHERE cm.conversation_id = new.conversation_id
    AND cm.user_id <> new.sender_id;
  RETURN new;
END;
$$;
