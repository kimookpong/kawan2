import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateThread } from "@/app/board/actions";
import { BBCodeEditor } from "@/components/board/bbcode-editor";

export const metadata = {
  title: "แก้ไขกระทู้",
  robots: { index: false, follow: false },
};

export default async function EditThreadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const threadId = Number(params.id);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/board/thread/${threadId}/edit`);

  const [{ data: thread }, { data: me }] = await Promise.all([
    supabase
      .from("threads")
      .select("id, title, body, author_id, members_only, categories(name_th)")
      .eq("id", threadId)
      .single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (!thread) notFound();

  const isStaff = me?.role === "admin" || me?.role === "editor";
  if (thread.author_id !== user.id && !isStaff) {
    redirect(`/board/thread/${threadId}`);
  }

  const cat: any = thread.categories;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">แก้ไขกระทู้</h1>
        <Link
          href={`/board/thread/${threadId}`}
          className="text-sm text-primary hover:underline"
        >
          ← กลับไปหน้ากระทู้
        </Link>
      </div>

      {searchParams.error && (
        <p className="mb-4 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}

      <form action={updateThread} className="card space-y-4 p-6">
        <input type="hidden" name="thread_id" value={threadId} />

        <div>
          <label className="mb-1 block text-sm font-medium">หัวข้อ</label>
          <input
            name="title"
            required
            defaultValue={thread.title}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {cat && (
          <div>
            <label className="mb-1 block text-sm font-medium">หมวดหมู่</label>
            <p className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
              {cat.name_th}{" "}
              <span className="text-xs">(ไม่สามารถเปลี่ยนได้)</span>
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">
            เนื้อหา (รองรับ BBCode)
          </label>
          <div className="overflow-hidden rounded border border-outline-variant">
            <BBCodeEditor
              name="body"
              defaultValue={thread.body}
              rows={12}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="members_only"
            value="1"
            defaultChecked={thread.members_only}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="font-medium">เห็นได้เฉพาะสมาชิกเท่านั้น</span>
            <span className="block text-xs text-on-surface-variant">
              กระทู้นี้จะไม่แสดงต่อผู้ที่ยังไม่ได้ล็อกอิน
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <Link
            href={`/board/thread/${threadId}`}
            className="btn-outline"
          >
            ยกเลิก
          </Link>
          <button type="submit" className="btn-primary">
            บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </div>
  );
}
