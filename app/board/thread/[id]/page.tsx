import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Heart, Lock, CornerUpLeft, MoreHorizontal, Pin, PinOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createReply, setThreadPin } from "@/app/board/actions";
import { AuthorCard } from "@/components/board/author-card";
import { BBCodeEditor } from "@/components/board/bbcode-editor";
import { QuoteButton } from "@/components/board/quote-button";
import { renderBBCode } from "@/lib/bbcode";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const threadId = Number(params.id);

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, body, like_count, reply_count, view_count, created_at, is_locked, is_pinned, profiles(username, display_name, avatar_url, level_id, role, reputation, created_at), categories(name_th, slug)")
    .eq("id", threadId)
    .single();

  if (!thread) notFound();
  await supabase.rpc("increment_view", { p_thread: threadId }).then(() => {}, () => {});

  const { data: posts } = await supabase
    .from("posts")
    .select("id, body, like_count, created_at, profiles(username, display_name, avatar_url, level_id, role, reputation)")
    .eq("thread_id", threadId)
    .eq("status", "published")
    .order("created_at");

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = me?.role === "admin";
  }
  const cat: any = thread.categories;

  return (
    <div className="w-full space-y-4">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
        <Link href="/" className="hover:text-primary">หน้าแรก</Link><span>›</span>
        <Link href="/board" className="hover:text-primary">บอร์ด</Link><span>›</span>
        {cat && <><Link href={`/board/${cat.slug}`} className="hover:text-primary">{cat.name_th}</Link><span>›</span></>}
        <span className="truncate text-on-surface">{thread.title}</span>
      </nav>

      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="flex items-start gap-2 text-2xl font-bold text-on-surface">
          {thread.is_pinned && <Pin className="mt-1.5 h-5 w-5 shrink-0 text-tertiary-container" />}
          {thread.title}
        </h1>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isAdmin && (
            <form action={setThreadPin}>
              <input type="hidden" name="thread_id" value={threadId} />
              <input type="hidden" name="pinned" value={thread.is_pinned ? "0" : "1"} />
              <button className="btn-outline gap-1">
                {thread.is_pinned ? <><PinOff className="h-4 w-4" /> ยกเลิกปักหมุด</> : <><Pin className="h-4 w-4" /> ปักหมุด</>}
              </button>
            </form>
          )}
          <button className="btn-outline gap-1"><Bookmark className="h-4 w-4" /> บันทึก</button>
          <a href="#reply" className="btn-primary gap-1"><CornerUpLeft className="h-4 w-4" /> ตอบกระทู้</a>
        </div>
      </div>

      {/* กระทู้หลัก */}
      <article className="card flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <AuthorCard author={thread.profiles as any} />
        <div className="min-w-0 flex-1 border-t border-outline-variant pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-xs text-on-surface-variant">
            โพสต์เมื่อ {new Date(thread.created_at).toLocaleString("th-TH")} · {thread.view_count} อ่าน
          </p>
          <div className="bbcode mt-3 text-on-surface" dangerouslySetInnerHTML={{ __html: renderBBCode(thread.body) }} />
          <div className="mt-5 flex items-center gap-4 border-t border-outline-variant pt-3 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> ถูกใจ ({thread.like_count})</span>
            <a href="#reply" className="inline-flex items-center gap-1 hover:text-primary"><CornerUpLeft className="h-4 w-4" /> ตอบกลับ</a>
            <button className="ml-auto"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
        </div>
      </article>

      {/* ความคิดเห็น */}
      <h2 className="border-b border-outline-variant pb-2 text-lg font-semibold">
        ความคิดเห็น ({posts?.length ?? 0})
      </h2>

      <div className="space-y-3">
        {(posts ?? []).map((p: any, i: number) => (
          <div key={p.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
            <AuthorCard author={p.profiles} compact />
            <div className="min-w-0 flex-1 border-t border-outline-variant pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>{new Date(p.created_at).toLocaleString("th-TH")}</span>
                <span className="font-medium">#{i + 1}</span>
              </div>
              <div className="bbcode mt-2 text-on-surface" dangerouslySetInnerHTML={{ __html: renderBBCode(p.body) }} />
              <div className="mt-3 flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.like_count} ถูกใจ</span>
                <QuoteButton author={p.profiles?.display_name || p.profiles?.username || "สมาชิก"} body={p.body} />
              </div>
            </div>
          </div>
        ))}
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
