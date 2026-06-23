import { notFound, redirect } from "next/navigation";
import { AlertCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateNews, deleteNews } from "../../admin-actions";
import { NewsForm } from "@/components/news/news-form";

export default async function EditNewsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/news/${params.slug}/edit`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role;
  if (role !== "editor" && role !== "admin") redirect(`/news/${params.slug}`);

  const [{ data: news }, { data: provinces }] = await Promise.all([
    supabase.from("news").select("id, slug, title, category, province_id, excerpt, body, cover_url, is_featured, status").eq("slug", params.slug).single(),
    supabase.from("provinces").select("id, name_th").eq("is_active", true),
  ]);
  if (!news) notFound();

  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-bold text-primary sm:text-2xl">แก้ไขข่าว</h1>
      {searchParams.error && (
        <p className="mb-4 flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}
      <NewsForm
        action={updateNews}
        provinces={provinces ?? []}
        defaults={news as any}
        submitLabel="บันทึกการแก้ไข"
        isEdit
      />

      {/* ลบข่าว — ฟอร์มแยกต่างหาก (ห้ามซ้อนในฟอร์มแก้ไข) เฉพาะแอดมิน */}
      <div className="mt-4 rounded-lg border border-error-container bg-error-container/20 p-4">
        {role === "admin" ? (
          <form action={deleteNews} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-on-surface">ลบข่าวนี้</p>
              <p className="text-xs text-on-surface-variant">การลบถาวร ไม่สามารถกู้คืนได้</p>
            </div>
            <input type="hidden" name="id" value={news.id} />
            <input type="hidden" name="slug" value={news.slug} />
            <button className="inline-flex items-center gap-1 rounded bg-error px-4 py-2 text-sm font-medium text-on-error transition hover:opacity-90">
              <Trash2 className="h-4 w-4" /> ลบข่าวนี้
            </button>
          </form>
        ) : (
          <p className="text-xs text-on-surface-variant">การลบข่าวทำได้เฉพาะแอดมิน</p>
        )}
      </div>
    </div>
  );
}
