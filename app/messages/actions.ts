"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** ซ่อนห้องสนทนาออกจากรายการของผู้ใช้คนปัจจุบัน */
export async function hideConversation(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/messages");

  const convId = Number(formData.get("conversation_id"));
  if (!convId) return;

  await supabase
    .from("conversation_members")
    .update({ hidden_at: new Date().toISOString() })
    .eq("conversation_id", convId)
    .eq("user_id", user.id);

  revalidatePath("/messages");
}

/** ซ่อนห้องสนทนาหลายห้องพร้อมกัน (multi-select) */
export async function hideConversations(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/messages");

  const ids = formData
    .getAll("conversation_id")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return;

  await supabase
    .from("conversation_members")
    .update({ hidden_at: new Date().toISOString() })
    .in("conversation_id", ids)
    .eq("user_id", user.id);

  revalidatePath("/messages");
}
