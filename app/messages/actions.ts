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
