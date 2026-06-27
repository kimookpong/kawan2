import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Heart, Lock, CornerUpLeft, Pin, PinOff, Pencil, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createReply, setThreadPin, reactThread, reactPost, updatePost } from "@/app/board/actions";
import { AuthorCard } from "@/components/board/author-card";
import { BBCodeEditor } from "@/components/board/bbcode-editor";
import { QuoteButton } from "@/components/board/quote-button";
import { renderBBCode } from "@/lib/bbcode";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareButtons } from "@/components/share-buttons";
import { ReportButton } from "@/components/report-button";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: t } = await supabase
    .from("threads")
    .select("title, body, categories(name_th)")
    .eq("id", Number(params.id))
    .single();
  if (!t) return { title: "ไม่พบกระทู้" };
  const desc = (t.body ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: t.title,
    description: desc || undefined,
    alternates: { canonical: `/board/thread/${params.id}` },
    openGraph: { type: "article", title: t.title, description: desc || undefined },
  };
}

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit_post?: string };
}) {
  const supabase = createClient();
  const threadId = Number(params.id);
  const editPostId = Number(searchParams.edit_post) || null;

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, body, author_id, updated_at, like_count, reply_count, view_count, created_at, is_locked, is_pinned, profiles(username, display_name, avatar_url, level_id, role, reputation, created_at, bio, threads(count), posts(count)), categories(name_th, slug)")
    .eq("id", threadId)
    .eq("profiles.threads.status", "published")
    .eq("profiles.posts.status", "published")
    .single();

  if (!thread) notFound();
  await supabase.rpc("increment_view", { p_thread: threadId }).then(() => {}, () => {});

  const { data: posts } = await supabase
    .from("posts")
    .select("id, body, author_id, updated_at, like_count, created_at, profiles(username, display_name, avatar_url, level_id, role, reputation, created_at, bio, threads(count), posts(count))")
    .eq("thread_id", threadId)
    .eq("status", "published")
    .eq("profiles.threads.status", "published")
    .eq("profiles.posts.status", "published")
    .order("created_at");

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  let isStaff = false;
  let likedThread = false;
  let likedPosts = new Set<number>();
  if (user) {
    const postIds = (posts ?? []).map((p: any) => p.id);
    const [{ data: me }, { data: tReact }, { data: pReacts }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("reactions").select("id")
        .eq("user_id", user.id).eq("type", "like").eq("target_type", "thread").eq("target_id", threadId).maybeSingle(),
      postIds.length
        ? supabase.from("reactions").select("target_id")
            .eq("user_id", user.id).eq("type", "like").eq("target_type", "post").in("target_id", postIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    isAdmin = me?.role === "admin";
    isStaff = me?.role === "admin" || me?.role === "editor";
    likedThread = !!tReact;
    likedPosts = new Set((pReacts ?? []).map((r: any) => r.target_id));
  }
  const canEditThread = !!user && (user.id === (thread as any).author_id || isStaff);
  const threadEdited =
    (thread as any).updated_at &&
    new Date((thread as any).updated_at).getTime() -
      new Date(thread.created_at).getTime() >
      60_000;
  const cat: any = thread.categories;
  const tAuthor: any = thread.profiles;
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.vercel.app";
  const tPlain = (thread.body ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();

  return (
    <div className="w-full space-y-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DiscussionForumPosting",
          headline: thread.title,
          text: tPlain.slice(0, 300) || undefined,
          datePublished: thread.created_at ?? undefined,
          author: tAuthor ? { "@type": "Person", name: tAuthor.display_name || tAuthor.username } : undefined,
          interactionStatistic: [
            { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: thread.like_count ?? 0 },
            { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: thread.reply_count ?? 0 },
          ],
          mainEntityOfPage: `${SITE}/board/thread/${threadId}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE },
            { "@type": "ListItem", position: 2, name: "บอร์ด", item: `${SITE}/board` },
            ...(cat ? [{ "@type": "ListItem", position: 3, name: cat.name_th, item: `${SITE}/board/${cat.slug}` }] : []),
            { "@type": "ListItem", position: cat ? 4 : 3, name: thread.title, item: `${SITE}/board/thread/${threadId}` },
          ],
        }}
      />

      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
        <Link href="/" className="hover:text-primary">หน้าแรก</Link><span>›</span>
        <Link href="/board" className="hover:text-primary">บอร์ด</Link><span>›</span>
        {cat && <><Link href={`/board/${cat.slug}`} className="hover:text-primary">{cat.name_th}</Link><span>›</span></>}
        <span className="truncate text-on-surface">{thread.title}</span>
      </nav>

      {/* header actions & share */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ShareButtons title={thread.title} />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {isAdmin && (
            <form action={setThreadPin}>
              <input type="hidden" name="thread_id" value={threadId} />
              <input type="hidden" name="pinned" value={thread.is_pinned ? "0" : "1"} />
              <button className="btn-outline gap-1">
                {thread.is_pinned ? <><PinOff className="h-4 w-4" /> ยกเลิกปักหมุด</> : <><Pin className="h-4 w-4" /> ปักหมุด</>}
              </button>
            </form>
          )}
          {canEditThread && (
            <Link href={`/board/thread/${threadId}/edit`} className="btn-outline gap-1">
              <Pencil className="h-4 w-4" /> แก้ไข
            </Link>
          )}
          <button className="btn-outline gap-1"><Bookmark className="h-4 w-4" /> บันทึก</button>
          <a href="#reply" className="btn-primary gap-1"><CornerUpLeft className="h-4 w-4" /> ตอบกระทู้</a>
        </div>
      </div>

      {/* กระทู้หลัก */}
      <article className="card flex flex-col sm:flex-row overflow-hidden">
        <AuthorCard author={thread.profiles as any} />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <h1 className="flex items-start gap-2 text-xl font-bold text-on-surface sm:text-2xl">
            {thread.is_pinned && <Pin className="mt-1 h-5 w-5 shrink-0 text-tertiary-container" />}
            {thread.title}
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            โพสต์เมื่อ {new Date(thread.created_at).toLocaleString("th-TH")} · {thread.view_count} อ่าน
            {threadEdited && (
              <span className="ml-1 italic">
                (แก้ไขเมื่อ {new Date((thread as any).updated_at).toLocaleString("th-TH")})
              </span>
            )}
          </p>
          <div className="bbcode mt-3 text-on-surface" dangerouslySetInnerHTML={{ __html: renderBBCode(thread.body) }} />
          <div className="mt-5 flex items-center gap-4 border-t border-outline-variant pt-3 text-sm text-on-surface-variant">
            <form action={reactThread}>
              <input type="hidden" name="thread_id" value={threadId} />
              <button className={`inline-flex items-center gap-1 ${likedThread ? "font-medium text-primary" : "hover:text-primary"}`}>
                <Heart className={`h-4 w-4 ${likedThread ? "fill-current" : ""}`} /> ถูกใจ ({thread.like_count})
              </button>
            </form>
            <a href="#reply" className="inline-flex items-center gap-1 hover:text-primary"><CornerUpLeft className="h-4 w-4" /> ตอบกลับ</a>
            <div className="ml-auto">
              <ReportButton targetType="thread" targetId={threadId} />
            </div>
          </div>
        </div>
      </article>

      {/* ความคิดเห็น */}
      <h2 className="border-b border-outline-variant pb-2 text-lg font-semibold">
        ความคิดเห็น ({posts?.length ?? 0})
      </h2>

      <div className="space-y-3">
        {(posts ?? []).map((p: any, i: number) => {
          const canEditPost = !!user && (user.id === p.author_id || isStaff);
          const isEditing = canEditPost && editPostId === p.id;
          const postEdited =
            p.updated_at &&
            new Date(p.updated_at).getTime() - new Date(p.created_at).getTime() > 60_000;
          return (
            <div
              key={p.id}
              id={`post-${p.id}`}
              className="card flex flex-col sm:flex-row overflow-hidden scroll-mt-20"
            >
              <AuthorCard author={p.profiles} compact />
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>
                    {new Date(p.created_at).toLocaleString("th-TH")}
                    {postEdited && (
                      <span className="ml-1 italic">
                        (แก้ไขเมื่อ {new Date(p.updated_at).toLocaleString("th-TH")})
                      </span>
                    )}
                  </span>
                  <span className="font-medium">#{i + 1}</span>
                </div>
                {isEditing ? (
                  <form action={updatePost} className="mt-2 overflow-hidden rounded border border-outline-variant">
                    <input type="hidden" name="post_id" value={p.id} />
                    <input type="hidden" name="thread_id" value={threadId} />
                    <BBCodeEditor defaultValue={p.body} />
                    <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-4 py-2.5">
                      <Link
                        href={`/board/thread/${threadId}#post-${p.id}`}
                        className="btn-outline gap-1"
                      >
                        <X className="h-4 w-4" /> ยกเลิก
                      </Link>
                      <button className="btn-primary">บันทึก</button>
                    </div>
                  </form>
                ) : (
                  <div className="bbcode mt-2 text-on-surface" dangerouslySetInnerHTML={{ __html: renderBBCode(p.body) }} />
                )}
                {!isEditing && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-on-surface-variant">
                    <form action={reactPost}>
                      <input type="hidden" name="post_id" value={p.id} />
                      <input type="hidden" name="thread_id" value={threadId} />
                      <button className={`inline-flex items-center gap-1 ${likedPosts.has(p.id) ? "font-medium text-primary" : "hover:text-primary"}`}>
                        <Heart className={`h-3.5 w-3.5 ${likedPosts.has(p.id) ? "fill-current" : ""}`} /> {p.like_count} ถูกใจ
                      </button>
                    </form>
                    <QuoteButton author={p.profiles?.display_name || p.profiles?.username || "สมาชิก"} body={p.body} />
                    {canEditPost && (
                      <Link
                        href={`/board/thread/${threadId}?edit_post=${p.id}#post-${p.id}`}
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" /> แก้ไข
                      </Link>
                    )}
                    <div className="ml-auto">
                      <ReportButton targetType="post" targetId={p.id} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(!posts || posts.length === 0) && (
          <p className="card p-6 text-center text-sm text-on-surface-variant">ยังไม่มีความเห็น เป็นคนแรกที่ตอบกลับ</p>
        )}
      </div>

      {/* ฟอร์มตอบกลับ */}
      <div id="reply" className="scroll-mt-20">
        {thread.is_locked ? (
          <p className="card flex items-center justify-center gap-2 p-4 text-center text-sm text-on-surface-variant">
            <Lock className="h-4 w-4" /> กระทู้นี้ถูกล็อก
          </p>
        ) : user ? (
          <form action={createReply} className="card overflow-hidden">
            <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary">ตอบกระทู้</div>
            <input type="hidden" name="thread_id" value={threadId} />
            <BBCodeEditor placeholder="พิมพ์ข้อความตอบกลับ... รองรับ BBCode เช่น [b]ตัวหนา[/b]" />
            <div className="flex items-center justify-between border-t border-outline-variant px-4 py-2.5">
              <span className="text-xs text-on-surface-variant">ตอบกลับในนาม สมาชิก</span>
              <button className="btn-primary">ส่งข้อความ</button>
            </div>
          </form>
        ) : (
          <p className="card p-4 text-center text-sm text-on-surface-variant">
            กรุณา<Link href="/auth/login" className="text-primary hover:underline"> เข้าสู่ระบบ </Link>เพื่อแสดงความเห็น
          </p>
        )}
      </div>
    </div>
  );
}
