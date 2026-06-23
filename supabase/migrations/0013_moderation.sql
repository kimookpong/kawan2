-- ============================================================
-- Kawan2 — ระบบจัดการสมาชิก: ban / ปรับแต้ม / ปิดบัญชี
-- 0013_moderation.sql
-- ============================================================

alter table public.profiles
  add column if not exists disabled boolean not null default false,
  add column if not exists banned_until timestamptz,
  add column if not exists ban_reason text;

create table if not exists public.member_sanctions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('ban','unban','disable','enable','points')),
  value       integer,
  reason      text,
  by_user     uuid references public.profiles(id),
  created_at  timestamptz default now()
);
create index if not exists sanctions_user_idx on public.member_sanctions (user_id, created_at desc);
alter table public.member_sanctions enable row level security;
drop policy if exists "sanctions_select" on public.member_sanctions;
create policy "sanctions_select" on public.member_sanctions
  for select using (auth.uid() = user_id or public.is_staff(auth.uid()));

create or replace function public.is_blocked(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = uid and (disabled or (banned_until is not null and banned_until > now()))
  );
$$;
grant execute on function public.is_blocked(uuid) to authenticated, anon;

create or replace function public.ban_user(target uuid, days integer, reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare until timestamptz;
begin
  if not public.is_staff(auth.uid()) then raise exception 'forbidden'; end if;
  if days not in (1,3,7,30) then raise exception 'invalid duration'; end if;
  if (select role from public.profiles where id = target) = 'admin' then
    raise exception 'cannot ban admin';
  end if;
  until := now() + (days || ' days')::interval;
  update public.profiles set banned_until = until, ban_reason = reason where id = target;
  insert into public.member_sanctions(user_id, type, value, reason, by_user) values (target,'ban',days,reason,auth.uid());
  insert into public.notifications(user_id, type, payload)
    values (target,'ban', jsonb_build_object('days',days,'until',until,'reason',reason));
end; $$;

create or replace function public.unban_user(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'forbidden'; end if;
  update public.profiles set banned_until = null, ban_reason = null where id = target;
  insert into public.member_sanctions(user_id, type, by_user) values (target,'unban',auth.uid());
end; $$;

create or replace function public.set_user_disabled(target uuid, p_disabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  if p_disabled and (select role from public.profiles where id = target) = 'admin' then
    raise exception 'cannot disable admin';
  end if;
  update public.profiles set disabled = p_disabled where id = target;
  insert into public.member_sanctions(user_id, type, by_user)
    values (target, case when p_disabled then 'disable' else 'enable' end, auth.uid());
end; $$;

create or replace function public.admin_adjust_points(target uuid, amount integer, reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden: admin only'; end if;
  insert into public.point_transactions(user_id, amount, reason, ref_type)
    values (target, amount, coalesce(reason,'admin_adjust'), 'admin');
  insert into public.member_sanctions(user_id, type, value, reason, by_user)
    values (target,'points',amount,reason,auth.uid());
end; $$;

grant execute on function public.ban_user(uuid,integer,text) to authenticated;
grant execute on function public.unban_user(uuid) to authenticated;
grant execute on function public.set_user_disabled(uuid,boolean) to authenticated;
grant execute on function public.admin_adjust_points(uuid,integer,text) to authenticated;

-- RLS: บล็อกการเขียนเมื่อถูกบล็อก
drop policy if exists "threads_insert" on public.threads;
create policy "threads_insert" on public.threads
  for insert with check (auth.uid() = author_id and not public.is_blocked(auth.uid()));

drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts
  for insert with check (
    auth.uid() = author_id and not public.is_blocked(auth.uid())
    and not exists (select 1 from public.threads t where t.id = thread_id and t.is_locked)
  );

drop policy if exists "news_comments_insert" on public.news_comments;
create policy "news_comments_insert" on public.news_comments
  for insert with check (auth.uid() = author_id and not public.is_blocked(auth.uid()));

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member" on public.messages
  for insert with check (
    sender_id = auth.uid() and not public.is_blocked(auth.uid())
    and exists (select 1 from public.conversation_members m
                where m.conversation_id = messages.conversation_id and m.user_id = auth.uid())
  );

drop policy if exists "reactions_insert" on public.reactions;
create policy "reactions_insert" on public.reactions
  for insert with check (auth.uid() = user_id and not public.is_blocked(auth.uid()));
