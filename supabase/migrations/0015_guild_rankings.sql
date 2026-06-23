-- ============================================================
-- Kawan2 — อันดับกิลด์ (รวมแต้มสมาชิก) สำหรับกิจกรรม/แข่งขัน
-- 0015_guild_rankings.sql
-- ============================================================

create or replace view public.guild_rankings as
select
  g.id, g.name, g.slug, g.description, g.emblem_url, g.is_official, g.member_count, g.xp,
  coalesce(sum(p.reputation), 0)::int as total_points
from public.guilds g
left join public.guild_members gm on gm.guild_id = g.id
left join public.profiles p on p.id = gm.user_id
group by g.id;

grant select on public.guild_rankings to anon, authenticated;
