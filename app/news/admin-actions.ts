"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(title: string): string {
  // เก็บเฉพาะ ASCII (a-z0-9) เพื่อให้ slug ปลอดภัยใน URL — ตัวอักษรไทยจะถูกตัดออก
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const rand = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${rand}` : `news-${rand}`;
}

async function requireEditor() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/news");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "editor" && profile?.role !== "admin") redirect("/news");
  return { supabase, user, role: profile.role as string };
}

export async function createNews(formData: FormData) {
  const { supabase, user } = await requireEditor();
  const title = String(formData.get("title") || "").trim();
  const status = String(formData.get("status") || "draft");
  const slug = String(formData.get("slug") || "").trim() || slugify(title);

  const { data, error } = await supabase
    .from("news")
    .insert({
      author_id: user.id,
      title,
      slug,
      category: String(formData.get("category") || "") || null,
      province_id: formData.get("province_id") ? Number(formData.get("province_id")) : null,
      excerpt: String(formData.get("excerpt") || "") || null,
      body: String(formData.get("body") || ""),
      cover_url: String(formData.get("cover_url") || "") || null,
      is_featured: formData.get("is_featured") === "on",
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("slug")
    .single();

  if (error) redirect(`/news/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/news");
  redirect(`/news/${data!.slug}`);
}

export async function updateNews(formData: FormData) {
  const { supabase } = await requireEditor();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "draft");

  const { error } = await supabase
    .from("news")
    .update({
      title: String(formData.get("title") || "").trim(),
      category: String(formData.get("category") || "") || null,
      province_id: formData.get("province_id") ? Number(formData.get("province_id")) : null,
      excerpt: String(formData.get("excerpt") || "") || null,
      body: String(formData.get("body") || ""),
      cover_url: String(formData.get("cover_url") || "") || null,
      is_featured: formData.get("is_featured") === "on",
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  const slug = String(formData.get("slug") || "");
  if (error) redirect(`/news/${slug}/edit?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/news");
  revalidatePath(`/news/${slug}`);
  redirect(`/news/${slug}`);
}

export async function deleteNews(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/news"); // ลบได้เฉพาะ admin

  const id = Number(formData.get("id"));
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) {
    const slug = String(formData.get("slug") || "");
    redirect(`/news/${slug}/edit?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/news");
  redirect("/news");
}
