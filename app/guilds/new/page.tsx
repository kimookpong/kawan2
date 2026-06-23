import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createGuild } from "../actions";

export const metadata = {
  title: "สร้างกิลด์",
  robots: { index: false, follow: false },
};

export default async function NewGuildPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/guilds/new");

  const { data: me } = await supabase.from("profiles").select("role, membership_tier").eq("id", user.id).single();
  const canCreate = me?.role === "admin" || (me?.membership_tier && me.membership_tier !== "free");
  if (!canCreate) redirect("/membership");

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-primary sm:text-2xl">สร้างกิลด์</h1>
      {searchParams.error && (
        <p className="mb-4 flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}
      <form action={createGuild} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">ชื่อกิลด์</label>
          <input name="name" required minLength={2} className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ตรากิลด์ (URL รูป)</label>
          <input name="emblem_url" type="url" placeholder="https://..." className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">คำอธิบาย</label>
          <textarea name="description" rows={4} className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <p className="text-xs text-on-surface-variant">
          {me?.role === "admin" ? "คุณเป็นแอดมิน สร้างได้หลายกิลด์ (จะเป็นกิลด์ทางการ)" : "สมาชิกผู้สนับสนุนสร้างได้ 1 กิลด์"}
        </p>
        <div className="flex justify-end">
          <button className="btn-primary">สร้างกิลด์</button>
        </div>
      </form>
    </div>
  );
}
