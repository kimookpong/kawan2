-- ============================================================
-- Kawan2 — ย้ายฟังก์ชัน RPC ที่ถูก advisor flag ไป schema private
-- 0038_move_rpcs_to_private.sql
-- public.X กลายเป็น SECURITY INVOKER wrapper ที่เรียกเข้า private.X
-- (private DEFINER ทำงานจริง / public INVOKER เป็น stub ที่ advisor ไม่ flag)
-- ============================================================

-- ---------- Admin / staff RPCs ----------
CREATE OR REPLACE FUNCTION private.admin_adjust_points(target uuid, amount integer, reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  insert into public.point_transactions(user_id, amount, reason, ref_type)
    values (target, amount, coalesce(reason,'admin_adjust'), 'admin');
  insert into public.member_sanctions(user_id, type, value, reason, by_user)
    values (target,'points',amount,reason,auth.uid());
end; $$;
REVOKE EXECUTE ON FUNCTION private.admin_adjust_points(uuid,integer,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.admin_adjust_points(uuid,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_points(target uuid, amount integer, reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.admin_adjust_points(target, amount, reason); end; $$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_points(uuid,integer,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_adjust_points(uuid,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.admin_reset_user_names(target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  update public.profiles set username_changed_at = null, display_name_changed_at = null where id = target;
end; $$;
REVOKE EXECUTE ON FUNCTION private.admin_reset_user_names(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.admin_reset_user_names(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_user_names(target uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.admin_reset_user_names(target); end; $$;
REVOKE EXECUTE ON FUNCTION public.admin_reset_user_names(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_reset_user_names(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.approve_seller(target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.sellers SET status='approved', approved_by=auth.uid(), approved_at=now(), rejection_reason=NULL WHERE id=target;
  INSERT INTO public.notifications(user_id, type, payload)
    VALUES (target, 'seller_approved', jsonb_build_object('by', auth.uid()));
END; $$;
REVOKE EXECUTE ON FUNCTION private.approve_seller(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.approve_seller(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_seller(target uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.approve_seller(target); end; $$;
REVOKE EXECUTE ON FUNCTION public.approve_seller(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.approve_seller(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.reject_seller(target uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.sellers SET status='rejected', rejection_reason=p_reason, approved_by=auth.uid(), approved_at=now() WHERE id=target;
  INSERT INTO public.notifications(user_id, type, payload)
    VALUES (target, 'seller_rejected', jsonb_build_object('by', auth.uid(), 'reason', p_reason));
END; $$;
REVOKE EXECUTE ON FUNCTION private.reject_seller(uuid,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.reject_seller(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_seller(target uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.reject_seller(target, p_reason); end; $$;
REVOKE EXECUTE ON FUNCTION public.reject_seller(uuid,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reject_seller(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.ban_user(target uuid, days integer, reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare until timestamptz;
begin
  if not public.is_staff(auth.uid()) then raise exception 'forbidden'; end if;
  if days not in (1,3,7,30) then raise exception 'invalid duration'; end if;
  if (select role from public.profiles where id = target) = 'admin' then raise exception 'cannot ban admin'; end if;
  until := now() + (days || ' days')::interval;
  update public.profiles set banned_until = until, ban_reason = reason where id = target;
  insert into public.member_sanctions(user_id, type, value, reason, by_user) values (target,'ban',days,reason,auth.uid());
  insert into public.notifications(user_id, type, payload)
    values (target,'ban', jsonb_build_object('days',days,'until',until,'reason',reason));
end; $$;
REVOKE EXECUTE ON FUNCTION private.ban_user(uuid,integer,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.ban_user(uuid,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.ban_user(target uuid, days integer, reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.ban_user(target, days, reason); end; $$;
REVOKE EXECUTE ON FUNCTION public.ban_user(uuid,integer,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.ban_user(uuid,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.unban_user(target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'forbidden'; end if;
  update public.profiles set banned_until = null, ban_reason = null where id = target;
  insert into public.member_sanctions(user_id, type, by_user) values (target,'unban',auth.uid());
end; $$;
REVOKE EXECUTE ON FUNCTION private.unban_user(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.unban_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.unban_user(target uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.unban_user(target); end; $$;
REVOKE EXECUTE ON FUNCTION public.unban_user(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.unban_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.set_user_disabled(target uuid, p_disabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  IF p_disabled AND (SELECT role FROM public.profiles WHERE id = target) = 'admin' THEN
    RAISE EXCEPTION 'cannot disable admin';
  END IF;
  UPDATE public.profiles SET disabled = p_disabled WHERE id = target;
  INSERT INTO public.member_sanctions(user_id, type, by_user)
    VALUES (target, CASE WHEN p_disabled THEN 'disable' ELSE 'enable' END, auth.uid());
  INSERT INTO public.notifications(user_id, type, payload)
    VALUES (target, CASE WHEN p_disabled THEN 'disable' ELSE 'enable' END, jsonb_build_object('by', auth.uid()));
END; $$;
REVOKE EXECUTE ON FUNCTION private.set_user_disabled(uuid,boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.set_user_disabled(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_disabled(target uuid, p_disabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.set_user_disabled(target, p_disabled); end; $$;
REVOKE EXECUTE ON FUNCTION public.set_user_disabled(uuid,boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_user_disabled(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION private.set_user_role(target uuid, new_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: เฉพาะ admin เท่านั้น'; end if;
  if new_role not in ('member','editor','admin') then raise exception 'invalid role'; end if;
  if target = auth.uid() then raise exception 'cannot change your own role'; end if;
  update public.profiles set role = new_role, updated_at = now() where id = target;
end; $$;
REVOKE EXECUTE ON FUNCTION private.set_user_role(uuid,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.set_user_role(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_role(target uuid, new_role text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.set_user_role(target, new_role); end; $$;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_user_role(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.update_level(p_id smallint, p_name_th text, p_name_en text, p_min_points integer, p_color text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  if p_min_points < 0 then raise exception 'min_points must be >= 0'; end if;
  update public.membership_levels
    set name_th = p_name_th, name_en = p_name_en, min_points = p_min_points,
        color = coalesce(nullif(btrim(coalesce(p_color,'')), ''), color)
    where id = p_id;
  perform public.recalc_all_levels();
end; $$;
REVOKE EXECUTE ON FUNCTION private.update_level(smallint,text,text,integer,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.update_level(smallint,text,text,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_level(p_id smallint, p_name_th text, p_name_en text, p_min_points integer, p_color text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.update_level(p_id, p_name_th, p_name_en, p_min_points, p_color); end; $$;
REVOKE EXECUTE ON FUNCTION public.update_level(smallint,text,text,integer,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_level(smallint,text,text,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.set_thread_pin(p_thread bigint, p_pinned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  update public.threads set is_pinned = p_pinned, updated_at = now() where id = p_thread;
end; $$;
REVOKE EXECUTE ON FUNCTION private.set_thread_pin(bigint,boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.set_thread_pin(bigint,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_thread_pin(p_thread bigint, p_pinned boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.set_thread_pin(p_thread, p_pinned); end; $$;
REVOKE EXECUTE ON FUNCTION public.set_thread_pin(bigint,boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_thread_pin(bigint,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION private.resolve_report(p_report bigint, p_delete boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare v_uid uuid := auth.uid(); v_type text; v_target bigint;
begin
  if not public.is_admin(v_uid) then raise exception 'เฉพาะแอดมินเท่านั้น'; end if;
  select target_type, target_id into v_type, v_target from public.reports where id = p_report;
  if not found then raise exception 'ไม่พบรายงาน'; end if;
  if p_delete then
    if    v_type = 'thread'          then delete from public.threads               where id = v_target;
    elsif v_type = 'post'            then delete from public.posts                 where id = v_target;
    elsif v_type = 'news'            then delete from public.news                  where id = v_target;
    elsif v_type = 'news_comment'    then delete from public.news_comments         where id = v_target;
    elsif v_type = 'listing'         then update public.marketplace_listings set status='deleted', updated_at=now() where id = v_target;
    elsif v_type = 'listing_comment' then update public.listing_comments set status='deleted', updated_at=now() where id = v_target;
    end if;
  end if;
  update public.reports set status = case when p_delete then 'actioned' else 'dismissed' end where id = p_report;
end; $$;
REVOKE EXECUTE ON FUNCTION private.resolve_report(bigint,boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.resolve_report(bigint,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_report(p_report bigint, p_delete boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.resolve_report(p_report, p_delete); end; $$;
REVOKE EXECUTE ON FUNCTION public.resolve_report(bigint,boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.resolve_report(bigint,boolean) TO authenticated;

-- ---------- Member RPCs ----------
CREATE OR REPLACE FUNCTION private.submit_report(p_target_type text, p_target_id bigint, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare v_uid uuid := auth.uid(); v_report_id bigint;
begin
  if v_uid is null then raise exception 'ต้องเข้าสู่ระบบก่อนรายงาน'; end if;
  if p_target_type not in ('thread','post','news','news_comment','listing','listing_comment') then
    raise exception 'ประเภทเนื้อหาไม่ถูกต้อง';
  end if;
  insert into public.reports (reporter_id, target_type, target_id, reason, status)
  values (v_uid, p_target_type, p_target_id, nullif(btrim(coalesce(p_reason,'')), ''), 'pending')
  returning id into v_report_id;
  insert into public.notifications (user_id, type, payload)
  select p.id, 'report',
    jsonb_build_object('report_id', v_report_id, 'target_type', p_target_type, 'target_id', p_target_id, 'reason', p_reason)
  from public.profiles p where p.role = 'admin';
end; $$;
REVOKE EXECUTE ON FUNCTION private.submit_report(text,bigint,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.submit_report(text,bigint,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_report(p_target_type text, p_target_id bigint, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.submit_report(p_target_type, p_target_id, p_reason); end; $$;
REVOKE EXECUTE ON FUNCTION public.submit_report(text,bigint,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.submit_report(text,bigint,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.start_conversation(other_user uuid, p_listing bigint DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); conv_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF other_user = me THEN RAISE EXCEPTION 'cannot DM yourself'; END IF;
  SELECT cm1.conversation_id INTO conv_id
  FROM public.conversation_members cm1
  JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
  WHERE cm1.user_id = me AND cm2.user_id = other_user
  GROUP BY cm1.conversation_id HAVING count(*) = 2 LIMIT 1;
  IF conv_id IS NOT NULL THEN
    IF p_listing IS NOT NULL THEN UPDATE public.conversations SET listing_id = p_listing WHERE id = conv_id; END IF;
    RETURN conv_id;
  END IF;
  INSERT INTO public.conversations (listing_id) VALUES (p_listing) RETURNING id INTO conv_id;
  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES (conv_id, me), (conv_id, other_user);
  RETURN conv_id;
END; $$;
REVOKE EXECUTE ON FUNCTION private.start_conversation(uuid,bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.start_conversation(uuid,bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_conversation(other_user uuid, p_listing bigint DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
declare r bigint; begin r := private.start_conversation(other_user, p_listing); return r; end; $$;
REVOKE EXECUTE ON FUNCTION public.start_conversation(uuid,bigint) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.start_conversation(uuid,bigint) TO authenticated;

CREATE OR REPLACE FUNCTION private.create_guild(p_name text, p_description text DEFAULT NULL, p_emblem text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare me uuid := auth.uid(); is_adm boolean; tier text; owned int; new_slug text; gid bigint;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select public.is_admin(me) into is_adm;
  select membership_tier into tier from public.profiles where id = me;
  if not is_adm then
    if coalesce(tier,'free') = 'free' then raise exception 'ต้องเป็นสมาชิกผู้สนับสนุน (subscribe) จึงจะสร้างกิลด์ได้'; end if;
    select count(*) into owned from public.guilds where owner_id = me and not is_official;
    if owned >= 1 then raise exception 'สร้างกิลด์ได้ 1 กิลด์ต่อบัญชี'; end if;
  end if;
  new_slug := lower(regexp_replace(coalesce(p_name,''), '[^a-z0-9]+', '-', 'g'));
  new_slug := trim(both '-' from new_slug);
  if new_slug = '' then new_slug := 'guild'; end if;
  new_slug := new_slug || '-' || substr(md5(random()::text),1,5);
  insert into public.guilds(name, slug, description, emblem_url, owner_id, is_official)
    values (p_name, new_slug, p_description, p_emblem, me, is_adm) returning id into gid;
  insert into public.guild_members(guild_id, user_id, role) values (gid, me, 'leader') on conflict (user_id) do nothing;
  return gid;
end; $$;
REVOKE EXECUTE ON FUNCTION private.create_guild(text,text,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.create_guild(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_guild(p_name text, p_description text DEFAULT NULL, p_emblem text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
declare r bigint; begin r := private.create_guild(p_name, p_description, p_emblem); return r; end; $$;
REVOKE EXECUTE ON FUNCTION public.create_guild(text,text,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_guild(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.join_guild(p_guild bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.guild_members where user_id = me) then
    raise exception 'คุณอยู่ในกิลด์อื่นอยู่แล้ว (1 กิลด์ต่อครั้ง)';
  end if;
  insert into public.guild_members(guild_id, user_id, role) values (p_guild, me, 'member');
end; $$;
REVOKE EXECUTE ON FUNCTION private.join_guild(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.join_guild(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_guild(p_guild bigint)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.join_guild(p_guild); end; $$;
REVOKE EXECUTE ON FUNCTION public.join_guild(bigint) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.join_guild(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION private.leave_guild()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin delete from public.guild_members where user_id = auth.uid(); end; $$;
REVOKE EXECUTE ON FUNCTION private.leave_guild() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.leave_guild() TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_guild()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.leave_guild(); end; $$;
REVOKE EXECUTE ON FUNCTION public.leave_guild() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leave_guild() TO authenticated;

CREATE OR REPLACE FUNCTION private.rename_guild(p_guild bigint, p_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare v_uid uuid := auth.uid(); v_owner uuid; v_changed timestamptz; v_admin boolean; v_name text := btrim(p_name);
begin
  if v_uid is null then raise exception 'ต้องเข้าสู่ระบบก่อน'; end if;
  if char_length(v_name) < 2 then raise exception 'ชื่อกิลด์ต้องมีอย่างน้อย 2 ตัวอักษร'; end if;
  if char_length(v_name) > 50 then raise exception 'ชื่อกิลด์ต้องไม่เกิน 50 ตัวอักษร'; end if;
  select owner_id, name_changed_at into v_owner, v_changed from public.guilds where id = p_guild;
  if not found then raise exception 'ไม่พบกิลด์'; end if;
  v_admin := public.is_admin(v_uid);
  if not v_admin then
    if v_uid <> v_owner then raise exception 'เฉพาะหัวหน้ากิลด์หรือแอดมินเท่านั้นที่แก้ไขชื่อได้'; end if;
    if v_changed is not null and v_changed > now() - interval '1 year' then
      raise exception 'หัวหน้ากิลด์เปลี่ยนชื่อได้ปีละครั้ง — เปลี่ยนได้อีกครั้งหลังวันที่ %',
        to_char((v_changed + interval '1 year') at time zone 'Asia/Bangkok', 'DD/MM/YYYY');
    end if;
  end if;
  update public.guilds
  set name = v_name, name_changed_at = case when v_admin then name_changed_at else now() end
  where id = p_guild;
end; $$;
REVOKE EXECUTE ON FUNCTION private.rename_guild(bigint,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.rename_guild(bigint,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rename_guild(p_guild bigint, p_name text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
begin PERFORM private.rename_guild(p_guild, p_name); end; $$;
REVOKE EXECUTE ON FUNCTION public.rename_guild(bigint,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rename_guild(bigint,text) TO authenticated;

-- ---------- Public view counters (need anon) ----------
CREATE OR REPLACE FUNCTION private.increment_view(p_thread bigint)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.threads SET view_count = view_count + 1 WHERE id = p_thread;
$$;
REVOKE EXECUTE ON FUNCTION private.increment_view(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.increment_view(bigint) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.increment_view(p_thread bigint)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.increment_view(p_thread);
$$;
REVOKE EXECUTE ON FUNCTION public.increment_view(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_view(bigint) TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.increment_listing_view(p_listing bigint)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.marketplace_listings SET view_count = view_count + 1 WHERE id = p_listing;
$$;
REVOKE EXECUTE ON FUNCTION private.increment_listing_view(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.increment_listing_view(bigint) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.increment_listing_view(p_listing bigint)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.increment_listing_view(p_listing);
$$;
REVOKE EXECUTE ON FUNCTION public.increment_listing_view(bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_listing_view(bigint) TO authenticated, anon;

-- ---------- weekly aggregator (referenced by view weekly_top_members) ----------
CREATE OR REPLACE FUNCTION private.weekly_top_members_data()
RETURNS TABLE(id uuid, username text, display_name text, avatar_url text, level_id smallint, role text, weekly_points integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select p.id, p.username, p.display_name, p.avatar_url, p.level_id, p.role,
    coalesce(sum(pt.amount), 0)::int as weekly_points
  from public.profiles p
  join public.point_transactions pt on pt.user_id = p.id and pt.created_at > now() - interval '7 days'
  group by p.id having coalesce(sum(pt.amount), 0) > 0;
$$;
REVOKE EXECUTE ON FUNCTION private.weekly_top_members_data() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.weekly_top_members_data() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.weekly_top_members_data()
RETURNS TABLE(id uuid, username text, display_name text, avatar_url text, level_id smallint, role text, weekly_points integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT * FROM private.weekly_top_members_data();
$$;
REVOKE EXECUTE ON FUNCTION public.weekly_top_members_data() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.weekly_top_members_data() TO authenticated, anon;
