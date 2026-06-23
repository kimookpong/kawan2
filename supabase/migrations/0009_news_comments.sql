-- ============================================================
-- Kawan2 — คอมเมนต์ใต้ข่าว (news comments)
-- 0009_news_comments.sql
-- ============================================================

create table if not exists public.news_comments (
  id          bigserial primary key,
  news_id     bigint not null references public.news(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  status      text default 'published' check (status in ('published','hidden','deleted')),
  created_at  timestamptz default now()
);
create index if not exists news_comments_news_idx on public.news_comments (news_id, created_at);

alter table public.news_comments enable row level security;

drop policy if exists "news_comments_select" on public.news_comments;
create policy "news_comments_select" on public.news_comments
  for select using (status = 'published' or author_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "news_comments_insert" on public.news_comments;
create policy "news_comments_insert" on public.news_comments
  for insert with check (auth.uid() = author_id);

drop policy if exists "news_comments_update" on public.news_comments;
create policy "news_comments_update" on public.news_comments
  for update using (auth.uid() = author_id or public.is_staff(auth.uid()));

drop policy if exists "news_comments_delete" on public.news_comments;
create policy "news_comments_delete" on public.news_comments
  for delete using (auth.uid() = author_id or public.is_staff(auth.uid()));

-- ให้ point เมื่อคอมเมนต์ข่าว (+3)
create or replace function public.on_news_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_points(new.author_id, 3, 'news_comment', 'news', new.news_id);
  return new;
end; $$;

drop trigger if exists on_news_comment on public.news_comments;
create trigger on_news_comment
  after insert on public.news_comments
  for each row execute function public.on_news_comment_insert();
