import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ThreadListItem } from "@/components/board/thread-list-item";

export const revalidate = 60;

export default async function BoardPage() {
  const supabase = createClient();
  const [{ data: categories }, { data: recentThreads }] = await Promise.all([
    supabase.from("categories").select("id, name_th, slug, description").eq("is_active", true).order("sort_order"),
    supabase.from("threads")
      .select("id, title, category_id, reply_count, view_count, created_at, is_pinned, profiles(username, display_name), categories(name_th, slug)")
      .eq("status", "published").order("created_at", { ascending: false }).limit(80),
  ]);

  // จัดกลุ่มตามหมวด (ปักหมุดขึ้นก่อน, สูงสุด 6 ต่อหมวด)
  const byCat = new Map<number, any[]>();
  (recentThreads ?? [])
    .slice()
    .sort((a: any, b: any) => Number(b.is_pinned) - Number(a.is_pinned))
    .forEach((t: any) => {
      const arr = byCat.get(t.category_id) ?? [];
      if (arr.length < 6) arr.push(t);
      byCat.set(t.category_id, arr);
    });

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">กระดานสนทนา</h1>
        <Link href="/board/new" className="btn-accent inline-flex items-center gap-1"><Plus className="h-4 w-4" /> สร้างกระทู้</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(categories ?? []).map((c: any) => {
          const list = byCat.get(c.id) ?? [];
          return (
            <div key={c.id} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-2.5">
                <Link href={`/board/${c.slug}`} className="font-semibold text-primary hover:underline">{c.name_th}</Link>
                <Link href={`/board/${c.slug}`} className="text-xs text-primary hover:underline">ดูทั้งหมด →</Link>
              </div>
              <div className="divide-y divide-outline-variant">
                {list.length > 0 ? (
                  list.map((t: any) => <ThreadListItem key={t.id} t={t} hideCategory />)
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-on-surface-variant">ยังไม่มีกระทู้ในหมวดนี้</p>
                )}
              </div>
            </div>
          );
        })}
        {(!categories || categories.length === 0) && (
          <p className="text-sm text-on-surface-variant">ยังไม่มีหมวดหมู่</p>
        )}
      </div>
    </div>
  );
}
