-- ============================================================
-- Kawan2 — Schema หลัก
-- 0001_schema.sql
-- ============================================================

-- ---------- จังหวัด (รองรับเพิ่มในอนาคต) ----------
create table public.provinces (
  id          smallserial primary key,
  name_th     text not null,
  name_en     text,
  slug        text unique not null,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ---------- ระดับสมาชิก (config-driven) ----------
create table public.membership_levels (
  id          smallint primary key,
  name_th     text not null,
  name_en     text not null,
  min_points  integer not null,
  perks       jsonb default '{}'::jsonb
);

-- ---------- โปรไฟล์ (ขยาย auth.users) ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  province_id  smallint references public.provinces(id),
  role         text not null default 'member'
                 check (role in ('member','editor','admin')),
  reputation   integer not null default 0,
  level_id     smallint not null default 1 references public.membership_levels(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index profiles_province_idx on public.profiles (province_id);

-- ---------- หมวดหมู่เว็บบอร์ด ----------
create table public.categories (
  id          serial primary key,
  name_th     text not null,
  slug        text unique not null,
  description text,
  icon        text,
  sort_order  smallint default 0,
  is_active   boolean default true
);

-- ---------- กระทู้ ----------
create table public.threads (
  id           bigserial primary key,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  category_id  integer not null references public.categories(id),
  province_id  smallint references public.provinces(id),
  title        text not null,
  body         text not null,
  is_pinned    boolean default false,
  is_locked    boolean default false,
  view_count   integer default 0,
  reply_count  integer default 0,
  like_count   integer default 0,
  status       text default 'published'
                 check (status in ('published','hidden','deleted')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index threads_category_idx on public.threads (category_id, created_at desc);
create index threads_province_idx on public.threads (province_id, created_at desc);
create index threads_author_idx on public.threads (author_id);

-- ---------- ความเห็น/ตอบกลับ ----------
create table public.posts (
  id           bigserial primary key,
  thread_id    bigint not null references public.threads(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  body         text not null,
  parent_id    bigint references public.posts(id) on delete cascade,
  like_count   integer default 0,
  status       text default 'published'
                 check (status in ('published','hidden','deleted')),
  created_at   timestamptz default now()
);
create index posts_thread_idx on public.posts (thread_id, created_at);

-- ---------- reaction / like (polymorphic) ----------
create table public.reactions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('thread','post','news')),
  target_id   bigint not null,
  type        text not null default 'like',
  created_at  timestamptz default now(),
  unique (user_id, target_type, target_id, type)
);
create index reactions_target_idx on public.reactions (target_type, target_id);

-- ---------- ข่าวสาร ----------
create table public.news (
  id           bigserial primary key,
  author_id    uuid not null references public.profiles(id),
  province_id  smallint references public.provinces(id),
  category     text,
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  body         text not null,
  cover_url    text,
  is_featured  boolean default false,
  status       text default 'draft'
                 check (status in ('draft','pending','published','archived')),
  view_count   integer default 0,
  published_at timestamptz,
  created_at   timestamptz default now()
);
create index news_status_idx on public.news (status, published_at desc);
create index news_featured_idx on public.news (is_featured, published_at desc);

-- ---------- Badge / Achievement ----------
create table public.badges (
  id          serial primary key,
  code        text unique not null,
  name_th     text not null,
  description text,
  icon        text,
  criteria    jsonb
);
create table public.user_badges (
  user_id    uuid references public.profiles(id) on delete cascade,
  badge_id   integer references public.badges(id) on delete cascade,
  earned_at  timestamptz default now(),
  primary key (user_id, badge_id)
);

-- ---------- Point log ----------
create table public.point_transactions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,
  reason      text not null,
  ref_type    text,
  ref_id      bigint,
  created_at  timestamptz default now()
);
create index point_tx_user_idx on public.point_transactions (user_id, created_at desc);

-- ---------- Direct Message ----------
create table public.conversations (
  id              bigserial primary key,
  created_at      timestamptz default now(),
  last_message_at timestamptz default now()
);
create table public.conversation_members (
  conversation_id bigint references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  last_read_at    timestamptz default now(),
  primary key (conversation_id, user_id)
);
create index conv_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id              bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text,
  attachment_url  text,
  created_at      timestamptz default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

-- ---------- การแจ้งเตือน ----------
create table public.notifications (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  payload     jsonb,
  is_read     boolean default false,
  created_at  timestamptz default now()
);
create index notif_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ---------- รายงานเนื้อหา (moderation) ----------
create table public.reports (
  id          bigserial primary key,
  reporter_id uuid references public.profiles(id),
  target_type text not null,
  target_id   bigint not null,
  reason      text,
  status      text default 'open'
                check (status in ('open','reviewed','dismissed')),
  created_at  timestamptz default now()
);
