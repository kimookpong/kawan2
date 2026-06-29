import Link from "next/link";
import {
  Plus,
  CalendarDays,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";

export const revalidate = 60;

const PAGE_SIZE = 9;

export const metadata = {
  title: "ข่าวสาร",
  description:
    "ข่าวสารและเรื่องเด่นของ 3 จังหวัดชายแดนใต้ — ปัตตานี นราธิวาส ยะลา",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: news, count } = await supabase
    .from("news")
    .select(
      "id, title, slug, excerpt, cover_url, category, published_at, view_count, news_comments(count)",
      { count: "exact" },
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => `/news${p > 1 ? `?page=${p}` : ""}`;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let canWrite = false;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    canWrite = p?.role === "editor" || p?.role === "admin";
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">ข่าวสาร</h1>
        {canWrite && (
          <div className="flex items-center gap-2">
            <Link
              href="/news/fetch"
              className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <Search className="h-4 w-4" /> ดึงข่าวออนไลน์
            </Link>
            <Link
              href="/news/new"
              className="btn-accent inline-flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> เขียนข่าว
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(news ?? []).map((n: any) => {
          const commentCount = n.news_comments?.[0]?.count ?? 0;
          return (
            <Link
              key={n.id}
              href={`/news/${n.slug}`}
              className="card flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={n.cover_url || NEWS_FALLBACK_IMG}
                  alt=""
                  className="h-40 w-full object-cover"
                />
                {n.category && (
                  <span className="chip absolute bottom-2 left-2 bg-primary text-on-primary shadow-sm">
                    {n.category}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-semibold text-on-surface">{n.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                  {n.excerpt}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-outline-variant pt-3 text-xs text-on-surface-variant">
                  {n.published_at && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(n.published_at).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />{" "}
                    {(n.view_count ?? 0).toLocaleString("th-TH")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />{" "}
                    {commentCount.toLocaleString("th-TH")}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
        {(!news || news.length === 0) && (
          <p className="text-sm text-on-surface-variant">
            ยังไม่มีข่าวที่เผยแพร่
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 pt-2">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low"
            >
              <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant opacity-40">
              <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </span>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
            )
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-on-surface-variant">…</span>
                )}
                {p === page ? (
                  <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-primary px-2 text-sm font-bold text-on-primary">
                    {p}
                  </span>
                ) : (
                  <Link
                    href={pageHref(p)}
                    className="grid h-9 min-w-9 place-items-center rounded-lg border border-outline-variant px-2 text-sm text-on-surface-variant hover:bg-surface-container-low"
                  >
                    {p}
                  </Link>
                )}
              </span>
            ))}

          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low"
            >
              ถัดไป <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant opacity-40">
              ถัดไป <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
