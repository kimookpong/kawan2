-- ============================================================
-- Kawan2 — แก้ SECURITY DEFINER ของ views (Supabase linter)
-- guild_rankings: ตารางต้นทาง (guilds/guild_members/profiles) อ่านได้สาธารณะอยู่แล้ว
--   → ใช้ security_invoker ได้เลย
-- weekly_top_members: รวมแต้มจาก point_transactions ที่ RLS อ่านได้เฉพาะแถวของตัวเอง
--   → ใช้ฟังก์ชัน security definer รวมผลให้ แล้วครอบด้วย view แบบ security_invoker
--   เพื่อให้ลีดเดอร์บอร์ดยังทำงาน แต่ไม่เปิดเผยรายการธุรกรรมรายตัว
-- 0017_security_invoker_views.sql
-- ============================================================

-- 1) guild_rankings → security_invoker
create or replace view public.guild_rankings
with (security_invoker = on) as
select
  g.id, g.name, g.slug, g.description, g.emblem_url, g.is_official, g.member_count, g.xp,
  coalesce(sum(p.reputation), 0)::int as total_points
from public.guilds g
left join public.guild_members gm on gm.guild_id = g.id
left join public.profiles p on p.id = gm.user_id
group by g.id;

grant select on public.guild_rankings to anon, authenticated;

-- 2) weekly_top_members → ฟังก์ชัน definer + view invoker
create or replace function public.weekly_top_members_data()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  level_id smallint,
  role text,
  weekly_points int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.username, p.display_name, p.avatar_url, p.level_id, p.role,
    coalesce(sum(pt.amount), 0)::int as weekly_points
  from public.profiles p
  join public.point_transactions pt
    on pt.user_id = p.id and pt.created_at > now() - interval '7 days'
  group by p.id
  having coalesce(sum(pt.amount), 0) > 0;
$$;

grant execute on function public.weekly_top_members_data() to anon, authenticated;

create or replace view public.weekly_top_members
with (security_invoker = on) as
  select id, username, display_name, avatar_url, level_id, role, weekly_points
  from public.weekly_top_members_data();

grant select on public.weekly_top_members to anon, authenticated;
