import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("title, body, cover_url, category, published_at, profiles(username, display_name)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!news) notFound();
  const author: any = news.profiles;

  return (
    <article className="mx-auto max-w-3xl">
      {news.category && <span className="chip bg-primary-container/10 text-primary">{news.category}</span>}
      <h1 className="mt-2 text-3xl font-bold text-on-surface">{news.title}</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        โดย {author?.display_name || author?.username || "ทีมงาน"} ·{" "}
        {news.published_at && new Date(news.published_at).toLocaleDateString("th-TH")}
      </p>
      {news.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={news.cover_url} alt="" className="mt-4 w-full rounded-lg object-cover" />
      )}
      <div className="prose mt-6 max-w-none whitespace-pre-wrap text-on-surface">{news.body}</div>
    </article>
  );
}
