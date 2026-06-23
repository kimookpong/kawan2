import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ThreadListItem } from "@/components/board/thread-list-item";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: { category: string } }) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("categories")
    .select("name_th, description")
    .eq("slug", params.category)
    .single();
  if (!c) return { title: "ไม่พบหมวด" };
  return {
    title: c.name_th,
    description: c.description ?? undefined,
    alternates: { canonical: `/board/${params.category}` },
  };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name_th, description")
    .eq("slug", params.category)
    .single();

  if (!category) notFound();

  const { data: threads } = await supabase
    .from("threads")
    .select("id, title, reply_count, view_count, created_at, is_pinned, profiles(username, display_name), categories(name_th, slug)")
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">{category.name_th}</h1>
          <p className="text-sm text-on-surface-variant">{category.description}</p>
        </div>
        <Link href="/board/new" className="btn-accent inline-flex items-center gap-1"><Plus className="h-4 w-4" /> สร้างกระทู้</Link>
      </div>

      <div className="card divide-y divide-outline-variant">
        {threads && threads.length > 0 ? (
          threads.map((t: any) => <ThreadListItem key={t.id} t={t} hideCategory />)
        ) : (
          <p className="p-6 text-center text-sm text-on-surface-variant">ยังไม่มีกระทู้ในหมวดนี้</p>
        )}
      </div>
    </div>
  );
}
