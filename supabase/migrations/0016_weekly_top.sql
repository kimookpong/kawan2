-- ============================================================
-- Kawan2 — สมาชิกเด่นประจำสัปดาห์ (รวมแต้มที่ได้รับใน 7 วันล่าสุด)
-- 0016_weekly_top.sql
-- ============================================================

create or replace view public.weekly_top_members as
select
  p.id, p.username, p.display_name, p.avatar_url, p.level_id, p.role,
  coalesce(sum(pt.amount), 0)::int as weekly_points
from public.profiles p
join public.point_transactions pt
  on pt.user_id = p.id and pt.created_at > now() - interval '7 days'
group by p.id
having coalesce(sum(pt.amount), 0) > 0;

grant select on public.weekly_top_members to anon, authenticated;
