import Link from "next/link";
import { MapPin, Pin, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProvinceFilter } from "@/components/province-filter";
import { LEVEL_STYLES } from "@/lib/constants";

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
    supabase.from("news").select("id, title, slug, excerpt, cover_url, category, published_at")
      .eq("status", "published").eq("is_featured", true).order("published_at", { ascending: false }).limit(1),
    supabase.from("news").select("id, title, slug, excerpt, cover_url, category, published_at")
      .eq("status", "published").order("published_at", { ascending: false }).limit(7),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("threads").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("id, name_th, slug, icon").eq("is_active", true).order("sort_order"),
    supabase.from("threads")
      .select("id, title, category_id, reply_count, like_count, view_count, created_at, is_pinned, profiles(username, display_name, level_id)")
      .eq("status", "published").order("created_at", { ascending: false }).limit(60),
    supabase.from("threads")
      .select("id, title, like_count, reply_count, view_count, created_at, profiles(username, display_name, level_id), categories(name_th, slug)")
      .eq("status", "published").order("like_count", { ascending: false }).order("view_count", { ascending: false }).limit(6),
    supabase.from("profiles").select("username, display_name, reputation, level_id").order("reputation", { ascending: false }).limit(8),
    supabase.from("events").select("id, title, location, cover_url, starts_at, provinces(name_th)")
      .gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
  ]);

  const featured = featuredArr?.[0];
  // ข่าวที่เหลือ (ไม่รวม featured) สำหรับการ์ดเล็ก
  const otherNews = (news ?? []).filter((n: any) => n.id !== featured?.id).slice(0, 6);
  const hero = featured ?? (news ?? [])[0];

  // จัดกลุ่มกระทู้ตามหมวด สำหรับกล่องเว็บบอร์ด
  const threadsByCat = new Map<number, any[]>();
  (recentThreads ?? []).forEach((t: any) => {
    const arr = threadsByCat.get(t.category_id) ?? [];
    if (arr.length < 4) arr.push(t);
    threadsByCat.set(t.category_id, arr);
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* ===== 1) Stats strip ===== */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="สมาชิก" value={memberCount ?? 0} accent />
        <Stat label="กระทู้" value={threadCount ?? 0} />
        <Stat label="ความเห็น" value={postCount ?? 0} />
        <Stat label="จังหวัด" value={3} />
      </section>

      {/* ===== 2) News grid ===== */}
      {hero && (
        <section>
          <SectionHead title="ข่าวสารและเรื่องเด่น" href="/news" />
          <div className="grid gap-4 lg:grid-cols-3">
            {/* hero ใหญ่ */}
            <Link href={`/news/${hero.slug}`} className="group relative col-span-1 row-span-2 overflow-hidden rounded-lg bg-primary text-on-primary lg:col-span-2">
              {hero.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero.cover_url} alt="" className="h-56 w-full object-cover opacity-50 transition group-hover:scale-105 lg:h-full lg:min-h-[320px]" />
              )}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-primary/95 via-primary/40 to-transparent p-6">
                {hero.category && <span className="chip mb-2 w-fit bg-tertiary-container text-on-tertiary">{hero.category}</span>}
                <h2 className="text-xl font-bold leading-snug md:text-2xl">{hero.title}</h2>
                <p className="mt-1 line-clamp-2 max-w-xl text-sm text-on-primary/80">{hero.excerpt}</p>
              </div>
            </Link>

            {/* การ์ดข่าวเล็ก 2 อันแรกข้างๆ */}
            {otherNews.slice(0, 2).map((n: any) => (
              <NewsCardSmall key={n.id} n={n} />
            ))}
          </div>

          {/* แถวข่าวเพิ่ม */}
          {otherNews.length > 2 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {otherNews.slice(2, 6).map((n: any) => (
                <NewsCardSmall key={n.id} n={n} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== 3) Province filter + Events ===== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">เลือกพื้นที่ของคุณ</h2>
          <ProvinceFilter />
        </div>
        {events && events.length > 0 && (
          <div>
            <SectionHead title="กิจกรรมที่กำลังจะถึง" href="/events" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((e: any) => <EventCard key={e.id} e={e} />)}
            </div>
          </div>
        )}
      </section>

      {/* ===== 4) Webboard รายหมวด ===== */}
      <section>
        <SectionHead title="ห้องสนทนา" href="/board" />
        <div className="grid gap-4 lg:grid-cols-2">
          {(categories ?? []).map((c: any) => (
            <CategoryBox key={c.id} cat={c} threads={threadsByCat.get(c.id) ?? []} />
          ))}
        </div>
      </section>

      {/* ===== 5) กระทู้ยอดนิยม + สมาชิกเด่น ===== */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHead title="กระทู้ยอดนิยม" href="/board" />
          <div className="card divide-y divide-outline-variant">
            {(popular ?? []).length > 0 ? (
              (popular ?? []).map((t: any, i: number) => <PopularRow key={t.id} t={t} rank={i + 1} />)
            ) : (
              <p className="p-6 text-center text-sm text-on-surface-variant">ยังไม่มีกระทู้</p>
            )}
          </div>
        </div>

        <aside>
          <SectionHead title="สมาชิกเด่น" href="/leaderboard" />
          <div className="card divide-y divide-outline-variant">
            {(topMembers ?? []).length > 0 ? (
              (topMembers ?? []).map((m: any, i: number) => <MemberRow key={m.username} m={m} rank={i + 1} />)
            ) : (
              <p className="p-6 text-center text-sm text-on-surface-variant">ยังไม่มีสมาชิก</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

/* ---------- presentational ---------- */

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? "border-primary/30 bg-primary-container/5" : ""}`}>
      <p className="text-2xl font-bold text-primary">{value.toLocaleString("th-TH")}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between border-l-4 border-tertiary-container pl-3">
      <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        ดูทั้งหมด <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function NewsCardSmall({ n }: { n: any }) {
  return (
    <Link href={`/news/${n.slug}`} className="card group overflow-hidden transition hover:shadow-card">
      {n.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={n.cover_url} alt="" className="h-32 w-full object-cover transition group-hover:scale-105" />
      )}
      <div className="p-3">
        {n.category && <span className="chip bg-primary-container/10 text-primary">{n.category}</span>}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-on-surface">{n.title}</h3>
      </div>
    </Link>
  );
}

function EventCard({ e }: { e: any }) {
  const d = new Date(e.starts_at);
  return (
    <Link href="/events" className="card group flex overflow-hidden transition hover:shadow-card">
      <div className="grid w-16 shrink-0 place-items-center bg-primary text-on-primary">
        <div className="text-center leading-none">
          <p className="text-xl font-bold">{d.toLocaleDateString("th-TH", { day: "numeric" })}</p>
          <p className="text-xs">{d.toLocaleDateString("th-TH", { month: "short" })}</p>
        </div>
      </div>
      <div className="min-w-0 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-on-surface">{e.title}</h3>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0" /> {e.location}
        </p>
        {e.provinces && <span className="chip mt-1 bg-tertiary-container/10 text-tertiary-container">{e.provinces.name_th}</span>}
      </div>
    </Link>
  );
}

function CategoryBox({ cat, threads }: { cat: any; threads: any[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-2.5">
        <Link href={`/board/${cat.slug}`} className="font-semibold text-primary hover:underline">{cat.name_th}</Link>
        <span className="text-xs text-on-surface-variant">{threads.length} กระทู้ล่าสุด</span>
      </div>
      <div className="divide-y divide-outline-variant">
        {threads.length > 0 ? (
          threads.map((t) => {
            const lvl = LEVEL_STYLES[t.profiles?.level_id];
            return (
              <Link key={t.id} href={`/board/thread/${t.id}`} className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container-low">
                {t.is_pinned && <Pin className="h-4 w-4 shrink-0 text-tertiary-container" aria-label="ปักหมุด" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-surface">{t.title}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {t.profiles?.display_name || t.profiles?.username}
                    {lvl && <span className={`chip ml-1 ${lvl.cls}`}>{lvl.en}</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-on-surface-variant">
                  <span className="block font-semibold text-on-surface">{t.reply_count}</span>ตอบ
                </div>
              </Link>
            );
          })
        ) : (
          <p className="px-4 py-6 text-center text-sm text-on-surface-variant">ยังไม่มีกระทู้</p>
        )}
      </div>
    </div>
  );
}

function PopularRow({ t, rank }: { t: any; rank: number }) {
  const lvl = LEVEL_STYLES[t.profiles?.level_id];
  return (
    <Link href={`/board/thread/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-container-low">
      <span className={`w-6 text-center text-lg font-bold ${rank <= 3 ? "text-tertiary-container" : "text-outline"}`}>{rank}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          {t.categories && <span className="chip bg-primary-container/10 text-primary">{t.categories.name_th}</span>}
          {lvl && <span className={`chip ${lvl.cls}`}>{lvl.en}</span>}
        </div>
        <h3 className="mt-0.5 truncate font-medium text-on-surface">{t.title}</h3>
      </div>
      <div className="hidden shrink-0 gap-4 text-center text-xs text-on-surface-variant sm:flex">
        <span><b className="block text-on-surface">{t.like_count}</b>ไลก์</span>
        <span><b className="block text-on-surface">{t.reply_count}</b>ตอบ</span>
        <span><b className="block text-on-surface">{t.view_count}</b>อ่าน</span>
      </div>
    </Link>
  );
}

function MemberRow({ m, rank }: { m: any; rank: number }) {
  const lvl = LEVEL_STYLES[m.level_id];
  return (
    <Link href={`/u/${m.username}`} className="flex items-center gap-3 p-3 hover:bg-surface-container-low">
      <span className={`w-5 text-center text-sm font-bold ${rank <= 3 ? "text-tertiary-container" : "text-outline"}`}>{rank}</span>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-on-primary">
        {(m.display_name || m.username).charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{m.display_name || m.username}</p>
        {lvl && <span className={`chip ${lvl.cls}`}>{lvl.en}</span>}
      </div>
      <span className="shrink-0 text-sm font-bold text-primary">{m.reputation.toLocaleString("th-TH")}</span>
    </Link>
  );
}
