import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, MessageSquare, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createNewsComment } from "../actions";
import { AuthorCard } from "@/components/board/author-card";
import { BBCodeEditor } from "@/components/board/bbcode-editor";
import { QuoteButton } from "@/components/board/quote-button";
import { renderBBCode } from "@/lib/bbcode";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareButtons } from "@/components/share-buttons";
import { ReportButton } from "@/components/report-button";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: n } = await supabase
    .from("news")
    .select("title, body, cover_url, category, status, published_at")
    .eq("slug", params.slug)
    .single();
  if (!n) return { title: "ไม่พบข่าว" };
  const desc = (n.body ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: n.title,
    description: desc || undefined,
    alternates: { canonical: `/news/${params.slug}` },
    openGraph: {
      type: "article",
      title: n.title,
      description: desc || undefined,
      images: n.cover_url ? [n.cover_url] : undefined,
      publishedTime: n.published_at ?? undefined,
      section: n.category ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: n.title,
      description: desc || undefined,
      images: n.cover_url ? [n.cover_url] : undefined,
    },
    robots: n.status === "published" ? undefined : { index: false, follow: false },
  };
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("id, title, body, cover_url, category, status, view_count, published_at, profiles(username, display_name, avatar_url, level_id, role, reputation, created_at, threads(count), posts(count))")
    .eq("slug", params.slug)
    .eq("profiles.threads.status", "published")
    .eq("profiles.posts.status", "published")
    .single();

  if (!news) notFound();

  const { data: comments } = await supabase
    .from("news_comments")
    .select("id, body, created_at, profiles(username, display_name, avatar_url, level_id, role, reputation, created_at, threads(count), posts(count))")
    .eq("news_id", news.id)
    .eq("status", "published")
    .eq("profiles.threads.status", "published")
    .eq("profiles.posts.status", "published")
    .order("created_at");

  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;
  if (user) {
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    canEdit = me?.role === "editor" || me?.role === "admin";
  }

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.vercel.app";
  const author: any = news.profiles;
  const plain = (news.body ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();

  return (
    <div className="w-full space-y-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: news.title,
          description: plain.slice(0, 200) || undefined,
          image: news.cover_url ? [news.cover_url] : undefined,
          datePublished: news.published_at ?? undefined,
          articleSection: news.category ?? undefined,
          author: author ? { "@type": "Person", name: author.display_name || author.username } : undefined,
          publisher: { "@type": "Organization", name: "Kawan2", logo: { "@type": "ImageObject", url: `${SITE}/image.png` } },
          mainEntityOfPage: `${SITE}/news/${params.slug}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE },
            { "@type": "ListItem", position: 2, name: "ข่าวสาร", item: `${SITE}/news` },
            { "@type": "ListItem", position: 3, name: news.title, item: `${SITE}/news/${params.slug}` },
          ],
        }}
      />

      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
        <Link href="/" className="hover:text-primary">หน้าแรก</Link><span>›</span>
        <Link href="/news" className="hover:text-primary">ข่าวสาร</Link><span>›</span>
        {news.category && <><span className="text-on-surface-variant">{news.category}</span><span>›</span></>}
        <span className="truncate text-on-surface">{news.title}</span>
      </nav>

      {news.status !== "published" && (
        <p className="rounded border border-amber-400/50 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ข่าวนี้เป็น “{news.status === "draft" ? "ฉบับร่าง" : news.status}” — ยังไม่แสดงต่อสาธารณะ (เห็นเฉพาะบรรณาธิการ/แอดมิน)
        </p>
      )}

      {/* header actions & share */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ShareButtons title={news.title} />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {canEdit && (
            <Link href={`/news/${params.slug}/edit`} className="btn-outline gap-1"><Pencil className="h-4 w-4" /> แก้ไข</Link>
          )}
          <button className="btn-outline gap-1"><Bookmark className="h-4 w-4" /> บันทึก</button>
          <a href="#comments" className="btn-primary gap-1"><MessageSquare className="h-4 w-4" /> แสดงความเห็น</a>
        </div>
      </div>

      {/* เนื้อหาข่าว (สไตล์กระทู้) */}
      <article className="card flex flex-col sm:flex-row overflow-hidden">
        <AuthorCard author={news.profiles as any} />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <h1 className="text-xl font-bold text-on-surface sm:text-2xl">{news.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            {news.category && <span className="chip bg-primary-container/10 text-primary">{news.category}</span>}
            <span>
              เผยแพร่เมื่อ {news.published_at && new Date(news.published_at).toLocaleString("th-TH")}
              {typeof news.view_count === "number" ? ` · ${news.view_count} อ่าน` : ""}
            </span>
          </div>

          {news.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={news.cover_url} alt="" className="mt-3 w-full max-w-[640px] rounded-lg object-cover" />
          )}

          <div className="bbcode mt-4 text-on-surface" dangerouslySetInnerHTML={{ __html: renderBBCode(news.body) }} />

          <div className="mt-5 flex items-center gap-4 border-t border-outline-variant pt-3 text-sm text-on-surface-variant">
            <a href="#comments" className="inline-flex items-center gap-1 hover:text-primary">
              <MessageSquare className="h-4 w-4" /> ความเห็น ({comments?.length ?? 0})
            </a>
            <div className="ml-auto">
              <ReportButton targetType="news" targetId={news.id} />
            </div>
          </div>
        </div>
      </article>

      {/* ความคิดเห็น */}
      <h2 id="comments" className="scroll-mt-20 border-b border-outline-variant pb-2 text-lg font-semibold">
        ความคิดเห็น ({comments?.length ?? 0})
      </h2>

      <div className="space-y-3">
        {(comments ?? []).map((c: any, i: number) => (
          <div key={c.id} className="card flex flex-col sm:flex-row overflow-hidden">
            <AuthorCard author={c.profiles} compact />
            <div className="min-w-0 flex-1 p-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>{new Date(c.created_at).toLocaleString("th-TH")}</span>
                <span className="font-medium">#{i + 1}</span>
              </div>
              <div className="bbcode mt-2 text-on-surface" dangerouslySetInnerHTML={{ __html: renderBBCode(c.body) }} />
              <div className="mt-3 flex items-center gap-4 text-xs text-on-surface-variant">
                <QuoteButton author={c.profiles?.display_name || c.profiles?.username || "สมาชิก"} body={c.body} />
                <div className="ml-auto">
                  <ReportButton targetType="news_comment" targetId={c.id} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <p className="card p-6 text-center text-sm text-on-surface-variant">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความเห็น</p>
        )}
      </div>

      {/* ฟอร์มความเห็น */}
      <div className="scroll-mt-20">
        {user ? (
          <form action={createNewsComment} className="card overflow-hidden">
            <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary">แสดงความคิดเห็น</div>
            <input type="hidden" name="news_id" value={news.id} />
            <input type="hidden" name="slug" value={params.slug} />
            <BBCodeEditor placeholder="แสดงความคิดเห็นต่อข่าวนี้... รองรับ BBCode" rows={5} />
            <div className="flex items-center justify-between border-t border-outline-variant px-4 py-2.5">
              <span className="text-xs text-on-surface-variant">แสดงความเห็นในนาม สมาชิก</span>
              <button className="btn-primary">ส่งความคิดเห็น</button>
            </div>
          </form>
        ) : (
          <p className="card p-4 text-center text-sm text-on-surface-variant">
            กรุณา<Link href={`/auth/login?redirect=/news/${params.slug}`} className="text-primary hover:underline"> เข้าสู่ระบบ </Link>เพื่อแสดงความเห็น
          </p>
        )}
      </div>
    </div>
  );
}
