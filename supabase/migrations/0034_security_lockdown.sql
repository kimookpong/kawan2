-- ============================================================
-- Kawan2 — Security lockdown phase 1 (REVOKE PUBLIC default grants)
-- 0034_security_lockdown.sql
-- หมายเหตุ: explicit grants ยังคงอยู่ — ต้องใช้ 0035 เพื่อ revoke จาก
-- authenticated/anon ที่ explicit
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.notify_like()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_listing_comment()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_reply()             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_mentions()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_message_insert()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sellers_lock_status()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_listing_fav_count() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.approve_seller(uuid)                         FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.approve_seller(uuid)                         TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_seller(uuid, text)                    FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.reject_seller(uuid, text)                    TO authenticated;
REVOKE EXECUTE ON FUNCTION public.ban_user(uuid, integer, text)                FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ban_user(uuid, integer, text)                TO authenticated;
REVOKE EXECUTE ON FUNCTION public.unban_user(uuid)                             FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.unban_user(uuid)                             TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_disabled(uuid, boolean)             FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.set_user_disabled(uuid, boolean)             TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text)                    FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.set_user_role(uuid, text)                    TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_points(uuid, integer, text)     FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_adjust_points(uuid, integer, text)     TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reset_user_names(uuid)                 FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_reset_user_names(uuid)                 TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_level(smallint, text, text, integer, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_level(smallint, text, text, integer, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_thread_pin(bigint, boolean)              FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.set_thread_pin(bigint, boolean)              TO authenticated;
REVOKE EXECUTE ON FUNCTION public.resolve_report(bigint, boolean)              FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_report(bigint, boolean)              TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_report(text, bigint, text)            FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_report(text, bigint, text)            TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_guild(text, text, text)               FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_guild(text, text, text)               TO authenticated;
REVOKE EXECUTE ON FUNCTION public.join_guild(bigint)                           FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.join_guild(bigint)                           TO authenticated;
REVOKE EXECUTE ON FUNCTION public.leave_guild()                                FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.leave_guild()                                TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rename_guild(bigint, text)                   FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.rename_guild(bigint, text)                   TO authenticated;
REVOKE EXECUTE ON FUNCTION public.start_conversation(uuid, bigint)             FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_conversation(uuid, bigint)             TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid)   FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin(uuid)   TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_editor(uuid)  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_editor(uuid)  TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid)   FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_staff(uuid)   TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_blocked(uuid) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_approved_seller(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_approved_seller(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_conversation_member(bigint) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_view(bigint)         FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_view(bigint)         TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.increment_listing_view(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_listing_view(bigint) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.weekly_top_members_data() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.weekly_top_members_data() TO authenticated, anon;
