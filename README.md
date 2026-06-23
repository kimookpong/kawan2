# Kawan2 — ชุมชนชายแดนใต้

ระบบ community / webboard สำหรับ 3 จังหวัดชายแดนใต้ (ปัตตานี นราธิวาส ยะลา) พร้อมระบบสมาชิกแบบมีระดับ ข่าวสาร และ Direct Message แบบเรียลไทม์

**Stack:** Next.js 14 (App Router) · Supabase (Auth / Postgres / Storage / Realtime) · Tailwind CSS

> เอกสารวิเคราะห์/ออกแบบ/แผนฉบับเต็มอยู่ที่ [`KAWAN2_PLAN.md`](./KAWAN2_PLAN.md)

---

## ฟีเจอร์ที่มีในโค้ดชุดนี้

- 🔐 **Auth** — สมัคร/เข้าสู่ระบบด้วยอีเมล, สร้าง profile อัตโนมัติผ่าน trigger
- 🏅 **ระบบสมาชิก + Level** — Bronze → Silver → Gold → Platinum เลื่อนระดับอัตโนมัติตามคะแนน
- 💬 **เว็บบอร์ด** — หมวดหมู่, สร้าง/อ่าน/ตอบกระทู้, กดไลก์ (พร้อมให้คะแนนอัตโนมัติ)
- 📰 **ข่าวสาร** — หน้าแรกแสดงข่าวเด่น + กระทู้ล่าสุด (ISR), หน้ารายละเอียดข่าว
- 📨 **Direct Message** — แชทส่วนตัวเรียลไทม์ผ่าน Supabase Realtime
- 👤 **โปรไฟล์** — badge, achievement, progress bar ระดับสมาชิก
- 🏆 **หอเกียรติยศ** — จัดอันดับสมาชิกตามคะแนน
- 🔔 **การแจ้งเตือน** — DM / ตอบกระทู้ / เลื่อนระดับ
- 🛡️ **RLS ครบทุกตาราง** — ความปลอดภัยที่ระดับฐานข้อมูล

หน้า กิจกรรม (Events) และ ตลาดซื้อขาย (Marketplace) เป็น placeholder สำหรับ Phase 2–3

---

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Supabase

สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) แล้วคัดลอกค่า:

```bash
cp .env.example .env.local
```

แก้ `.env.local` ใส่ค่าจาก **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. รัน migration + seed

**ตัวเลือก A — Supabase CLI (แนะนำ):**

```bash
npm install -g supabase
supabase link --project-ref <your-ref>
supabase db push          # รัน migrations ใน supabase/migrations/
psql "$DATABASE_URL" -f supabase/seed.sql   # หรือรัน seed ผ่าน SQL Editor
```

**ตัวเลือก B — SQL Editor บน Dashboard:**

รันไฟล์ตามลำดับใน SQL Editor:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_functions_triggers.sql
supabase/migrations/0003_rls.sql
supabase/migrations/0004_storage.sql
supabase/migrations/0005_realtime.sql
supabase/seed.sql
```

### 4. รันแอป

```bash
npm run dev      # http://localhost:3000
```

### 5. ตั้งตัวเองเป็น admin (หลังสมัครสมาชิก)

```sql
update public.profiles set role = 'admin' where username = 'YOUR_USERNAME';
```

---

## คำสั่ง

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # รัน production
npm run typecheck  # ตรวจชนิดข้อมูล (tsc --noEmit)
```

> หมายเหตุ: `npm run build` ต้องมีอินเทอร์เน็ต (โหลดฟอนต์ Google Fonts) — ตรวจ type ผ่านแล้วด้วย `npm run typecheck`

---

## โครงสร้างโปรเจกต์

```
app/                  # Next.js App Router
  page.tsx            # หน้าแรก (ข่าว + กระทู้ล่าสุด)
  auth/               # login / signup / server actions
  board/              # เว็บบอร์ด (list, category, thread, new)
  news/               # ข่าวสาร
  messages/           # Direct Message (realtime)
  u/[username]/       # โปรไฟล์สาธารณะ
  me/                 # ตั้งค่าโปรไฟล์
  leaderboard/        # หอเกียรติยศ
  notifications/      # การแจ้งเตือน
components/           # UI components (navbar, footer, thread-row, chat-room…)
lib/supabase/         # client / server / middleware (รูปแบบ @supabase/ssr)
lib/constants.ts      # nav, จังหวัด, สไตล์ระดับสมาชิก
supabase/migrations/  # schema + triggers + RLS + storage + realtime
supabase/seed.sql     # จังหวัด, ระดับสมาชิก, หมวดหมู่, badge
tailwind.config.ts    # design tokens จาก design/ (Deep Green + Terracotta)
```

---

## Design System

นำ tokens มาจาก `design/kawan3_community_system/DESIGN.md`:
สี Deep Green (`#003527`) เป็นหลัก + Terracotta (`#733100`) เป็น accent,
ฟอนต์ Be Vietnam Pro (fallback Sarabun), การ์ดขอบบาง radius 8px

---

## ขั้นตอนถัดไป (จากแผน)

- Phase 2: Events, badge engine อัตโนมัติ, full-text search, typing indicator/presence
- Phase 3: Admin dashboard, moderation workflow, Marketplace, เพิ่มจังหวัด, i18n (มลายู/อังกฤษ), PWA

ดูรายละเอียดทั้งหมดใน [`KAWAN2_PLAN.md`](./KAWAN2_PLAN.md)
