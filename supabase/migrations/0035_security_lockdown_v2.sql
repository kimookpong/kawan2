-- ============================================================
-- Kawan2 — Security lockdown phase 2
-- 0035_security_lockdown_v2.sql
-- - REVOKE explicit grants ของ trigger functions จาก authenticated/anon
-- - แปลง helper predicates ที่ตารางอ่านสาธารณะอยู่แล้วเป็น SECURITY INVOKER
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.notify_like()              FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_listing_comment()   FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_reply()             FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_mentions()          FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.on_message_insert()        FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.sellers_lock_status()      FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.update_listing_fav_count() FROM authenticated, anon;

ALTER FUNCTION public.is_admin(uuid)            SECURITY INVOKER;
ALTER FUNCTION public.is_editor(uuid)           SECURITY INVOKER;
ALTER FUNCTION public.is_staff(uuid)            SECURITY INVOKER;
ALTER FUNCTION public.is_blocked(uuid)          SECURITY INVOKER;
ALTER FUNCTION public.is_approved_seller(uuid)  SECURITY INVOKER;
