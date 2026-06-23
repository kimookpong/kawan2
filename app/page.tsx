import Link from "next/link";
import {
  MapPin,
  Pin,
  ArrowRight,
  Flame,
  MessageCircle,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";
import { BannerCarousel, type Banner } from "@/components/home/banner-carousel";
import { ThreadListItem } from "@/components/board/thread-list-item";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/json-ld";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.vercel.app";

export const revalidate = 60; // ISR

export default async function HomePage() {
  const supabase = createClient();

  const [
    { data: featuredArr },
    { data: news },
    { count: memberCount },
    { count: threadCount },
    { count: postCount },
    { data: categories },
    { data: recentThreads },
    { data: popular },
    { data: topMembers },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("news")
      .select("id, title, slug, excerpt, cover_url, category, published_at")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(1),
    supabase
      .from("news")
      .select("id, title, slug, excerpt, cover_url, category, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(8),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("threads").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("categories")
      .select("id, name_th, slug, icon")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("threads")
      .select(
        "id, title, category_id, reply_count, like_count, view_count, created_at, is_pinned, profiles(username, display_name, level_id, role, avatar_url), categories(name_th, slug)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("threads")
      .select(
        "id, title, like_count, reply_count, view_count, created_at, profiles(username, display_name, level_id, role, avatar_url), categories(name_th, slug)",
      )
      .eq("status", "published")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("like_count", { ascending: false })
      .order("view_count", { ascending: false })
      .limit(10),
    supabase
      .from("weekly_top_members")
      .select(
        "username, display_name, level_id, role, avatar_url, weekly_points",
      )
      .order("weekly_points", { ascending: false })
      .limit(10),
    supabase
      .from("events")
      .select("id, title, location, cover_url, starts_at, provinces(name_th)")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(4),
  ]);

  const featured = featuredArr?.[0];
  // ข่าวที่เหลือ (ไม่รวม featured) สำหรับการ์ดเล็ก
  const otherNews = (news ?? [])
    .filter((n: any) => n.id !== featured?.id)
    .slice(0, 7);
  const hero = featured ?? (news ?? [])[0];

  // จัดกลุ่มกระทู้ตามหมวด สำหรับกล่องเว็บบอร์ด (เรียงปักหมุดขึ้นก่อน)
  const threadsByCat = new Map<number, any[]>();
  (recentThreads ?? [])
    .slice()
    .sort((a: any, b: any) => Number(b.is_pinned) - Number(a.is_pinned))
    .forEach((t: any) => {
      const arr = threadsByCat.get(t.category_id) ?? [];
      if (arr.length < 5) arr.push(t);
      threadsByCat.set(t.category_id, arr);
    });

  // สไลด์ banner carousel
  const banners: Banner[] = [
    {
      id: "welcome",
      eyebrow: "ยินดีต้อนรับ",
      title: "ชุมชนของชาวชายแดนใต้ — ปัตตานี นราธิวาส ยะลา",
      subtitle: "ข่าวสาร กระดานสนทนา และพื้นที่แลกเปลี่ยนของคนในพื้นที่",
      cta: { label: "เข้าร่วมสนทนา", href: "/board" },
      theme: "green",
      image: hero?.cover_url ?? null,
    },
    ...(hero
      ? [
          {
            id: "news",
            eyebrow: hero.category ?? "ข่าวเด่น",
            title: hero.title,
            subtitle: hero.excerpt ?? undefined,
            cta: { label: "อ่านต่อ", href: `/news/${hero.slug}` },
            theme: "dark" as const,
            image: hero.cover_url,
          } as Banner,
        ]
      : []),
    {
      id: "membership",
      eyebrow: "JOIN · MEMBERSHIP",
      title: "ร่วมสนับสนุนค่าเซิฟเวอร์",
      subtitle: `ปัจจุบันมีสมาชิก ${(memberCount ?? 0).toLocaleString("th-TH")} คน · ${(threadCount ?? 0).toLocaleString("th-TH")} กระทู้ · ${(postCount ?? 0).toLocaleString("th-TH")} ความเห็น`,
      cta: { label: "ดูแพ็กเกจสนับสนุน", href: "/membership" },
      theme: "amber",
    },
  ];

  return (
    <div className="w-full space-y-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE}/#organization`,
              name: "Kawan2",
              url: SITE,
              logo: `${SITE}/image.png`,
            },
            {
              "@type": "WebSite",
              "@id": `${SITE}/#website`,
              name: "Kawan2",
              url: SITE,
              inLanguage: "th-TH",
              publisher: { "@id": `${SITE}/#organization` },
            },
          ],
        }}
      />

      {/* ===== 1) Banner carousel ===== */}
      <BannerCarousel banners={banners} />

      {/* ===== 2) News grid ===== */}
      {hero && (
        <section>
          <SectionHead title="ข่าวสารและเรื่องเด่น" href="/news" />
          <div className="grid gap-4 lg:grid-cols-3">
            {/* hero ใหญ่ (สูงคงที่) */}
            <Link
              href={`/news/${hero.slug}`}
              className="group relative h-[300px] overflow-hidden rounded-xl bg-primary text-on-primary sm:h-[380px] lg:col-span-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.cover_url || NEWS_FALLBACK_IMG}
                alt=""
                className="h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-primary via-primary/50 to-transparent p-6">
                {hero.category && (
                  <span className="chip mb-2 w-fit bg-tertiary-container text-on-tertiary">
                    {hero.category}
                  </span>
                )}
                <h2 className="text-xl font-bold leading-snug md:text-2xl">
                  {hero.title}
                </h2>
                <p className="mt-1 line-clamp-2 max-w-xl text-sm text-on-primary/80">
                  {hero.excerpt}
                </p>
              </div>
            </Link>

            {/* คอลัมน์ข่าวเล็กด้านขวา */}
            <div className="flex flex-col gap-3">
              {otherNews.slice(0, 3).map((n: any) => (
                <NewsMini key={n.id} n={n} />
              ))}
              {otherNews.length === 0 && (
                <div className="card flex flex-1 items-center justify-center p-6 text-sm text-on-surface-variant">
                  ยังไม่มีข่าวอื่น
                </div>
              )}
            </div>
          </div>

          {/* แถวข่าวเพิ่ม */}
          {otherNews.length > 3 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {otherNews.slice(3, 7).map((n: any) => (
                <NewsCardSmall key={n.id} n={n} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== 3) กิจกรรมที่กำลังจะถึง ===== */}
      <section>
        <SectionHead title="กิจกรรมที่กำลังจะถึง" href="/events" />
        {events && events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((e: any) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-on-surface-variant">
            ยังไม่มีกิจกรรมที่กำลังจะถึง
          </div>
        )}
      </section>

      {/* ===== 4) ห้องสนทนาแยกหมวด ===== */}
      <section>
        <SectionHead title="ห้องสนทนา" href="/board" />
        <div className="grid gap-4 lg:grid-cols-2">
          {(categories ?? []).map((c: any) => {
            const list = threadsByCat.get(c.id) ?? [];
            return (
              <div key={c.id} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-2.5">
                  <Link
                    href={`/board/${c.slug}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {c.name_th}
                  </Link>
                  <Link
                    href={`/board/${c.slug}`}
                    className="text-xs text-primary hover:underline"
                  >
                    ดูทั้งหมด →
                  </Link>
                </div>
                <div className="divide-y divide-outline-variant">
                  {list.length > 0 ? (
                    list.map((t: any) => (
                      <ThreadListItem key={t.id} t={t} hideCategory />
                    ))
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
                      ยังไม่มีกระทู้ในหมวดนี้
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 5) กระทู้ยอดนิยม + สมาชิกเด่น ===== */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHead title="กระทู้ยอดนิยมประจำสัปดาห์" href="/board" />
          <div className="card divide-y divide-outline-variant">
            {(popular ?? []).length > 0 ? (
              (popular ?? []).map((t: any) => <PopularRow key={t.id} t={t} />)
            ) : (
              <p className="p-6 text-center text-sm text-on-surface-variant">
                ยังไม่มีกระทู้
              </p>
            )}
          </div>
        </div>

        <aside>
          <SectionHead title="สมาชิกเด่นประจำสัปดาห์" href="/members" />
          <div className="card divide-y divide-outline-variant">
            {(topMembers ?? []).length > 0 ? (
              (topMembers ?? []).map((m: any, i: number) => (
                <MemberRow key={m.username} m={m} rank={i + 1} />
              ))
            ) : (
              <p className="p-6 text-center text-sm text-on-surface-variant">
                ยังไม่มีสมาชิก
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

/* ---------- presentational ---------- */

/** การ์ดข่าวเล็กแนวนอน (thumbnail ซ้าย + หัวข้อขวา) สำหรับคอลัมน์ข้าง hero */
function NewsMini({ n }: { n: any }) {
  return (
    <Link
      href={`/news/${n.slug}`}
      className="card group flex flex-1 items-stretch gap-3 overflow-hidden p-2 transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="h-full min-h-[64px] w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={n.cover_url || NEWS_FALLBACK_IMG}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
        {n.category && (
          <span className="chip mb-1 w-fit bg-primary-container/10 text-primary">
            {n.category}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-on-surface">
          {n.title}
        </h3>
      </div>
    </Link>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between border-l-4 border-tertiary-container pl-3">
      <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        ดูทั้งหมด <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function NewsCardSmall({ n }: { n: any }) {
  return (
    <Link
      href={`/news/${n.slug}`}
      className="card group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="h-32 w-full overflow-hidden bg-surface-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={n.cover_url || NEWS_FALLBACK_IMG}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        {n.category && (
          <span className="chip bg-primary-container/10 text-primary">
            {n.category}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-on-surface">
          {n.title}
        </h3>
      </div>
    </Link>
  );
}

function EventCard({ e }: { e: any }) {
  const d = new Date(e.starts_at);
  return (
    <Link
      href="/events"
      className="card group flex overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="grid w-16 shrink-0 place-items-center bg-primary text-on-primary">
        <div className="text-center leading-none">
          <p className="text-xl font-bold">
            {d.toLocaleDateString("th-TH", { day: "numeric" })}
          </p>
          <p className="text-xs">
            {d.toLocaleDateString("th-TH", { month: "short" })}
          </p>
        </div>
      </div>
      <div className="min-w-0 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-on-surface">
          {e.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0" /> {e.location}
        </p>
        {e.provinces && (
          <span className="chip mt-1 bg-tertiary-container/10 text-tertiary-container">
            {e.provinces.name_th}
          </span>
        )}
      </div>
    </Link>
  );
}

function CategoryBox({ cat, threads }: { cat: any; threads: any[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-2.5">
        <Link
          href={`/board/${cat.slug}`}
          className="font-semibold text-primary hover:underline"
        >
          {cat.name_th}
        </Link>
        <span className="text-xs text-on-surface-variant">
          {threads.length} กระทู้ล่าสุด
        </span>
      </div>
      <div className="divide-y divide-outline-variant">
        {threads.length > 0 ? (
          threads.map((t) => {
            return (
              <Link
                key={t.id}
                href={`/board/thread/${t.id}`}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container-low"
              >
                {t.is_pinned && (
                  <Pin
                    className="h-4 w-4 shrink-0 text-tertiary-container"
                    aria-label="ปักหมุด"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-surface">
                    {t.title}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-on-surface-variant">
                    {t.profiles?.display_name || t.profiles?.username}
                    {t.profiles && <LevelBadge levelId={t.profiles.level_id} />}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-on-surface-variant">
                  <span className="block font-semibold text-on-surface">
                    {t.reply_count}
                  </span>
                  ตอบ
                </div>
              </Link>
            );
          })
        ) : (
          <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
            ยังไม่มีกระทู้
          </p>
        )}
      </div>
    </div>
  );
}

function PopularRow({ t }: { t: any }) {
  const author = t.profiles?.display_name || t.profiles?.username;
  const dateStr =
    t.created_at &&
    new Date(t.created_at).toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }) + " น.";
  return (
    <div className="flex items-center gap-3 p-4 hover:bg-surface-container-low">
      <Flame className="h-5 w-5 shrink-0 text-orange-500" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/board/thread/${t.id}`}
          className="block truncate text-on-surface hover:text-primary"
        >
          {t.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-on-surface-variant">
          {t.profiles ? (
            <Link
              href={`/u/${t.profiles.username}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {author}
            </Link>
          ) : (
            <span>ไม่ทราบผู้เขียน</span>
          )}
          {t.categories && (
            <>
              <span aria-hidden>·</span>
              <Link
                href={`/board/${t.categories.slug}`}
                className="hover:text-primary hover:underline"
              >
                {t.categories.name_th}
              </Link>
            </>
          )}
          {dateStr && (
            <>
              <span aria-hidden>·</span>
              <span>{dateStr}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" /> {t.reply_count}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="h-4 w-4" /> {t.view_count}
        </span>
      </div>
    </div>
  );
}

function MemberRow({ m, rank }: { m: any; rank: number }) {
  return (
    <Link
      href={`/u/${m.username}`}
      className="flex items-center gap-3 p-3 hover:bg-surface-container-low"
    >
      <span
        className={`w-5 text-center text-sm font-bold ${rank <= 3 ? "text-tertiary-container" : "text-outline"}`}
      >
        {rank}
      </span>
      <Avatar
        src={m.avatar_url}
        name={m.display_name || m.username}
        role={m.role}
        size={32}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {m.display_name || m.username}
        </p>
        <LevelBadge levelId={m.level_id} />
      </div>
      <span className="shrink-0 text-right text-sm font-bold text-primary">
        +{(m.weekly_points ?? 0).toLocaleString("th-TH")}
        <span className="block text-[10px] font-normal text-on-surface-variant">
          สัปดาห์นี้
        </span>
      </span>
    </Link>
  );
}
