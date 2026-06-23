"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createNewsComment(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const newsId = Number(formData.get("news_id"));
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/auth/login?redirect=/news/${slug}`);

  const body = String(formData.get("body") || "").trim();
  if (body.length < 1) redirect(`/news/${slug}#comments`);

  await supabase.from("news_comments").insert({
    news_id: newsId,
    author_id: user.id,
    body,
  });

  revalidatePath(`/news/${slug}`);
  redirect(`/news/${slug}#comments`);
}
