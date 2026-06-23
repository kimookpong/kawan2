-- ============================================================
-- Kawan2 — ระบบสมาชิกแบบเสียเงิน (Stripe subscription)
-- 0007_subscriptions.sql
-- ============================================================

-- ขยาย profiles: เก็บ Stripe customer + ระดับสมาชิกที่เสียเงิน
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists membership_tier text not null default 'free'
    check (membership_tier in ('free', 'supporter', 'patron')),
  add column if not exists membership_until timestamptz;

-- ตาราง subscription (sync จาก Stripe ผ่าน webhook)
create table if not exists public.subscriptions (
  id                    text primary key,          -- Stripe subscription id (sub_...)
  user_id               uuid not null references public.profiles(id) on delete cascade,
  status                text not null,             -- active / trialing / past_due / canceled / ...
  tier                  text not null check (tier in ('supporter', 'patron')),
  price_id              text,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- RLS: เจ้าของอ่าน subscription ตัวเองได้ — การเขียนทำผ่าน service role (webhook) เท่านั้น
alter table public.subscriptions enable row level security;
drop policy if exists "subs_select_own" on public.subscriptions;
create policy "subs_select_own" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
