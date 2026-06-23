-- ============================================================
-- Kawan2 — แก้ให้ revoke ได้ผลจริง
-- ฟังก์ชันมี grant EXECUTE ให้ PUBLIC โดยปริยาย ทำให้ revoke เฉพาะ anon ไม่มีผล
-- จึง revoke จาก PUBLIC แล้ว grant กลับเฉพาะ authenticated
-- 0020_security_lints_revoke_public.sql
-- ============================================================

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.admin_adjust_points(uuid, integer, text)',
    'public.admin_reset_user_names(uuid)',
    'public.ban_user(uuid, integer, text)',
    'public.unban_user(uuid)',
    'public.set_user_disabled(uuid, boolean)',
    'public.set_user_role(uuid, text)',
    'public.update_level(smallint, text, text, integer)',
    'public.create_guild(text, text, text)',
    'public.join_guild(bigint)',
    'public.leave_guild()',
    'public.rename_guild(bigint, text)',
    'public.set_thread_pin(bigint, boolean)',
    'public.start_conversation(uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
