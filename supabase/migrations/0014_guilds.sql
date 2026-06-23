-- ============================================================
-- Kawan2 — ระบบกิลด์ (แทนระบบจังหวัด)
-- 0014_guilds.sql
-- subscriber สร้างได้ 1, admin สร้างได้หลาย, ทุกคนเข้าร่วมได้ทีละ 1
-- ============================================================

create table if not exists public.guilds (
  id           bigserial primary key,
  name         text not null,
  slug         text unique not null,
  description  text,
  emblem_url   text,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  is_official  boolean not null default false,
  member_count integer not null default 0,
  xp           integer not null default 0,
  created_at   timestamptz default now()
);
create index if not exists guilds_owner_idx on public.guilds (owner_id);

create table if not exists public.guild_members (
  guild_id   bigint not null references public.guilds(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('member','officer','leader')),
  joined_at  timestamptz default now(),
  primary key (user_id)
);
create index if not exists guild_members_guild_idx on public.guild_members (guild_id);

alter table public.guilds enable row level security;
drop policy if exists "guilds_read" on public.guilds;
create policy "guilds_read" on public.guilds for select using (true);
drop policy if exists "guilds_update_owner" on public.guilds;
create policy "guilds_update_owner" on public.guilds
  for update using (owner_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "guilds_delete_owner" on public.guilds;
create policy "guilds_delete_owner" on public.guilds
  for delete using (owner_id = auth.uid() or public.is_admin(auth.uid()));

alter table public.guild_members enable row level security;
drop policy if exists "guild_members_read" on public.guild_members;
create policy "guild_members_read" on public.guild_members for select using (true);

create or replace function public.bump_guild_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.guilds set member_count = member_count + 1 where id = new.guild_id;
  elsif tg_op = 'DELETE' then
    update public.guilds set member_count = greatest(0, member_count - 1) where id = old.guild_id;
  end if;
  return null;
end; $$;
drop trigger if exists on_guild_member_change on public.guild_members;
create trigger on_guild_member_change
  after insert or delete on public.guild_members
  for each row execute function public.bump_guild_count();

create or replace function public.create_guild(p_name text, p_description text default null, p_emblem text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  is_adm boolean;
  tier text;
  owned int;
  new_slug text;
  gid bigint;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select public.is_admin(me) into is_adm;
  select membership_tier into tier from public.profiles where id = me;

  if not is_adm then
    if coalesce(tier,'free') = 'free' then
      raise exception 'ต้องเป็นสมาชิกผู้สนับสนุน (subscribe) จึงจะสร้างกิลด์ได้';
    end if;
    select count(*) into owned from public.guilds where owner_id = me and not is_official;
    if owned >= 1 then raise exception 'สร้างกิลด์ได้ 1 กิลด์ต่อบัญชี'; end if;
  end if;

  new_slug := lower(regexp_replace(coalesce(p_name,''), '[^a-z0-9]+', '-', 'g'));
  new_slug := trim(both '-' from new_slug);
  if new_slug = '' then new_slug := 'guild'; end if;
  new_slug := new_slug || '-' || substr(md5(random()::text),1,5);

  insert into public.guilds(name, slug, description, emblem_url, owner_id, is_official)
    values (p_name, new_slug, p_description, p_emblem, me, is_adm)
    returning id into gid;

  insert into public.guild_members(guild_id, user_id, role)
    values (gid, me, 'leader')
    on conflict (user_id) do nothing;
  return gid;
end; $$;

create or replace function public.join_guild(p_guild bigint)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.guild_members where user_id = me) then
    raise exception 'คุณอยู่ในกิลด์อื่นอยู่แล้ว (1 กิลด์ต่อครั้ง)';
  end if;
  insert into public.guild_members(guild_id, user_id, role) values (p_guild, me, 'member');
end; $$;

create or replace function public.leave_guild()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.guild_members where user_id = auth.uid();
end; $$;

grant execute on function public.create_guild(text,text,text) to authenticated;
grant execute on function public.join_guild(bigint) to authenticated;
grant execute on function public.leave_guild() to authenticated;
