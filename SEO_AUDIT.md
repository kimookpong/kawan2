# รายงานประเมิน SEO & Social Sharing — kawan2

วันที่ประเมิน: 2026-06-23 · ขอบเขต: Next.js App Router (`app/`), การตั้งค่า metadata และการแชร์โซเชียล

## สรุปผู้บริหาร

ระบบยัง **ไม่พร้อมด้าน SEO** ในระดับพื้นฐาน ปัจจุบันมี metadata แบบคงที่เพียงชุดเดียวใน `app/layout.tsx` (title, description, icons) และทุกหน้าใช้ค่าเดียวกันหมด ทำให้หน้าเนื้อหาสำคัญ (ข่าว, กระทู้, โปรไฟล์, กิลด์) ไม่มี title/description เฉพาะตัว ไม่มีภาพพรีวิวเวลาแชร์ ไม่มี sitemap/robots และไม่มี structured data จุดแข็งที่มีอยู่คือ `lang="th"` ถูกตั้งไว้ และมี `NEXT_PUBLIC_SITE_URL` พร้อมใช้เป็น `metadataBase` ได้ทันที

ระดับความพร้อมโดยรวม: **2/10** — แก้ได้เร็วเพราะข้อมูลที่ต้องใช้ (title, excerpt, cover image, author) ถูกดึงในแต่ละหน้าอยู่แล้ว เพียงนำมาประกอบเป็น metadata

## สิ่งที่มีอยู่แล้ว

`app/layout.tsx` กำหนด `title`, `description`, `icons` แบบคงที่ และตั้ง `<html lang="th">` ส่วน `next.config.mjs` อนุญาต remote images จาก supabase/unsplash/google แล้ว และมี `NEXT_PUBLIC_SITE_URL=https://kawan2.vercel.app` ใน env

## ช่องว่างที่พบ (เรียงตามผลกระทบ)

| # | ช่องว่าง | ผลกระทบ | ระดับ |
|---|---------|---------|-------|
| 1 | ไม่มี `metadataBase` + ไม่มี Open Graph / Twitter Card ใน root | แชร์ทุกลิงก์บน Facebook/X/LINE ขึ้นพรีวิวเปล่า ไม่มีรูป ไม่มีหัวข้อ | P0 |
| 2 | ไม่มี `generateMetadata` ในหน้าใดเลย | ทุกหน้า (ข่าว/กระทู้/โปรไฟล์/กิลด์) แชร์ title+description ซ้ำกันหมด → Google มองเป็น duplicate, จัดอันดับเนื้อหาไม่ได้ | P0 |
| 3 | ไม่มี `sitemap.ts` | บอตค้นพบหน้าเนื้อหาช้า/ไม่ครบ โดยเฉพาะหน้า dynamic | P0 |
| 4 | ไม่มี `robots.ts` | ไม่มีสัญญาณ allow/disallow และไม่ได้ชี้ไป sitemap | P0 |
| 5 | ไม่มีภาพ OG (คงที่หรือ dynamic) | การแชร์ไม่มี thumbnail → อัตราการคลิกต่ำมาก | P0 |
| 6 | หน้าส่วนตัว/เครื่องมือไม่ถูก noindex | `messages`, `notifications`, `me`, `admin`, `auth`, `*/new` เสี่ยงถูก index ทั้งที่ไม่ควร | P1 |
| 7 | ข่าวสถานะ draft เห็นได้โดย editor แต่ไม่ถูก noindex | ร่างหลุดเข้า index ได้ | P1 |
| 8 | ไม่มี canonical (`alternates.canonical`) ต่อหน้า | เสี่ยง duplicate จาก query string/พารามิเตอร์ | P1 |
| 9 | ไม่มี structured data (JSON-LD) | พลาด rich result: ข่าว, breadcrumb, โปรไฟล์, ฟอรัม, search box | P2 |
| 10 | ไม่มีปุ่มแชร์โซเชียล (โดยเฉพาะ LINE) | กลุ่มเป้าหมายไทยแชร์ผ่าน LINE เป็นหลัก แต่ไม่มีช่องทาง | P2 |

## แผนแก้ไขแบบจัดลำดับ

### P0 — รากฐาน (ทำก่อน, ครอบทั้งเว็บทันที)

ปรับ `app/layout.tsx` ให้มี metadata รากฐาน:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.vercel.app"),
  title: { default: "Kawan2 | ชุมชนชายแดนใต้", template: "%s | Kawan2" },
  description: "ศูนย์กลางข่าวสาร กระดานสนทนา และชุมชนของ 3 จังหวัดชายแดนใต้ — ปัตตานี นราธิวาส ยะลา",
  applicationName: "Kawan2",
  openGraph: {
    type: "website", siteName: "Kawan2", locale: "th_TH",
    url: "/", images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};
