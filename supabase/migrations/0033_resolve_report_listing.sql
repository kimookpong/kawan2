-- ============================================================
-- Kawan2 — resolve_report รองรับ listing / listing_comment
-- 0033_resolve_report_listing.sql
-- ใช้ soft delete (status='deleted') เพื่อรักษา favorites/comments/DM context
-- ============================================================

CREATE OR REPLACE FUNCTION public.resolve_report(p_report bigint, p_delete boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    if    v_type = 'thread'           then delete from public.threads               where id = v_target;
    elsif v_type = 'post'             then delete from public.posts                 where id = v_target;
    elsif v_type = 'news'             then delete from public.news                  where id = v_target;
    elsif v_type = 'news_comment'     then delete from public.news_comments         where id = v_target;
    elsif v_type = 'listing'          then update public.marketplace_listings set status = 'deleted', updated_at = now() where id = v_target;
    elsif v_type = 'listing_comment'  then update public.listing_comments set status = 'deleted', updated_at = now() where id = v_target;
    end if;
  end if;

  update public.reports
  set status = case when p_delete then 'actioned' else 'dismissed' end
  where id = p_report;
end;
$function$;
