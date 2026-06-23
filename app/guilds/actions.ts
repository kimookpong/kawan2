"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createGuild(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/guilds/new");

  const { data: gid, error } = await supabase.rpc("create_guild", {
    p_name: String(formData.get("name") || "").trim(),
    p_description: String(formData.get("description") || "") || null,
    p_emblem: String(formData.get("emblem_url") || "") || null,
  });
  if (error) redirect(`/guilds/new?error=${encodeURIComponent(error.message)}`);

  const { data: g } = await supabase.from("guilds").select("slug").eq("id", gid).single();
  revalidatePath("/guilds");
  redirect(g?.slug ? `/guilds/${g.slug}` : "/guilds");
}

export async function joinGuild(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const slug = String(formData.get("slug") || "");
  if (!user) redirect(`/auth/login?redirect=/guilds/${slug}`);

  const { error } = await supabase.rpc("join_guild", { p_guild: Number(formData.get("guild_id")) });
  revalidatePath(`/guilds/${slug}`);
  revalidatePath("/guilds");
  redirect(`/guilds/${slug}${error ? `?error=${encodeURIComponent(error.message)}` : ""}`);
}

export async function renameGuild(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const slug = String(formData.get("slug") || "");
  if (!user) redirect(`/auth/login?redirect=/guilds/${slug}`);

  const { error } = await supabase.rpc("rename_guild", {
    p_guild: Number(formData.get("guild_id")),
    p_name: String(formData.get("name") || "").trim(),
  });
  revalidatePath(`/guilds/${slug}`);
  revalidatePath("/guilds");
  redirect(`/guilds/${slug}${error ? `?error=${encodeURIComponent(error.message)}` : ""}`);
}

export async function leaveGuild(formData: FormData) {
  const supabase = createClient();
  const slug = String(formData.get("slug") || "");
  await supabase.rpc("leave_guild");
  revalidatePath(`/guilds/${slug}`);
  revalidatePath("/guilds");
  redirect(`/guilds/${slug}`);
}