```

เพิ่มไฟล์ระดับ root (App Router จะรับรู้อัตโนมัติ):
- `app/robots.ts` — allow ทั้งหมด ยกเว้น `/admin`, `/messages`, `/me`, `/notifications`, `/auth`, `/api` พร้อมชี้ `sitemap`
- `app/sitemap.ts` — รวมหน้าคงที่ + ดึง dynamic จาก `news` (published), `threads` (published), `guilds`, `categories` พร้อม `lastModified`
- `app/opengraph-image.tsx` หรือไฟล์ `public/og-default.png` ขนาด 1200×630 เป็นภาพ default

### P1 — metadata ต่อหน้า (เนื้อหาหลัก)

ใส่ `generateMetadata` ในแต่ละหน้า โดยใช้ข้อมูลที่ดึงอยู่แล้ว:

| หน้า | title | description | og:image | og:type |
|------|-------|-------------|----------|---------|
| `news/[slug]` | `news.title` | ตัดจาก `news.body` ~160 ตัว | `news.cover_url` | `article` |
| `board/thread/[id]` | `thread.title` | ตัดจาก `thread.body` | OG เปล่า/ภาพหมวด | `article` |
| `u/[username]` | `display_name (@username)` | `profile.bio` | `avatar_url` | `profile` |
| `guilds/[slug]` | `guild.name` | `guild.description` | `emblem_url` | `website` |
| `board/[category]`, `news`, `events`, `board`, `membership`, `members` | ชื่อหมวด/หน้า | คำอธิบายหน้า | default | `website` |

เพิ่ม noindex สำหรับหน้าส่วนตัว/เครื่องมือ และสำหรับข่าว draft:

```ts
// ใน generateMetadata ของ news/[slug]
robots: news.status === "published" ? undefined : { index: false, follow: false }
```

ตัวอย่าง `news/[slug]`:

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = createClient();
  const { data: n } = await supabase.from("news")
    .select("title, body, cover_url, category, status, published_at, profiles(display_name)")
    .eq("slug", params.slug).single();
  if (!n) return { title: "ไม่พบข่าว" };
  const desc = n.body?.replace(/\[[^\]]+\]/g, "").slice(0, 160);
  return {
    title: n.title, description: desc,
    alternates: { canonical: `/news/${params.slug}` },
    openGraph: { type: "article", title: n.title, description: desc,
      images: n.cover_url ? [n.cover_url] : undefined,
      publishedTime: n.published_at, section: n.category ?? undefined },
    twitter: { card: "summary_large_image", title: n.title, description: desc,
      images: n.cover_url ? [n.cover_url] : undefined },
    robots: n.status === "published" ? undefined : { index: false, follow: false },
  };
}
```

### P2 — Rich result + การแชร์โซเชียล

**Structured data (JSON-LD)** ฝังเป็น `<script type="application/ld+json">`:
- หน้าแรก: `Organization` + `WebSite` พร้อม `SearchAction` (ทำให้ขึ้นช่องค้นหาใต้ผลของ Google) ชี้ไป `/members?q=` หรือ search ของบอร์ด
- `news/[slug]`: `NewsArticle` (headline, image, datePublished, author)
- `board/thread/[id]`: `DiscussionForumPosting`
- `u/[username]`: `ProfilePage`
- ทุกหน้าที่มี breadcrumb: `BreadcrumbList` (หน้า news มี breadcrumb อยู่แล้ว ใช้ต่อยอดได้)

**ภาพ OG แบบ dynamic** — สร้าง `opengraph-image.tsx` ในโฟลเดอร์ `news/[slug]`, `u/[username]` ฯลฯ ด้วย `next/og` (`ImageResponse`) วาด title + cover/avatar เป็นภาพ 1200×630 อัตโนมัติ ทำให้ทุกการแชร์มีพรีวิวสวยโดยไม่ต้องทำภาพเอง

**ปุ่มแชร์ (สำคัญสำหรับตลาดไทย)**:
- **LINE** เป็นช่องทางหลักของกลุ่มเป้าหมาย → ปุ่ม `https://social-plugins.line.me/lineit/share?url=...`
- Facebook (`sharer.php?u=...`), X (`intent/tweet?...`)
- **Web Share API** (`navigator.share`) สำหรับมือถือ ให้แชร์เข้าแอปไหนก็ได้ในปุ่มเดียว
- หมายเหตุ: LINE/Facebook อ่าน OG tags ตอนแชร์ → ต้องทำ P0/P1 ให้เสร็จก่อนปุ่มแชร์จึงจะขึ้นพรีวิว

## ลำดับลงมือที่แนะนำ

1. P0 ทั้งหมด (layout metadata + robots + sitemap + og-default) — งานเล็ก ครอบทั้งเว็บ
2. `generateMetadata` หน้า `news/[slug]`, `board/thread/[id]`, `u/[username]`, `guilds/[slug]`
3. noindex หน้าส่วนตัว + canonical หน้า listing
4. JSON-LD + dynamic OG image + ปุ่มแชร์ LINE/Web Share

ข้อ 1–2 ให้ผลลัพธ์ด้าน SEO/แชร์ราว 80% ของทั้งหมด และใช้แรงน้อยที่สุด
