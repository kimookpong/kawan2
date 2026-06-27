-- ============================================================
-- Kawan2 — ขยาย submit_report รองรับ target_type 'listing' และ 'listing_comment'
-- 0032_submit_report_listing.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_report(p_target_type text, p_target_id bigint, p_reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_report_id bigint;
begin
  if v_uid is null then
    raise exception 'ต้องเข้าสู่ระบบก่อนรายงาน';
  end if;
  if p_target_type not in ('thread','post','news','news_comment','listing','listing_comment') then
    raise exception 'ประเภทเนื้อหาไม่ถูกต้อง';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason, status)
  values (v_uid, p_target_type, p_target_id, nullif(btrim(coalesce(p_reason,'')), ''), 'pending')
  returning id into v_report_id;

  insert into public.notifications (user_id, type, payload)
  select p.id, 'report',
    jsonb_build_object(
      'report_id', v_report_id,
      'target_type', p_target_type,
      'target_id', p_target_id,
      'reason', p_reason
    )
  from public.profiles p
  where p.role = 'admin';
end;
$function$;
