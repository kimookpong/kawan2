import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
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

const PAGE_SIZE = 15;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { page?: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name_th, description")
    .eq("slug", params.category)
    .single();

  if (!category) notFound();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: threads, count } = await supabase
    .from("threads")
    .select(
      "id, title, reply_count, like_count, view_count, created_at, is_pinned, members_only, profiles(username, display_name, level_id), categories(name_th, slug)",
      { count: "exact" },
    )
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => `/board/${params.category}${p > 1 ? `?page=${p}` : ""}`;

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

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 pt-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low">
              <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant opacity-40">
              <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </span>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-on-surface-variant">…</span>
                )}
                {p === page ? (
                  <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-primary px-2 text-sm font-bold text-on-primary">{p}</span>
                ) : (
                  <Link href={pageHref(p)} className="grid h-9 min-w-9 place-items-center rounded-lg border border-outline-variant px-2 text-sm text-on-surface-variant hover:bg-surface-container-low">
                    {p}
                  </Link>
                )}
              </span>
            ))}

          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low">
              ถัดไป <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant opacity-40">
              ถัดไป <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
