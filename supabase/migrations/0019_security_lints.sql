-- ============================================================
-- Kawan2 — แก้คำเตือน Security Linter (storage listing + SECURITY DEFINER RPC)
-- 0019_security_lints.sql
-- ============================================================

-- 1) Storage: ลบ broad SELECT policy ของ public bucket
--    บัคเก็ตเป็น public อยู่แล้ว → เข้าถึงไฟล์ผ่าน public URL ได้ตามปกติ
--    แต่จะไม่สามารถ "list" รายชื่อไฟล์ทั้งหมดผ่าน API ได้อีก
drop policy if exists avatars_read on storage.objects;
drop policy if exists news_covers_read on storage.objects;
drop policy if exists thread_images_read on storage.objects;

-- 2) Trigger functions: ไม่ควรถูกเรียกผ่าน REST RPC
--    revoke EXECUTE ทุก role ภายนอก — trigger ยังทำงานปกติ (รันในบริบทเจ้าของตาราง)
revoke execute on function
  public.apply_point_transaction(),
  public.bump_guild_count(),
  public.bump_reply_count(),
  public.enforce_name_cooldown(),
  public.handle_new_user(),
  public.notify_mentions(),
  public.on_message_insert(),
  public.on_news_comment_insert(),
  public.on_reaction_change(),
  public.on_thread_insert()
from public, anon, authenticated;

-- 3) ฟังก์ชันภายใน (ไม่ถูกเรียกจาก client) — ปิดไม่ให้เรียกจากภายนอก
--    ถูกเรียกโดยฟังก์ชัน SECURITY DEFINER อื่น/trigger ซึ่งรันในบริบทเจ้าของ จึงไม่กระทบ
revoke execute on function
  public.award_points(uuid, integer, text, text, bigint),
  public.recalc_all_levels()
from public, anon, authenticated;

-- 4) RPC เฉพาะแอดมิน (เรียกจาก server action ในฐานะ authenticated + ตรวจ is_admin ภายใน)
--    revoke anon — ไม่จำเป็นต้องเรียกโดยไม่ล็อกอิน
revoke execute on function
  public.admin_adjust_points(uuid, integer, text),
  public.admin_reset_user_names(uuid),
  public.ban_user(uuid, integer, text),
  public.unban_user(uuid),
  public.set_user_disabled(uuid, boolean),
  public.set_user_role(uuid, text),
  public.update_level(smallint, text, text, integer)
from anon;

-- 5) RPC ที่ต้องล็อกอินก่อนใช้ — revoke anon
revoke execute on function
  public.create_guild(text, text, text),
  public.join_guild(bigint),
  public.leave_guild(),
  public.rename_guild(bigint, text),
  public.set_thread_pin(bigint, boolean),
  public.start_conversation(uuid)
from anon;

-- ============================================================
-- หมายเหตุ (คำเตือนที่ "คงเหลือโดยตั้งใจ" — ห้าม revoke):
--   * is_admin / is_staff / is_editor / is_blocked
--       ถูกเรียกภายใน RLS policy โดย role ผู้ใช้ → ต้องคง EXECUTE ไว้
--   * weekly_top_members_data
--       ถูกเรียกผ่าน view weekly_top_members (security_invoker) โดย anon/authenticated
--   * increment_view
--       ตั้งใจให้ผู้เข้าชม (รวม anon) เพิ่มยอดวิวได้
--   วิธีปิดคำเตือนกลุ่มนี้ให้สมบูรณ์ = ย้ายฟังก์ชันไป schema ที่ไม่ถูก expose (เช่น private)
--   แล้วแก้ทุก reference ใน policy/view — เป็นงาน refactor แยกต่างหาก
--
-- Leaked Password Protection: เปิดได้ที่ Dashboard → Authentication → Policies
--   (เป็นการตั้งค่า Auth ไม่ใช่ migration SQL)
-- ============================================================
