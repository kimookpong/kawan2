import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";

export const revalidate = 60;

export default async function NewsPage() {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, excerpt, cover_url, category, published_at")
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
        <h1 className="text-2xl font-bold text-primary">ข่าวสารภูมิภาค</h1>
        {canWrite && (
          <Link href="/news/new" className="btn-accent inline-flex items-center gap-1">
            <Plus className="h-4 w-4" /> เขียนข่าว
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(news ?? []).map((n) => (
          <Link key={n.id} href={`/news/${n.slug}`} className="card overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.cover_url || NEWS_FALLBACK_IMG} alt="" className="h-40 w-full object-cover" />
            <div className="p-4">
              {n.category && <span className="chip bg-primary-container/10 text-primary">{n.category}</span>}
              <h2 className="mt-2 font-semibold text-on-surface">{n.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{n.excerpt}</p>
            </div>
          </Link>
        ))}
        {(!news || news.length === 0) && (
          <p className="text-sm text-on-surface-variant">ยังไม่มีข่าวที่เผยแพร่</p>
        )}
      </div>
    </div>
  );
}
