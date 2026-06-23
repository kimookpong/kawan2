# Kawan2 — เอกสารวิเคราะห์ ออกแบบ และแผนการพัฒนา

> ระบบ Community / Webboard สำหรับ 3 จังหวัดชายแดนใต้ (ปัตตานี นราธิวาส ยะลา) พร้อมรองรับการขยายจังหวัดในอนาคต
> Stack: **Next.js (App Router) + Supabase (Auth / Postgres / Storage / Realtime)**
> เวอร์ชันเอกสาร: 1.0 — 23 มิ.ย. 2026

---

## สารบัญ

1. [ภาพรวมและเป้าหมาย](#1-ภาพรวมและเป้าหมาย)
2. [วิเคราะห์ความต้องการ (Requirement Analysis)](#2-วิเคราะห์ความต้องการ)
3. [สถาปัตยกรรมระบบ (System Architecture)](#3-สถาปัตยกรรมระบบ)
4. [Design System (สรุปจากโฟลเดอร์ design)](#4-design-system)
5. [Information Architecture & Sitemap](#5-information-architecture--sitemap)
6. [รายละเอียดฟีเจอร์ (Feature Breakdown)](#6-รายละเอียดฟีเจอร์)
7. [ระบบสมาชิกและ Level (Membership & Gamification)](#7-ระบบสมาชิกและ-level)
8. [Database Schema (Supabase / PostgreSQL)](#8-database-schema)
9. [Row Level Security (RLS) & ความปลอดภัย](#9-row-level-security--ความปลอดภัย)
10. [Supabase Storage (ไฟล์และรูปภาพ)](#10-supabase-storage)
11. [Realtime & Direct Message](#11-realtime--direct-message)
12. [โครงสร้างโปรเจกต์ Next.js](#12-โครงสร้างโปรเจกต์-nextjs)
13. [แผนการพัฒนา (Roadmap แบบเป็นเฟส)](#13-แผนการพัฒนา-roadmap)
14. [ความเสี่ยงและข้อควรระวัง](#14-ความเสี่ยงและข้อควรระวัง)
15. [ขั้นตอนถัดไป (Next Steps)](#15-ขั้นตอนถัดไป)

---

## 1. ภาพรวมและเป้าหมาย

**Kawan2** ("kawan" = เพื่อน ในภาษามลายู) เป็นแพลตฟอร์มชุมชนออนไลน์ที่รวมผู้คนใน 3 จังหวัดชายแดนใต้เข้าด้วยกัน โดยผสมผสานระหว่าง **เว็บบอร์ด (webboard)**, **พอร์ทัลข่าวสารภูมิภาค**, และ **เครือข่ายสังคม** ที่มีระบบสมาชิกแบบมีระดับ (membership level) เพื่อสร้างแรงจูงใจในการมีส่วนร่วม

### เป้าหมายหลัก

- เป็นศูนย์กลางข่าวสารและกิจกรรมที่น่าสนใจของภูมิภาค (หน้าแรกเน้นข่าว)
- เปิดพื้นที่พูดคุย แลกเปลี่ยน ผ่านกระดานสนทนาตามหมวดหมู่
- สร้างความผูกพันผ่านระบบ level สมาชิก เหรียญรางวัล (badge) และหอเกียรติยศ
- ให้สมาชิกติดต่อกันแบบส่วนตัวผ่าน Direct Message
- ออกแบบให้ขยายเพิ่มจังหวัดใหม่ได้โดยไม่ต้องรื้อโครงสร้าง

### กลุ่มผู้ใช้เป้าหมาย

| กลุ่ม | ความต้องการหลัก |
|-------|----------------|
| คนในพื้นที่ทั่วไป | อ่านข่าว เข้าร่วมสนทนา หากิจกรรม |
| ผู้สร้างเนื้อหา / นักเขียนชุมชน | โพสต์กระทู้ บทความ สะสมชื่อเสียง (reputation) |
| ผู้ดูแลชุมชน (Moderator) | ดูแลเนื้อหา อนุมัติข่าว จัดการรายงาน |
| ผู้ดูแลระบบ (Admin) | จัดการผู้ใช้ จังหวัด หมวดหมู่ การตั้งค่าระบบ |

---

## 2. วิเคราะห์ความต้องการ

### 2.1 ความต้องการเชิงฟังก์ชัน (Functional Requirements)

| รหัส | ฟีเจอร์ | คำอธิบาย | ความสำคัญ |
|------|---------|----------|-----------|
| FR-1 | ระบบสมาชิก | สมัคร / เข้าสู่ระบบ / โปรไฟล์ ผ่าน Supabase Auth | ต้องมี (MVP) |
| FR-2 | Membership Level | ระดับสมาชิกตาม point/activity (Bronze→Silver→Gold→Platinum) | ต้องมี |
| FR-3 | เว็บบอร์ด | สร้างกระทู้ ตอบกลับ กดไลก์ ตามหมวดหมู่และจังหวัด | ต้องมี (MVP) |
| FR-4 | ระบบข่าวสาร | หน้าแรกแสดงข่าว/บทความเด่น แยกหมวด | ต้องมี (MVP) |
| FR-5 | Direct Message | แชทส่วนตัวระหว่างสมาชิกแบบ realtime | ต้องมี |
| FR-6 | ระบบจังหวัด | กรองเนื้อหาตามจังหวัด รองรับเพิ่มจังหวัดใหม่ | ต้องมี |
| FR-7 | กิจกรรม (Events) | ปฏิทินกิจกรรมชุมชน | ควรมี (Phase 2) |
| FR-8 | หอเกียรติยศ (Leaderboard) | จัดอันดับสมาชิกตาม point/badge | ควรมี |
| FR-9 | Badge / Achievement | เหรียญรางวัลตามกิจกรรม | ควรมี |
| FR-10 | การแจ้งเตือน (Notifications) | แจ้งตอบกระทู้ ข้อความใหม่ ระบบ | ควรมี |
| FR-11 | ตลาดซื้อขาย (Marketplace) | ประกาศซื้อขายชุมชน | อนาคต (Phase 3) |
| FR-12 | ระบบรายงาน/Moderation | รายงานเนื้อหา จัดการโดย mod | ควรมี |
| FR-13 | ค้นหา (Search) | ค้นกระทู้ ข่าว สมาชิก | ควรมี |

### 2.2 ความต้องการที่ไม่ใช่ฟังก์ชัน (Non-Functional)

- **Responsive**: รองรับ mobile / tablet / desktop (breakpoints ตาม design)
- **ภาษา**: ไทยเป็นหลัก ออกแบบเผื่อ i18n (มลายู/อังกฤษ) ในอนาคต — typography ต้องรองรับสระ/วรรณยุกต์ไทย (line-height ≥1.5)
- **ประสิทธิภาพ**: หน้าแรกเน้น SSR/ISR เพื่อ SEO และโหลดเร็ว
- **ความปลอดภัย**: RLS ทุกตาราง, ป้องกัน XSS จาก user content, rate limiting
- **ความเป็นส่วนตัว**: DM เห็นเฉพาะคู่สนทนา, ข้อมูลส่วนตัวควบคุมการเข้าถึง
- **ขยายได้ (Scalability)**: schema รองรับเพิ่มจังหวัด/หมวดหมู่โดยไม่ต้อง migrate โครงสร้าง

### 2.3 ข้อสมมติและขอบเขต (Assumptions & Scope)

- ใช้ Supabase managed (ไม่ self-host ในเฟสแรก)
- เนื้อหาข่าว: สมาชิกระดับสูง/ทีมงานเป็นผู้โพสต์ ผ่านขั้นตอนอนุมัติ (ไม่ใช่ใครก็โพสต์ข่าวได้)
- รองรับ 3 จังหวัดในเฟสแรก แต่ schema ออกแบบเป็นตาราง `provinces` ตั้งแต่ต้น

---

## 3. สถาปัตยกรรมระบบ

### 3.1 ภาพรวม

```
┌─────────────────────────────────────────────────────────┐
│                      ผู้ใช้ (Browser)                      │
│              Responsive Web App (mobile-first)            │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│                  Next.js (App Router)                     │
│  • Server Components (SSR/ISR) — หน้าข่าว, กระทู้ (SEO)   │
│  • Client Components — DM realtime, ฟอร์ม, interaction    │
│  • Route Handlers / Server Actions — mutation             │
│  • Middleware — refresh session, ป้องกัน route            │
└───────────┬───────────────────────────────┬─────────────┘
            │ @supabase/ssr                  │ service role
            │ (anon key + RLS)               │ (server เท่านั้น)
┌───────────▼───────────────────────────────▼─────────────┐
│                       Supabase                            │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │
│  │  Auth   │ │ Postgres │ │ Storage │ │   Realtime   │  │
│  │ (JWT)   │ │  + RLS   │ │(buckets)│ │ (DM, notify) │  │
│  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │
│  + Edge Functions (งานเบื้องหลัง: คำนวณ point, badge)    │
└──────────────────────────────────────────────────────────┘
```

### 3.2 หลักการสำคัญ

- **@supabase/ssr**: ใช้ pattern official สำหรับ Next.js App Router — แยก client สำหรับ browser, server component, route handler, และ middleware ชัดเจน
- **RLS เป็นด่านความปลอดภัยหลัก**: ความปลอดภัยอยู่ที่ database ไม่ใช่ที่ frontend ดังนั้นต่อให้ client ถูก bypass ก็ยังปลอดภัย
- **Service role key อยู่ฝั่ง server เท่านั้น** (เช่น webhook, การคำนวณ point) ห้ามหลุดไป client
- **หน้าสาธารณะ (ข่าว/กระทู้) ใช้ SSR/ISR** เพื่อ SEO; **ส่วน interactive (DM) ใช้ client + realtime subscription**

### 3.3 ทำไม Next.js + Supabase

- Supabase ให้ Auth + Postgres + Storage + Realtime ในที่เดียว ลดงาน backend
- Next.js App Router ให้ทั้ง SSR (ดีต่อ SEO หน้าข่าว) และ client interactivity (DM)
- Postgres + RLS เหมาะกับโดเมนที่ต้องควบคุมสิทธิ์ละเอียด (membership level, DM ส่วนตัว)
- Deploy ง่ายบน Vercel; ค่าใช้จ่ายเริ่มต้นต่ำ ขยายได้

---

## 4. Design System

สรุปจาก `design/kawan3_community_system/DESIGN.md` — สไตล์ **"Modern Corporate with Cultural Infusion"** เน้น information-dense แต่อบอุ่น

### 4.1 สีหลัก (Color Tokens)

| Token | ค่า | การใช้งาน |
|-------|-----|-----------|
| `primary` (Deep Green) | `#003527` | navbar, ปุ่มหลัก, หัวข้อสำคัญ |
| `primary-container` | `#064e3b` | พื้นหลัง section เน้น |
| `tertiary` (Terracotta) | `#502000` / `#733100` | CTA สำคัญ ("เข้าร่วมชุมชน"), badge active |
| `surface` | `#f9f9f9` | พื้นหลังหน้า |
| `surface-container-lowest` | `#ffffff` | พื้นหลังการ์ด |
| `outline-variant` | `#bfc9c3` | เส้นขอบการ์ด (1px) |
| `on-surface` | `#1a1c1c` | ข้อความหลัก |
| `error` | `#ba1a1a` | error state |

> รองรับ dark mode ผ่าน token `darkMode: "class"` ที่มีอยู่แล้วใน config

### 4.2 Typography

- ฟอนต์: **Be Vietnam Pro** (ทดแทน Sarabun/Kanit ได้ดี รองรับไทย) — โหลดจาก Google Fonts
- Headline LG: 30px/700, Headline MD: 20px/600, Body LG: 16px/400, Body SM: 12px/400
- **ไทย**: line-height ≥1.5 เพื่อไม่ให้สระ/วรรณยุกต์ถูกตัด

### 4.3 Layout & Spacing

- Desktop: 12-column fluid grid, gutter 24px, container max 1280px
- Tablet: 6 columns, 16px; Mobile: stack เดี่ยว, margin 12–16px
- Padding ในการ์ด 16px (แน่น), ระยะระหว่าง module 24px (โปร่ง)

### 4.4 Components

- **Buttons**: Primary (เขียวเข้มทึบ), Secondary (โปร่งขอบเขียว), Accent/CTA (terracotta ทึบ); มุม 4px
- **Cards**: พื้นขาว ขอบเทา 1px, radius 8px, hover เงาเบา `0 4px 6px rgba(0,0,0,0.05)`
- **Chips/Badges**: พื้น low-saturation + ตัวอักษร high-saturation สีเดียวกัน (หมวด "ข่าว"/"กิจกรรม"/"วัฒนธรรม")
- **List items**: แถวข้อมูลแน่น — ซ้าย thumbnail > กลาง title+excerpt > ขวา stats (views/replies)
- **Member badge**: BRONZE / SILVER / GOLD MEMBER (จากดีไซน์ profile)

### 4.5 หน้าจอที่มีดีไซน์อ้างอิงแล้ว

| ไฟล์ | หน้า |
|------|------|
| `kawan3_2`, `kawan3_4` | หน้าแรก / เว็บบอร์ดชุมชน (TH/EN) |
| `kawan3_community_1/2` | หน้า community ข่าว + stats + กระทู้ล่าสุด |
| `kawan3_3`, `kawan3_5` | หน้าโปรไฟล์สมาชิก + badge + achievement |
| `kawan3_1`, `kawan3_6/7` | หน้าบทความ/เนื้อหา (Pattani Heritage Trail) |

> สามารถปรับเปลี่ยนได้ตามความเหมาะสม — ใช้เป็น reference ในการสร้าง component library

---

## 5. Information Architecture & Sitemap

```
Kawan2
├── / (หน้าแรก)              → ข่าวเด่น + กระทู้ล่าสุด + สถิติชุมชน + สมาชิกเด่น
├── /news                    → ข่าวสารภูมิภาค (แยกหมวด/จังหวัด)
│   └── /news/[slug]         → รายละเอียดข่าว
├── /board                   → กระดานสนทนา (รายการหมวดหมู่)
│   ├── /board/[category]    → กระทู้ในหมวด
│   └── /board/thread/[id]   → กระทู้ + ความเห็น
├── /events                  → ปฏิทินกิจกรรม (Phase 2)
├── /marketplace            → ตลาดซื้อขาย (Phase 3)
├── /leaderboard            → หอเกียรติยศ
├── /messages               → Direct Message (รายการห้อง + แชท)
│   └── /messages/[conversationId]
├── /u/[username]           → โปรไฟล์สาธารณะ + badge + achievement
├── /me                      → จัดการโปรไฟล์ตนเอง / ตั้งค่า
├── /notifications          → การแจ้งเตือน
├── /auth                    → login / signup / reset password
└── /admin                   → แดชบอร์ดผู้ดูแล (จัดการ user, ข่าว, รายงาน, จังหวัด)
```

### Navigation (จากดีไซน์)

หน้าแรก · ข่าวสารภูมิภาค · กระดานสนทนา · ปฏิทินกิจกรรม · ตลาดซื้อขาย · หอเกียรติยศ
มุมขวา: ค้นหา · การแจ้งเตือน · ข้อความ · เมนูโปรไฟล์ · ปุ่ม CTA "สร้างกระทู้"

---

## 6. รายละเอียดฟีเจอร์

### 6.1 หน้าแรก (News Portal)
- Hero: ข่าว/บทความเด่น (featured) แบบ carousel หรือ grid
- แถบสถิติชุมชน: จำนวนสมาชิก, กระทู้, ออนไลน์ (จากดีไซน์ community_1)
- คอลัมน์กระทู้ล่าสุด + sidebar (สมาชิกเด่น, แท็กยอดนิยม, กิจกรรมใกล้ถึง)
- กรองตามจังหวัดได้ (ปัตตานี/นราธิวาส/ยะลา/ทั้งหมด)
- Render แบบ **ISR** (revalidate ตามเวลา) เพื่อ SEO + ความสด

### 6.2 เว็บบอร์ด (Webboard)
- หมวดหมู่ (categories) เช่น พูดคุยทั่วไป, วัฒนธรรม, การศึกษา, ท่องเที่ยว, ซื้อขาย
- สร้างกระทู้: title, เนื้อหา (rich text/markdown), รูปแนบ, แท็ก, จังหวัด
- ตอบกลับแบบ thread, กดไลก์/reaction, ปักหมุด (pin) โดย mod
- นับ view, reply, like; เรียงตามล่าสุด/ยอดนิยม
- สิทธิ์การโพสต์ผูกกับ membership level (เช่น ระดับต่ำสุดโพสต์ได้, แนบไฟล์ต้องถึงระดับหนึ่ง)

### 6.3 ระบบข่าวสาร (News)
- ข่าวมีสถานะ draft → pending → published (workflow อนุมัติ)
- เฉพาะ role `editor`/`admin` หรือสมาชิก level สูงที่ได้รับสิทธิ์เท่านั้นที่เผยแพร่ได้
- หมวดข่าว, จังหวัด, รูปปก, ผู้เขียน, จำนวนเข้าชม

### 6.4 Direct Message
- รายการบทสนทนา (conversations) + กล่องแชท
- ส่งข้อความ realtime ผ่าน Supabase Realtime (postgres changes / broadcast)
- สถานะอ่าน/ยังไม่อ่าน, แนบรูป (ผ่าน Storage), แจ้งเตือนข้อความใหม่
- เห็นเฉพาะคู่สนทนา (บังคับด้วย RLS)

### 6.5 โปรไฟล์ & หอเกียรติยศ
- โปรไฟล์: avatar, bio, จังหวัด, level + progress bar, สถิติ (โพสต์/ไลก์/reputation), badge ที่ได้
- Achievement grid (จากดีไซน์ kawan3_5)
- Leaderboard จัดอันดับตาม point รวม/รายเดือน

### 6.6 การแจ้งเตือน
- ตอบกระทู้, mention, ข้อความใหม่, ได้ badge, เลื่อนระดับ
- realtime badge + หน้า /notifications

---

## 7. ระบบสมาชิกและ Level

### 7.1 ระดับสมาชิก (Membership Levels)

ใช้ระบบ **point/reputation สะสม** เลื่อนระดับอัตโนมัติ

| Level | ชื่อ | Point ขั้นต่ำ | สิทธิพิเศษ (ตัวอย่าง) |
|-------|------|--------------|----------------------|
| 1 | Bronze (สัมฤทธิ์) | 0 | โพสต์กระทู้/ตอบกลับ, ส่ง DM |
| 2 | Silver (เงิน) | 500 | แนบไฟล์, สร้างโพล, ตั้งรูปโปรไฟล์ GIF |
| 3 | Gold (ทอง) | 2,000 | ปักหมุดกระทู้ตนเอง, custom title |
| 4 | Platinum (แพลทินัม) | 5,000 | เสนอข่าว, badge พิเศษ, สิทธิ์ moderator-lite |

> ค่า point/threshold เก็บในตาราง `membership_levels` (config-driven) ปรับได้โดยไม่แก้โค้ด

### 7.2 การได้ point (ตัวอย่างกติกา)

| กิจกรรม | Point |
|---------|-------|
| สร้างกระทู้ | +10 |
| ตอบกระทู้ | +5 |
| กระทู้/ตอบได้รับ like | +2 ต่อ like |
| เข้าใช้งานรายวัน (streak) | +1 |
| ถูกรายงานและผิดจริง | -20 |

- คำนวณผ่าน **Postgres trigger/function** หรือ **Edge Function** เมื่อเกิด event
- ตาราง `point_transactions` เก็บ log ทุกครั้ง (auditable) แล้ว aggregate ไปที่ `profiles.reputation`

### 7.3 Role vs Level (แยกแนวคิด)

- **Level** = สถานะจากการมีส่วนร่วม (gamification)
- **Role** = สิทธิ์เชิงระบบ: `member`, `moderator`, `editor`, `admin` (ควบคุม authorization จริง)
- ทั้งสองเก็บคนละ field; RLS อ้างอิง role เป็นหลักสำหรับงาน sensitive

---

## 8. Database Schema

> Postgres บน Supabase. `auth.users` คือตารางของ Supabase Auth — เราขยายด้วยตาราง `profiles` (1:1)

### 8.1 ตารางหลัก

```sql
-- ========== จังหวัด (รองรับเพิ่มในอนาคต) ==========
create table public.provinces (
  id          smallserial primary key,
  name_th     text not null,
  name_en     text,
  slug        text unique not null,
  is_active   boolean default true,
  created_at  timestamptz default now()
);
-- seed: ปัตตานี, นราธิวาส, ยะลา

-- ========== ระดับสมาชิก (config) ==========
create table public.membership_levels (
  id           smallint primary key,         -- 1..4
  name_th      text not null,                -- สัมฤทธิ์/เงิน/ทอง/แพลทินัม
  name_en      text not null,                -- Bronze/Silver/Gold/Platinum
  min_points   integer not null,
  perks        jsonb default '{}'::jsonb
);

-- ========== โปรไฟล์ (ขยาย auth.users) ==========
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  province_id  smallint references public.provinces(id),
  role         text not null default 'member'
                 check (role in ('member','moderator','editor','admin')),
  reputation   integer not null default 0,
  level_id     smallint not null default 1 references public.membership_levels(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ========== หมวดหมู่เว็บบอร์ด ==========
create table public.categories (
  id          serial primary key,
  name_th     text not null,
  slug        text unique not null,
  description text,
  icon        text,
  sort_order  smallint default 0,
  is_active   boolean default true
);

-- ========== กระทู้ ==========
create table public.threads (
  id           bigserial primary key,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  category_id  integer not null references public.categories(id),
  province_id  smallint references public.provinces(id),
  title        text not null,
  body         text not null,             -- markdown
  is_pinned    boolean default false,
  is_locked    boolean default false,
  view_count   integer default 0,
  reply_count  integer default 0,         -- denormalized
  like_count   integer default 0,         -- denormalized
  status       text default 'published'
                 check (status in ('published','hidden','deleted')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index on public.threads (category_id, created_at desc);
create index on public.threads (province_id, created_at desc);

-- ========== ความเห็น/ตอบกลับ ==========
create table public.posts (
  id           bigserial primary key,
  thread_id    bigint not null references public.threads(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  body         text not null,
  parent_id    bigint references public.posts(id),  -- nested reply (optional)
  like_count   integer default 0,
  status       text default 'published'
                 check (status in ('published','hidden','deleted')),
  created_at   timestamptz default now()
);
create index on public.posts (thread_id, created_at);

-- ========== reaction / like (polymorphic) ==========
create table public.reactions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('thread','post','news')),
  target_id   bigint not null,
  type        text not null default 'like',
  created_at  timestamptz default now(),
  unique (user_id, target_type, target_id, type)
);

-- ========== ข่าวสาร ==========
create table public.news (
  id           bigserial primary key,
  author_id    uuid not null references public.profiles(id),
  province_id  smallint references public.provinces(id),
  category     text,                         -- ข่าว/กิจกรรม/วัฒนธรรม
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
create index on public.news (status, published_at desc);

-- ========== Badge / Achievement ==========
create table public.badges (
  id          serial primary key,
  code        text unique not null,
  name_th     text not null,
  description text,
  icon        text,
  criteria    jsonb                          -- เงื่อนไขได้รับ
);
create table public.user_badges (
  user_id    uuid references public.profiles(id) on delete cascade,
  badge_id   integer references public.badges(id),
  earned_at  timestamptz default now(),
  primary key (user_id, badge_id)
);

-- ========== Point log ==========
create table public.point_transactions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,
  reason      text not null,                 -- 'thread_create','post_like',...
  ref_type    text,
  ref_id      bigint,
  created_at  timestamptz default now()
);
create index on public.point_transactions (user_id, created_at desc);

-- ========== Direct Message ==========
create table public.conversations (
  id          bigserial primary key,
  created_at  timestamptz default now(),
  last_message_at timestamptz default now()
);
create table public.conversation_members (
  conversation_id bigint references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  last_read_at    timestamptz default now(),
  primary key (conversation_id, user_id)
);
create table public.messages (
  id              bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text,
  attachment_url  text,
  created_at      timestamptz default now()
);
create index on public.messages (conversation_id, created_at);

-- ========== การแจ้งเตือน ==========
create table public.notifications (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,                 -- reply/mention/dm/badge/level_up
  payload     jsonb,
  is_read     boolean default false,
  created_at  timestamptz default now()
);
create index on public.notifications (user_id, is_read, created_at desc);

-- ========== รายงานเนื้อหา (moderation) ==========
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
```

### 8.2 Trigger สำคัญ (ตัวอย่าง)

```sql
-- สร้าง profile อัตโนมัติเมื่อสมัครสมาชิก
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text,8)),
          new.raw_user_meta_data->>'display_name');
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- เมื่อมี point_transaction ใหม่ → อัปเดต reputation + เลื่อน level
create function public.apply_point_transaction() returns trigger
language plpgsql security definer set search_path = public as $$
declare new_rep integer; new_level smallint;
begin
  update public.profiles
    set reputation = reputation + new.amount, updated_at = now()
    where id = new.user_id
    returning reputation into new_rep;
  select id into new_level from public.membership_levels
    where min_points <= new_rep order by min_points desc limit 1;
  update public.profiles set level_id = new_level
    where id = new.user_id and level_id <> new_level;
  return new;
end; $$;
create trigger on_point_tx
  after insert on public.point_transactions
  for each row execute function public.apply_point_transaction();
```

> reply_count / like_count ใช้ trigger denormalize เพื่อหลีกเลี่ยง count ทุกครั้งที่ query

---

## 9. Row Level Security & ความปลอดภัย

เปิด RLS ทุกตารางที่มีข้อมูลผู้ใช้ แล้วเขียน policy ตามหลัก least-privilege

### 9.1 ตัวอย่าง Policy

```sql
alter table public.profiles enable row level security;

-- โปรไฟล์: ทุกคนอ่านได้, แก้ได้เฉพาะของตัวเอง
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- กระทู้: อ่านได้ถ้า published; สร้างได้ถ้า login; แก้/ลบเฉพาะเจ้าของหรือ mod
alter table public.threads enable row level security;
create policy "threads_select" on public.threads
  for select using (status = 'published' or author_id = auth.uid()
                    or public.is_staff(auth.uid()));
create policy "threads_insert" on public.threads
  for insert with check (auth.uid() = author_id);
create policy "threads_update_own_or_staff" on public.threads
  for update using (auth.uid() = author_id or public.is_staff(auth.uid()));

-- DM: เห็น/ส่งได้เฉพาะสมาชิกในห้องสนทนา
alter table public.messages enable row level security;
create policy "messages_select_member" on public.messages
  for select using (exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id
      and m.user_id = auth.uid()));
create policy "messages_insert_member" on public.messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id
        and m.user_id = auth.uid()));

-- helper: ตรวจ staff
create function public.is_staff(uid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = uid and role in ('moderator','editor','admin'));
$$;
```

### 9.2 มาตรการความปลอดภัยอื่น

- **Sanitize user content**: เนื้อหา markdown → render ผ่าน sanitizer (เช่น rehype-sanitize) กัน XSS
- **Service role**: ใช้เฉพาะใน server action/edge function ที่ต้อง bypass RLS (เช่น admin task) — ไม่ส่งไป client
- **Rate limiting**: จำกัดการโพสต์/ส่ง DM (ผ่าน middleware หรือ edge function + ตารางนับ)
- **Validation**: ตรวจ input ทั้งฝั่ง client (zod) และ DB constraint
- **Storage policy**: จำกัดขนาด/ชนิดไฟล์, path ผูกกับ user id
- **Audit**: point_transactions, reports เก็บ log ตรวจสอบได้

---

## 10. Supabase Storage

| Bucket | Public? | ใช้เก็บ | Policy |
|--------|---------|---------|--------|
| `avatars` | public-read | รูปโปรไฟล์ | เขียนได้เฉพาะ path `=auth.uid()/...` |
| `thread-images` | public-read | รูปแนบกระทู้ | เขียนเมื่อ login, path ผูก user id |
| `news-covers` | public-read | รูปปกข่าว | เขียนเฉพาะ editor/admin |
| `dm-attachments` | private | ไฟล์แนบ DM | อ่าน/เขียนเฉพาะสมาชิกห้อง (signed URL) |

ตัวอย่าง policy avatars:
```sql
create policy "avatar_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);
```

- รูปทั่วไปเสิร์ฟผ่าน Supabase CDN; แปลงขนาด (image transformation) ลด bandwidth
- ไฟล์ DM ใช้ **signed URL** อายุสั้น เพราะเป็น private

---

## 11. Realtime & Direct Message

### กลไก
- ใช้ **Supabase Realtime** subscribe การเปลี่ยนแปลงตาราง `messages` (เฉพาะ conversation ที่ผู้ใช้เป็นสมาชิก) — RLS คุมว่า client เห็น event ไหน
- เมื่อมีข้อความใหม่ → trigger อัปเดต `conversations.last_message_at` + สร้าง `notifications`
- สถานะอ่าน: อัปเดต `conversation_members.last_read_at`; นับ unread = messages ที่ใหม่กว่า last_read_at

### Flow การเริ่มแชท
1. ผู้ใช้ A กดส่งข้อความหา B → server action หา/สร้าง conversation ระหว่าง A,B (ป้องกันซ้ำ)
2. insert message → realtime ส่งถึง B ทันที
3. B ได้ notification + badge unread

### พิจารณาเพิ่ม (อนาคต)
- typing indicator (Realtime broadcast)
- online presence (Realtime presence)
- block / report ผู้ใช้

---

## 12. โครงสร้างโปรเจกต์ Next.js

```
kawan2/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # หน้าแรก (ISR)
│   │   ├── news/[slug]/page.tsx
│   │   ├── board/[category]/page.tsx
│   │   ├── board/thread/[id]/page.tsx
│   │   ├── u/[username]/page.tsx
│   │   └── leaderboard/page.tsx
│   ├── (app)/                        # ต้อง login
│   │   ├── messages/...
│   │   ├── notifications/page.tsx
│   │   └── me/page.tsx
│   ├── admin/...
│   ├── auth/...                      # login/signup/callback
│   └── api/                          # route handlers (webhook ฯลฯ)
├── components/
│   ├── ui/                           # ปุ่ม การ์ด chip (ตาม design tokens)
│   ├── board/  news/  messages/  profile/
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # browser client
│   │   ├── server.ts                 # server component client
│   │   └── middleware.ts             # refresh session
│   ├── auth.ts  points.ts  validators.ts (zod)
├── supabase/
│   ├── migrations/                   # SQL schema + RLS
│   ├── functions/                    # edge functions
│   └── seed.sql                      # provinces, levels, categories
├── middleware.ts
├── tailwind.config.ts                # นำ tokens จาก DESIGN.md มาใส่
└── .env.local                        # SUPABASE_URL, ANON_KEY (+ SERVICE_ROLE server)
```

- นำ color/typography/spacing tokens จาก `DESIGN.md` มาใส่ `tailwind.config.ts` ให้ตรงกัน
- แปลง HTML ดีไซน์ (`design/kawan3_*`) เป็น React component ทีละหน้า

---

## 13. แผนการพัฒนา (Roadmap)

### Phase 0 — เตรียมความพร้อม (สัปดาห์ 1)
- ตั้งโปรเจกต์ Supabase + Next.js, เชื่อม `@supabase/ssr`
- ตั้ง Tailwind config ตาม design tokens, สร้าง UI primitives (ปุ่ม/การ์ด/chip/badge)
- เขียน migration: provinces, membership_levels, profiles, categories + seed
- ตั้ง CI/CD (Vercel) + ตัวแปรสภาพแวดล้อม

### Phase 1 — MVP แกนหลัก (สัปดาห์ 2–4)
- **Auth**: สมัคร/เข้าสู่ระบบ (email + OAuth), trigger สร้าง profile, หน้าโปรไฟล์
- **เว็บบอร์ด**: หมวดหมู่, สร้าง/อ่าน/ตอบกระทู้, like, RLS ครบ
- **หน้าแรก + ข่าว**: แสดงข่าว featured + กระทู้ล่าสุด (ISR), หน้ารายละเอียดข่าว
- **ระบบ point/level พื้นฐาน**: trigger คำนวณ reputation + เลื่อน level
- ✅ เป้าหมาย: ใช้งานชุมชนพื้นฐานได้จริง

### Phase 2 — สังคมและการมีส่วนร่วม (สัปดาห์ 5–7)
- **Direct Message** realtime + notifications
- **Badge/Achievement** + หน้า Leaderboard
- **กิจกรรม (Events)** + ปฏิทิน
- **การแจ้งเตือน** ครบ (reply/mention/dm/level-up)
- ระบบค้นหา (Postgres full-text หรือ extension)

### Phase 3 — ขยายและดูแล (สัปดาห์ 8+)
- **Admin dashboard**: จัดการ user/ข่าว/รายงาน/จังหวัด
- **Moderation**: report → review workflow
- **Marketplace** (ตลาดซื้อขาย)
- **เพิ่มจังหวัด** ใหม่ (เปิดผ่าน config)
- i18n (มลายู/อังกฤษ), dark mode, PWA, ปรับ performance/SEO

### สรุปลำดับความสำคัญ (MoSCoW)
- **Must**: Auth, profile+level, webboard, news homepage, RLS
- **Should**: DM, notifications, leaderboard, badge, search
- **Could**: events, admin tools, moderation
- **Won't (ตอนนี้)**: marketplace, มือถือ native, payment

---

## 14. ความเสี่ยงและข้อควรระวัง

| ความเสี่ยง | ผลกระทบ | แนวทางรับมือ |
|-----------|---------|--------------|
| RLS เขียนผิด → ข้อมูลรั่ว | สูง | เขียน test policy, review, default-deny |
| เนื้อหาอ่อนไหว/การเมืองในพื้นที่ | สูง | moderation + report + แนวทางชุมชนชัดเจน |
| XSS จาก user content | สูง | sanitize markdown ก่อน render |
| Realtime/DB cost พุ่งเมื่อโต | กลาง | denormalize counter, index, pagination, cache |
| Spam/abuse | กลาง | rate limit, ผูกสิทธิ์กับ level, captcha สมัคร |
| ฟอนต์ไทยแสดงผลเพี้ยน | กลาง | line-height ≥1.5, ทดสอบ Be Vietnam Pro + fallback ไทย |
| Vendor lock-in (Supabase) | ต่ำ-กลาง | ใช้ Postgres มาตรฐาน, schema portable |

> หมายเหตุด้านเนื้อหา: เนื่องจากเป็นชุมชนพื้นที่ชายแดนใต้ที่มีความอ่อนไหว ควรมี **แนวปฏิบัติชุมชน (community guidelines)** และทีม moderator ตั้งแต่เปิดตัว

---

## 15. ขั้นตอนถัดไป

1. ยืนยันขอบเขต MVP (Phase 1) และกติกา point/level ที่ต้องการ
2. ตั้งโปรเจกต์ Supabase + Next.js และนำ design tokens เข้า Tailwind
3. ลงมือเขียน migration ชุดแรก (provinces, levels, profiles, categories, threads, posts) + RLS
4. แปลงหน้าจอดีไซน์ (หน้าแรก, เว็บบอร์ด, โปรไฟล์) เป็น component
5. ทดสอบ auth flow + RLS ก่อนต่อยอดฟีเจอร์สังคม

หากต้องการ ผมช่วยต่อได้ในขั้น: **scaffold โปรเจกต์ Next.js + ไฟล์ migration SQL จริง**, **แปลง HTML ดีไซน์เป็น React component**, หรือ **เขียน RLS policy ครบทุกตารางพร้อม test**

---

*เอกสารนี้อ้างอิงดีไซน์จากโฟลเดอร์ `design/` (kawan3) ซึ่งปรับใช้ได้ตามความเหมาะสม*
