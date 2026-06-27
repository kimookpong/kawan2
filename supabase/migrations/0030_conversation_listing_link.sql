-- ============================================================
-- Kawan2 — เชื่อมห้องสนทนากับประกาศ marketplace
-- 0030_conversation_listing_link.sql
-- ============================================================

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS listing_id bigint
  REFERENCES public.marketplace_listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_listing_idx ON public.conversations(listing_id);

-- ขยาย start_conversation รับ listing optional
DROP FUNCTION IF EXISTS public.start_conversation(uuid);

CREATE OR REPLACE FUNCTION public.start_conversation(other_user uuid, p_listing bigint DEFAULT NULL)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  conv_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF other_user = me THEN RAISE EXCEPTION 'cannot DM yourself'; END IF;

  SELECT cm1.conversation_id INTO conv_id
  FROM public.conversation_members cm1
  JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
  WHERE cm1.user_id = me AND cm2.user_id = other_user
  GROUP BY cm1.conversation_id
  HAVING count(*) = 2
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    IF p_listing IS NOT NULL THEN
      UPDATE public.conversations SET listing_id = p_listing WHERE id = conv_id;
    END IF;
    RETURN conv_id;
  END IF;

  INSERT INTO public.conversations (listing_id) VALUES (p_listing) RETURNING id INTO conv_id;
  INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (conv_id, me), (conv_id, other_user);
  RETURN conv_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.start_conversation(uuid, bigint) TO authenticated;
