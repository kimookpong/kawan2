"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Admin: toggle is_pinned / is_featured ของประกาศ */
export async function adminToggleListingFlag(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "editor") redirect("/");

  const id = Number(formData.get("listing_id"));
  const flag = String(formData.get("flag") || "");
  const value = String(formData.get("value")) === "1";
  if (!id || !["is_pinned", "is_featured"].includes(flag)) return;

  await supabase
    .from("marketplace_listings")
    .update({ [flag]: value, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/marketplace/listings");
  revalidatePath("/marketplace");
}
