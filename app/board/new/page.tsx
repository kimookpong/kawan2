import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createThread } from "../actions";
import { BBCodeEditor } from "@/components/board/bbcode-editor";

export const metadata = {
  title: "ตั้งกระทู้ใหม่",
  robots: { index: false, follow: false },
};

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/board/new");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_th")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-bold text-primary sm:text-2xl">สร้างกระทู้ใหม่</h1>

      {searchParams.error && (
        <p className="mb-4 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}

      <form action={createThread} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">หัวข้อ</label>
          <input
            name="title"
            required
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">หมวดหมู่</label>
          <select
            name="category_id"
            required
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          >
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name_th}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">เนื้อหา (รองรับ BBCode)</label>
          <div className="overflow-hidden rounded border border-outline-variant">
            <BBCodeEditor name="body" rows={12} placeholder="เขียนเนื้อหากระทู้... ใช้ปุ่มจัดรูปแบบ/แนบรูป/วิดีโอด้านบนได้" />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="members_only"
            value="1"
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
          <button type="submit" className="btn-primary">เผยแพร่กระทู้</button>
        </div>
      </form>
    </div>
  );
}
