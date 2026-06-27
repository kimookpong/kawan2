-- ============================================================
-- Kawan2 — ความเห็นในประกาศ marketplace
-- 0031_listing_comments.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listing_comments (
  id bigserial PRIMARY KEY,
  listing_id bigint NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lc_listing_idx ON public.listing_comments(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lc_author_idx ON public.listing_comments(author_id);

ALTER TABLE public.listing_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lc_select" ON public.listing_comments
  FOR SELECT USING (
    status = 'published' OR author_id = auth.uid() OR public.is_staff(auth.uid())
  );
CREATE POLICY "lc_insert" ON public.listing_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND NOT public.is_blocked(auth.uid())
  );
CREATE POLICY "lc_update" ON public.listing_comments
  FOR UPDATE USING (auth.uid() = author_id OR public.is_staff(auth.uid()));
CREATE POLICY "lc_delete" ON public.listing_comments
  FOR DELETE USING (auth.uid() = author_id OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_listing_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  owner_id uuid;
  owner_uname text;
BEGIN
  SELECT seller_id INTO owner_id FROM public.marketplace_listings WHERE id = new.listing_id;
  IF owner_id IS NULL OR owner_id = new.author_id THEN RETURN new; END IF;
  SELECT username INTO owner_uname FROM public.profiles WHERE id = owner_id;
  IF owner_uname IS NOT NULL
     AND new.body ~ ('@' || owner_uname || '(\M|[^A-Za-z0-9_])') THEN
    RETURN new;
  END IF;
  INSERT INTO public.notifications (user_id, type, payload)
    VALUES (owner_id, 'comment_listing', jsonb_build_object(
      'by', new.author_id,
      'listing_id', new.listing_id,
      'comment_id', new.id
    ));
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_listing_comment ON public.listing_comments;
CREATE TRIGGER on_listing_comment
  AFTER INSERT ON public.listing_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_listing_comment();

CREATE OR REPLACE FUNCTION public.notify_mentions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m text[];
  uname text;
  uid uuid;
  seen text[] := '{}';
  payload jsonb;
BEGIN
  FOR m IN SELECT regexp_matches(new.body, '@([A-Za-z0-9_]{3,30})', 'g') LOOP
    uname := m[1];
    IF uname = ANY(seen) THEN CONTINUE; END IF;
    seen := array_append(seen, uname);

    SELECT id INTO uid FROM public.profiles WHERE username = uname;
    IF uid IS NULL OR uid = new.author_id THEN CONTINUE; END IF;

    IF TG_TABLE_NAME = 'posts' THEN
      payload := jsonb_build_object('by', new.author_id, 'thread_id', new.thread_id, 'ref', 'thread');
    ELSIF TG_TABLE_NAME = 'news_comments' THEN
      payload := jsonb_build_object('by', new.author_id, 'news_id', new.news_id, 'ref', 'news');
    ELSIF TG_TABLE_NAME = 'listing_comments' THEN
      payload := jsonb_build_object('by', new.author_id, 'listing_id', new.listing_id, 'ref', 'listing');
    ELSE
      payload := jsonb_build_object('by', new.author_id);
    END IF;

    INSERT INTO public.notifications (user_id, type, payload) VALUES (uid, 'mention', payload);
  END LOOP;
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_listing_comment_mention ON public.listing_comments;
CREATE TRIGGER on_listing_comment_mention
  AFTER INSERT ON public.listing_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();
