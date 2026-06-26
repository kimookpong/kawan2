import Link from "next/link";
import { Search, MessageCircle, Eye, Newspaper, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { LevelBadge } from "@/components/user-badges";
import { NEWS_FALLBACK_IMG, levelNameClass } from "@/lib/constants";

export const revalidate = 0;

export const metadata = {
  title: "ค้นหา",
  description: "ค้นหากระทู้ ข่าว และสมาชิกในชุมชนชายแดนใต้",
  robots: { index: false, follow: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();

  let threads: any[] = [];
  let news: any[] = [];
  let members: any[] = [];

  if (q) {
    const term = `%${q}%`;
    const [t, n, m] = await Promise.all([
      supabase
        .from("threads")
        .select(
          "id, title, reply_count, view_count, created_at, categories(name_th, slug)",
        )
        .eq("status", "published")
        .ilike("title", term)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("news")
        .select("id, title, slug, cover_url, category, published_at")
        .eq("status", "published")
        .ilike("title", term)
        .order("published_at", { ascending: false })
        .limit(12),
      supabase
        .from("profiles")
        .select(
          "username, display_name, avatar_url, level_id, role, reputation",
        )
        .or(`username.ilike.${term},display_name.ilike.${term}`)
        .order("reputation", { ascending: false })
        .limit(20),
    ]);
    threads = t.data ?? [];
    news = n.data ?? [];
    members = m.data ?? [];
  }

  const total = threads.length + news.length + members.length;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary sm:text-2xl">ค้นหา</h1>
        {q && (
          <p className="text-sm text-on-surface-variant">
            ผลการค้นหาสำหรับ “{q}” — พบ {total.toLocaleString("th-TH")} รายการ
          </p>
        )}
      </div>

      <form action="/search" method="get" className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ค้นหากระทู้ ข่าว หรือสมาชิก..."
          className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
        />
      </form>

      {!q && (
        <p className="card p-8 text-center text-sm text-on-surface-variant">
          พิมพ์คำค้นหาแล้วกด Enter เพื่อค้นหากระทู้ ข่าว และสมาชิก
        </p>
      )}

      {q && total === 0 && (
        <p className="card p-8 text-center text-sm text-on-surface-variant">
          ไม่พบผลลัพธ์สำหรับ “{q}”
        </p>
      )}

      {/* กระทู้ */}
      {threads.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-on-surface">
            <MessageCircle className="h-5 w-5 text-primary" /> กระทู้ (
            {threads.length})
          </h2>
          <div className="card divide-y divide-outline-variant">
            {threads.map((t) => (
              <Link
                key={t.id}
                href={`/board/thread/${t.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {t.categories && (
                      <span className="chip bg-primary-container/10 text-primary">
                        {t.categories.name_th}
                      </span>
                    )}
                    <p className="truncate font-medium text-on-surface">
                      {t.title}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {t.reply_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {t.view_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ข่าว */}
      {news.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-on-surface">
            <Newspaper className="h-5 w-5 text-primary" /> ข่าว ({news.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <Link
                key={n.id}
                href={`/news/${n.slug}`}
                className="card flex gap-3 overflow-hidden p-2 hover:shadow-card"
              >
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.cover_url || NEWS_FALLBACK_IMG}
                    alt=""
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  {n.category && (
                    <span className="chip mb-0.5 bg-primary-container/10 text-primary">
                      {n.category}
                    </span>
                  )}
                  <h3 className="line-clamp-2 text-sm font-semibold text-on-surface">
                    {n.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* สมาชิก */}
      {members.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-on-surface">
            <Users className="h-5 w-5 text-primary" /> สมาชิก ({members.length})
          </h2>
          <div className="card divide-y divide-outline-variant">
            {members.map((p) => (
              <Link
                key={p.username}
                href={`/u/${p.username}`}
                className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-low"
              >
                <Avatar
                  src={p.avatar_url}
                  name={p.display_name || p.username}
                  role={p.role}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${levelNameClass(p.level_id)}`}>
                    {p.display_name || p.username}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs text-on-surface-variant">
                      @{p.username}
                    </span>
                    <LevelBadge levelId={p.level_id} />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">
                  {(p.reputation ?? 0).toLocaleString("th-TH")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
