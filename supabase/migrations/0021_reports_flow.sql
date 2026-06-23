-- ============================================================
-- Kawan2 — ระบบรายงานเนื้อหา + แจ้งเตือนแอดมิน
-- 0021_reports_flow.sql
-- ============================================================

-- ผู้ใช้ที่ล็อกอินส่งรายงาน → บันทึก report + แจ้งเตือนแอดมินทุกคน
create or replace function public.submit_report(
  p_target_type text,
  p_target_id   bigint,
  p_reason      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_report_id bigint;
begin
  if v_uid is null then
    raise exception 'ต้องเข้าสู่ระบบก่อนรายงาน';
  end if;
  if p_target_type not in ('thread','post','news','news_comment') then
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
$$;

-- แอดมินตัดสินรายงาน: p_delete = true → ลบเนื้อหาถาวร, false → ยกเลิก (dismiss)
create or replace function public.resolve_report(p_report bigint, p_delete boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_type text;
  v_target bigint;
begin
  if not is_admin(v_uid) then
    raise exception 'เฉพาะแอดมินเท่านั้น';
  end if;

  select target_type, target_id into v_type, v_target
  from public.reports where id = p_report;
  if not found then
    raise exception 'ไม่พบรายงาน';
  end if;

  if p_delete then
    if    v_type = 'thread'       then delete from public.threads       where id = v_target;
    elsif v_type = 'post'         then delete from public.posts         where id = v_target;
    elsif v_type = 'news'         then delete from public.news          where id = v_target;
    elsif v_type = 'news_comment' then delete from public.news_comments where id = v_target;
    end if;
  end if;

  update public.reports
  set status = case when p_delete then 'actioned' else 'dismissed' end
  where id = p_report;
end;
$$;

revoke execute on function public.submit_report(text, bigint, text) from public, anon;
revoke execute on function public.resolve_report(bigint, boolean) from public, anon;
grant execute on function public.submit_report(text, bigint, text) to authenticated;
grant execute on function public.resolve_report(bigint, boolean) to authenticated;
