-- ============================================================
-- Kawan2 — แจ้งเตือนเมื่อถูก @mention ในกระทู้/ความเห็นข่าว
-- 0010_mentions.sql
-- ============================================================

create or replace function public.notify_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m text[];
  uname text;
  uid uuid;
  seen text[] := '{}';
  payload jsonb;
begin
  for m in select regexp_matches(new.body, '@([A-Za-z0-9_]{3,30})', 'g') loop
    uname := m[1];
    if uname = any(seen) then continue; end if;
    seen := array_append(seen, uname);

    select id into uid from public.profiles where username = uname;
    if uid is null or uid = new.author_id then continue; end if;

    if TG_TABLE_NAME = 'posts' then
      payload := jsonb_build_object('by', new.author_id, 'thread_id', new.thread_id, 'ref', 'thread');
    elsif TG_TABLE_NAME = 'news_comments' then
      payload := jsonb_build_object('by', new.author_id, 'news_id', new.news_id, 'ref', 'news');
    else
      payload := jsonb_build_object('by', new.author_id);
    end if;

    insert into public.notifications (user_id, type, payload) values (uid, 'mention', payload);
  end loop;
  return new;
end; $$;

drop trigger if exists on_post_mention on public.posts;
create trigger on_post_mention after insert on public.posts
  for each row execute function public.notify_mentions();

drop trigger if exists on_news_comment_mention on public.news_comments;
create trigger on_news_comment_mention after insert on public.news_comments
  for each row execute function public.notify_mentions();
