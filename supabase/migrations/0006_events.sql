-- ============================================================
-- Kawan2 — ตารางกิจกรรม (Events)
-- 0006_events.sql
-- ============================================================

create table public.events (
  id          bigserial primary key,
  title       text not null,
  description text,
  location    text,
  province_id smallint references public.provinces(id),
  cover_url   text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);
create index events_starts_idx on public.events (starts_at);

alter table public.events enable row level security;
create policy "events_read" on public.events
  for select using (true);
create policy "events_insert_staff" on public.events
  for insert with check (public.is_staff(auth.uid()));
create policy "events_update_staff" on public.events
  for update using (public.is_staff(auth.uid()));
create policy "events_delete_staff" on public.events
  for delete using (public.is_staff(auth.uid()));
