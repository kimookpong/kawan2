# Kawan2 — ระบบ Subscription ด้วย Stripe

ระบบสมาชิกแบบเสียเงิน 2 ระดับ — **Supporter (฿49/เดือน)** และ **Patron (฿149/เดือน)** ผ่าน Stripe Checkout (subscription)

---

## สถาปัตยกรรม (flow)

```
ผู้ใช้กด "สมัคร"  ─▶  server action subscribe()
                       • หา/สร้าง Stripe customer ผูกกับ user
                       • สร้าง Checkout Session (mode=subscription)
                       └─▶ redirect ไปหน้าจ่ายเงินของ Stripe
                                   │ ผู้ใช้จ่ายเงินสำเร็จ
                                   ▼
Stripe  ─ webhook ─▶  /api/stripe/webhook
                       • verify signature
                       • customer.subscription.created/updated/deleted
                       • อัปเดต public.subscriptions (service role)
                       • อัปเดต profiles.membership_tier + membership_until
                                   │
                                   ▼
หน้า /membership อ่าน membership_tier มาแสดงสถานะ + ปุ่ม "จัดการการสมัคร"
(Stripe Customer Portal สำหรับยกเลิก/เปลี่ยนบัตร)
```

หลักการ: **Stripe เป็น source of truth** ของสถานะการจ่ายเงิน, DB sync ตามผ่าน webhook เท่านั้น (เขียนด้วย service role ไม่ผ่าน RLS) — frontend ไม่เคยตัดสินใจสิทธิ์เอง

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|------|---------|
| `lib/stripe.ts` | Stripe server client + map tier↔price |
| `lib/supabase/admin.ts` | service-role client (ใช้ใน webhook) |
| `app/membership/actions.ts` | `subscribe()` สร้าง Checkout, `openBillingPortal()` |
| `app/membership/page.tsx` | หน้าแสดงแพ็กเกจ + สถานะสมาชิก |
| `app/api/stripe/webhook/route.ts` | รับ event จาก Stripe → sync DB |
| `supabase/migrations/0007_subscriptions.sql` | ตาราง subscriptions + คอลัมน์ membership |

DB ที่เพิ่ม: `profiles.stripe_customer_id`, `profiles.membership_tier` (free/supporter/patron), `profiles.membership_until`, ตาราง `public.subscriptions` — **migration นี้ apply เข้า DB จริงแล้ว**

---

## ขั้นตอนตั้งค่า

### 1) สร้าง Product/Price ใน Stripe
Stripe Dashboard → Products → สร้าง 2 รายการ (recurring, รายเดือน, สกุลเงิน THB):
- **Supporter** ฿49/เดือน → คัดลอก Price ID (`price_...`)
- **Patron** ฿149/เดือน → คัดลอก Price ID

### 2) ใส่ค่าใน `.env.local`
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SUPPORTER=price_...
STRIPE_PRICE_PATRON=price_...
```
> `SUPABASE_SERVICE_ROLE_KEY` ต้องมีด้วย (webhook ใช้เขียน DB) — เอาจาก Supabase > Settings > API (คีย์ `sb_secret_...`)

### 3) ตั้ง Webhook endpoint
- **ตอน dev:** ใช้ Stripe CLI
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
  คัดลอก `whsec_...` ที่ CLI แสดงมาใส่ `STRIPE_WEBHOOK_SECRET`
- **ตอน production:** Dashboard → Webhooks → Add endpoint
  - URL: `https://<โดเมน>/api/stripe/webhook`
  - เลือก events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 4) เปิด Customer Portal
Stripe Dashboard → Settings → Billing → Customer portal → เปิดใช้งาน (ปุ่ม "จัดการการสมัคร" จะพาไปที่นี่)

### 5) ทดสอบ
`npm run dev` → เข้า `/membership` → กดสมัคร → ใช้บัตรทดสอบ `4242 4242 4242 4242` (วันหมดอายุอนาคต, CVC อะไรก็ได้)

---

## หมายเหตุสำคัญ

- **PromptPay กับ subscription:** Stripe รองรับ PromptPay เฉพาะการจ่าย **ครั้งเดียว (one-time)** เท่านั้น — การ **เก็บเงินอัตโนมัติรายเดือน (recurring)** ของ Stripe รองรับเฉพาะ **บัตรเครดิต/เดบิต** ถ้าต้องการรับ PromptPay สำหรับสมาชิกรายเดือนจริงๆ ทางเลือกคือ:
  1. ขายเป็นแพ็กเกจครั้งเดียว (เช่น 30/90 วัน) ด้วย PromptPay แล้วต่ออายุเอง หรือ
  2. ใช้ผู้ให้บริการในไทย (Omise/GBPrimePay) สำหรับ recurring PromptPay
  ปุ่มที่เขียนตอนนี้ใช้ Checkout แบบบัตรสำหรับ recurring — ข้อความ "ชำระผ่าน Stripe / PromptPay" เป็น UI ปรับได้ตามที่จะรองรับจริง
- **การให้สิทธิพิเศษ (ปิดโฆษณา/EXP x2 ฯลฯ):** อ่านจาก `profiles.membership_tier` ไปบังคับใน logic ของแอป (ยังไม่ผูกกับ EXP/ads เพราะระบบเหล่านั้นยังไม่ถูกสร้าง) — เมื่อทำระบบ EXP/โฆษณา ค่อยเช็ค tier ตรงนั้น
- **ความปลอดภัย:** webhook verify ลายเซ็นทุกครั้ง, เขียน DB ด้วย service role ฝั่ง server เท่านั้น, `STRIPE_SECRET_KEY`/`SERVICE_ROLE_KEY` ไม่ถูก expose ไป client
