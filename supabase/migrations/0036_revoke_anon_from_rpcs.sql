-- ============================================================
-- Kawan2 — Security lockdown phase 3: revoke explicit anon grants
-- 0036_revoke_anon_from_rpcs.sql
-- ตอน CREATE OR REPLACE FUNCTION ฝั่ง Supabase grant anon ให้ default
-- ทำให้ฟังก์ชันที่ admin/auth-required ยังเรียกจาก anon ได้
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.approve_seller(uuid)                FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_seller(uuid, text)           FROM anon;
REVOKE EXECUTE ON FUNCTION public.start_conversation(uuid, bigint)    FROM anon;
REVOKE EXECUTE ON FUNCTION public.ban_user(uuid, integer, text)       FROM anon;
REVOKE EXECUTE ON FUNCTION public.unban_user(uuid)                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_disabled(uuid, boolean)    FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text)           FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_points(uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_reset_user_names(uuid)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_level(smallint, text, text, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_thread_pin(bigint, boolean)     FROM anon;
REVOKE EXECUTE ON FUNCTION public.resolve_report(bigint, boolean)     FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_report(text, bigint, text)   FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_guild(text, text, text)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_guild(bigint)                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.leave_guild()                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.rename_guild(bigint, text)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_approved_seller(uuid)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(bigint)      FROM anon;
