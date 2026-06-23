import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function BoardPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_th, slug, description, icon")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">กระดานสนทนา</h1>
        <Link href="/board/new" className="btn-accent inline-flex items-center gap-1"><Plus className="h-4 w-4" /> สร้างกระทู้</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/board/${c.slug}`}
            className="card p-5 transition hover:shadow-card"
          >
            <h2 className="font-semibold text-on-surface">{c.name_th}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{c.description}</p>
          </Link>
        ))}
        {(!categories || categories.length === 0) && (
          <p className="text-sm text-on-surface-variant">
            ยังไม่มีหมวดหมู่ — รัน seed.sql เพื่อเพิ่มหมวดหมู่เริ่มต้น
          </p>
        )}
      </div>
    </div>
  );
}
