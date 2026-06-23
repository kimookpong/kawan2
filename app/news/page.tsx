import Link from "next/link";
import { Plus, CalendarDays, Eye, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";

export const revalidate = 60;

export const metadata = {
  title: "ข่าวสารภูมิภาค",
  description: "ข่าวสารและเรื่องเด่นของ 3 จังหวัดชายแดนใต้ — ปัตตานี นราธิวาส ยะลา",
};

export default async function NewsPage() {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, excerpt, cover_url, category, published_at, view_count, news_comments(count)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  const { data: { user } } = await supabase.auth.getUser();
  let canWrite = false;
  if (user) {
    const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    canWrite = p?.role === "editor" || p?.role === "admin";
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">ข่าวสารภูมิภาค</h1>
        {canWrite && (
          <Link href="/news/new" className="btn-accent inline-flex items-center gap-1">
            <Plus className="h-4 w-4" /> เขียนข่าว
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(news ?? []).map((n: any) => {
          const commentCount = n.news_comments?.[0]?.count ?? 0;
          return (
            <Link key={n.id} href={`/news/${n.slug}`} className="card flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={n.cover_url || NEWS_FALLBACK_IMG} alt="" className="h-40 w-full object-cover" />
                {n.category && (
                  <span className="chip absolute bottom-2 left-2 bg-primary text-on-primary shadow-sm">
                    {n.category}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-semibold text-on-surface">{n.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{n.excerpt}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-outline-variant pt-3 text-xs text-on-surface-variant">
                  {n.published_at && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(n.published_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {(n.view_count ?? 0).toLocaleString("th-TH")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {commentCount.toLocaleString("th-TH")}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
        {(!news || news.length === 0) && (
          <p className="text-sm text-on-surface-variant">ยังไม่มีข่าวที่เผยแพร่</p>
        )}
      </div>
    </div>
  );
}
