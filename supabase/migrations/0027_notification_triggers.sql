-- ============================================================
-- Kawan2 — เพิ่มการแจ้งเตือนสำหรับ reply / like / disable
-- 0027_notification_triggers.sql
-- ============================================================

-- ---------- Reply: ตอบกระทู้/ความเห็น ----------
CREATE OR REPLACE FUNCTION public.notify_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_user uuid;
  notif_type  text;
  target_uname text;
BEGIN
  IF new.parent_id IS NULL THEN
    SELECT author_id INTO target_user FROM public.threads WHERE id = new.thread_id;
    notif_type := 'reply_thread';
  ELSE
    SELECT author_id INTO target_user FROM public.posts WHERE id = new.parent_id;
    notif_type := 'reply_post';
  END IF;

  IF target_user IS NULL OR target_user = new.author_id THEN RETURN new; END IF;

  -- กันซ้ำกับ mention: ถ้า body มี @<target_username> ให้ skip
  SELECT username INTO target_uname FROM public.profiles WHERE id = target_user;
  IF target_uname IS NOT NULL
     AND new.body ~ ('@' || target_uname || '(\M|[^A-Za-z0-9_])') THEN
    RETURN new;
  END IF;

  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (target_user, notif_type, jsonb_build_object(
    'by',        new.author_id,
    'thread_id', new.thread_id,
    'post_id',   new.id,
    'parent_id', new.parent_id
  ));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_post_notify_reply ON public.posts;
CREATE TRIGGER on_post_notify_reply
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_reply();

-- ---------- Like: thread / post (throttle 1 ชม.) ----------
CREATE OR REPLACE FUNCTION public.notify_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_author uuid;
  thr_id        bigint;
  recent_exists boolean;
BEGIN
  IF new.type <> 'like' THEN RETURN new; END IF;

  IF new.target_type = 'thread' THEN
    SELECT author_id INTO target_author FROM public.threads WHERE id = new.target_id;
    thr_id := new.target_id;
  ELSIF new.target_type = 'post' THEN
    SELECT author_id, thread_id INTO target_author, thr_id
    FROM public.posts WHERE id = new.target_id;
  ELSE
    RETURN new;
  END IF;

  IF target_author IS NULL OR target_author = new.user_id THEN RETURN new; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = target_author
      AND n.type = 'like'
      AND n.created_at > now() - interval '1 hour'
      AND n.payload->>'by' = new.user_id::text
      AND n.payload->>'target_type' = new.target_type
      AND (n.payload->>'target_id')::bigint = new.target_id
  ) INTO recent_exists;
  IF recent_exists THEN RETURN new; END IF;

  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (target_author, 'like', jsonb_build_object(
    'by',          new.user_id,
    'target_type', new.target_type,
    'target_id',   new.target_id,
    'thread_id',   thr_id
  ));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_reaction_notify ON public.reactions;
CREATE TRIGGER on_reaction_notify
  AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_like();

-- ---------- Block (disable) — ส่ง notification เมื่อ admin disable/enable ----------
CREATE OR REPLACE FUNCTION public.set_user_disabled(target uuid, p_disabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  IF p_disabled AND (SELECT role FROM public.profiles WHERE id = target) = 'admin' THEN
    RAISE EXCEPTION 'cannot disable admin';
  END IF;
  UPDATE public.profiles SET disabled = p_disabled WHERE id = target;
  INSERT INTO public.member_sanctions(user_id, type, by_user)
    VALUES (target, CASE WHEN p_disabled THEN 'disable' ELSE 'enable' END, auth.uid());
  INSERT INTO public.notifications(user_id, type, payload)
    VALUES (target,
            CASE WHEN p_disabled THEN 'disable' ELSE 'enable' END,
            jsonb_build_object('by', auth.uid()));
END; $$;
