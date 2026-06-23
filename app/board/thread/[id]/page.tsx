import { notFound } from "next/navigation";
import { Heart, MessageCircle, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createReply } from "@/app/board/actions";
import { LEVEL_STYLES } from "@/lib/constants";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const threadId = Number(params.id);

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, body, like_count, reply_count, view_count, created_at, is_locked, profiles(username, display_name, level_id), categories(name_th)")
    .eq("id", threadId)
    .single();

  if (!thread) notFound();

  // เพิ่ม view (best-effort)
  await supabase.rpc("increment_view", { p_thread: threadId }).then(() => {}, () => {});

  const { data: posts } = await supabase
    .from("posts")
    .select("id, body, like_count, created_at, profiles(username, display_name, level_id)")
    .eq("thread_id", threadId)
    .eq("status", "published")
    .order("created_at");

  const { data: { user } } = await supabase.auth.getUser();
  const author: any = thread.profiles;
  const lvl = author ? LEVEL_STYLES[author.level_id] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* กระทู้ */}
      <article className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          {thread.categories && (
            <span className="chip bg-primary-container/10 text-primary">{(thread.categories as any).name_th}</span>
          )}
          {lvl && <span className={`chip ${lvl.cls}`}>{lvl.en}</span>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">{thread.title}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          โดย {author?.display_name || author?.username} ·{" "}
          {new Date(thread.created_at).toLocaleString("th-TH")} · {thread.view_count} อ่าน
        </p>
        <div className="mt-4 whitespace-pre-wrap text-on-surface">{thread.body}</div>
        <div className="mt-4 flex gap-4 text-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> {thread.like_count}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {thread.reply_count}</span>
        </div>
      </article>

      {/* ความเห็น */}
      <h2 className="text-lg font-semibold">ความเห็น ({posts?.length ?? 0})</h2>
      <div className="space-y-3">
        {(posts ?? []).map((p: any) => {
          const pl = LEVEL_STYLES[p.profiles?.level_id];
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{p.profiles?.display_name || p.profiles?.username}</span>
                {pl && <span className={`chip ${pl.cls}`}>{pl.en}</span>}
                <span className="text-on-surface-variant">
                  · {new Date(p.created_at).toLocaleDateString("th-TH")}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-on-surface">{p.body}</p>
            </div>
          );
        })}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-on-surface-variant">ยังไม่มีความเห็น เป็นคนแรกที่ตอบกลับ</p>
        )}
      </div>

      {/* ฟอร์มตอบกลับ */}
      {thread.is_locked ? (
        <p className="card flex items-center justify-center gap-2 p-4 text-center text-sm text-on-surface-variant"><Lock className="h-4 w-4" /> กระทู้นี้ถูกล็อก</p>
      ) : user ? (
        <form action={createReply} className="card space-y-3 p-4">
          <input type="hidden" name="thread_id" value={threadId} />
          <textarea
            name="body"
            required
            rows={4}
            placeholder="เขียนความเห็น..."
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex justify-end">
            <button className="btn-primary">ตอบกลับ</button>
          </div>
        </form>
      ) : (
        <p className="card p-4 text-center text-sm text-on-surface-variant">
          กรุณา<a href="/auth/login" className="text-primary hover:underline"> เข้าสู่ระบบ </a>เพื่อแสดงความเห็น
        </p>
      )}
    </div>
  );
}
