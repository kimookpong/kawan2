import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createNews } from "../admin-actions";
import { NewsForm } from "@/components/news/news-form";

export default async function NewNewsPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/news/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "editor" && profile?.role !== "admin") redirect("/news");

  const { data: provinces } = await supabase.from("provinces").select("id, name_th").eq("is_active", true);

  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-bold text-primary sm:text-2xl">เขียนข่าวใหม่</h1>
      {searchParams.error && (
        <p className="mb-4 flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}
      <NewsForm action={createNews} provinces={provinces ?? []} submitLabel="เผยแพร่ข่าว" />
    </div>
  );
}
