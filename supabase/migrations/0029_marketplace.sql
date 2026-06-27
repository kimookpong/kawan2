-- ============================================================
-- Kawan2 — Marketplace foundation (ตลาดซื้อขาย)
-- 0029_marketplace.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id serial PRIMARY KEY,
  name_th text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true
);

INSERT INTO public.marketplace_categories (name_th, slug, icon, sort_order) VALUES
  ('มือถือ/แท็บเล็ต', 'mobile', 'smartphone', 10),
  ('รถ/มอเตอร์ไซค์', 'vehicle', 'car', 20),
  ('อสังหาริมทรัพย์', 'real-estate', 'home', 30),
  ('เสื้อผ้า/แฟชั่น', 'fashion', 'shirt', 40),
  ('เครื่องใช้ไฟฟ้า', 'appliance', 'plug', 50),
  ('อาหาร/ของกิน', 'food', 'utensils', 60),
  ('บริการ', 'service', 'briefcase', 70),
  ('อื่นๆ', 'other', 'package', 80)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_name text NOT NULL CHECK (char_length(shop_name) BETWEEN 3 AND 60),
  description text,
  contact_phone text NOT NULL,
  contact_line text,
  contact_facebook text,
  province_id int REFERENCES public.provinces(id),
  address text,
  logo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason text,
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sellers_status_idx ON public.sellers(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id bigserial PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id int NOT NULL REFERENCES public.marketplace_categories(id),
  province_id int REFERENCES public.provinces(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  description text NOT NULL DEFAULT '',
  price numeric(12,2),
  price_type text NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed','negotiable','contact')),
  condition text NOT NULL DEFAULT 'used' CHECK (condition IN ('new','like_new','used')),
  cover_url text,
  image_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','sold','hidden','deleted')),
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  view_count int NOT NULL DEFAULT 0,
  favorite_count int NOT NULL DEFAULT 0,
  contact_phone_override text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_category_idx ON public.marketplace_listings(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_seller_idx ON public.marketplace_listings(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_status_idx ON public.marketplace_listings(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id bigint NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS favorites_listing_idx ON public.marketplace_favorites(listing_id);

CREATE OR REPLACE FUNCTION public.is_approved_seller(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.sellers WHERE id = uid AND status = 'approved');
$$;
REVOKE EXECUTE ON FUNCTION public.is_approved_seller(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_approved_seller(uuid) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.increment_listing_view(p_listing bigint)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.marketplace_listings SET view_count = view_count + 1 WHERE id = p_listing;
$$;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(bigint) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sellers_lock_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    new.status := 'pending';
    new.rejection_reason := NULL;
    new.approved_by := NULL;
    new.approved_at := NULL;
  ELSIF (TG_OP = 'UPDATE') AND NOT public.is_staff(auth.uid()) THEN
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
  END IF;
  new.updated_at := now();
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS sellers_lock_status_trg ON public.sellers;
CREATE TRIGGER sellers_lock_status_trg
  BEFORE INSERT OR UPDATE ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.sellers_lock_status();

CREATE OR REPLACE FUNCTION public.update_listing_fav_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.marketplace_listings SET favorite_count = favorite_count + 1 WHERE id = new.listing_id;
    RETURN new;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.marketplace_listings SET favorite_count = GREATEST(0, favorite_count - 1) WHERE id = old.listing_id;
    RETURN old;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS fav_count_trg ON public.marketplace_favorites;
CREATE TRIGGER fav_count_trg
  AFTER INSERT OR DELETE ON public.marketplace_favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_fav_count();

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mc_read" ON public.marketplace_categories FOR SELECT USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "mc_write" ON public.marketplace_categories FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "sellers_select" ON public.sellers
  FOR SELECT USING (status = 'approved' OR id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "sellers_insert" ON public.sellers
  FOR INSERT WITH CHECK (auth.uid() = id AND NOT public.is_blocked(auth.uid()));
CREATE POLICY "sellers_update" ON public.sellers
  FOR UPDATE USING (auth.uid() = id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_staff(auth.uid()));

CREATE POLICY "listings_select" ON public.marketplace_listings
  FOR SELECT USING (
    status IN ('available','reserved','sold')
    OR seller_id = auth.uid()
    OR public.is_staff(auth.uid())
  );
CREATE POLICY "listings_insert" ON public.marketplace_listings
  FOR INSERT WITH CHECK (
    auth.uid() = seller_id
    AND public.is_approved_seller(auth.uid())
    AND NOT public.is_blocked(auth.uid())
  );
CREATE POLICY "listings_update" ON public.marketplace_listings
  FOR UPDATE USING (auth.uid() = seller_id OR public.is_staff(auth.uid()));
CREATE POLICY "listings_delete" ON public.marketplace_listings
  FOR DELETE USING (auth.uid() = seller_id OR public.is_staff(auth.uid()));

CREATE POLICY "fav_select" ON public.marketplace_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fav_insert" ON public.marketplace_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fav_delete" ON public.marketplace_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.approve_seller(target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.sellers SET status='approved', approved_by=auth.uid(), approved_at=now(), rejection_reason=NULL WHERE id=target;
  INSERT INTO public.notifications(user_id, type, payload)
    VALUES (target, 'seller_approved', jsonb_build_object('by', auth.uid()));
END; $$;

CREATE OR REPLACE FUNCTION public.reject_seller(target uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.sellers SET status='rejected', rejection_reason=p_reason, approved_by=auth.uid(), approved_at=now() WHERE id=target;
  INSERT INTO public.notifications(user_id, type, payload)
    VALUES (target, 'seller_rejected', jsonb_build_object('by', auth.uid(), 'reason', p_reason));
END; $$;

GRANT EXECUTE ON FUNCTION public.approve_seller(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_seller(uuid, text) TO authenticated;
