"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const threadSchema = z.object({
  title: z.string().min(5, "หัวข้อสั้นเกินไป").max(200),
  body: z.string().min(10, "เนื้อหาสั้นเกินไป"),
  category_id: z.coerce.number().int().positive(),
  province_id: z.coerce.number().int().positive().optional(),
  members_only: z.boolean().optional(),
});

export async function createThread(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/board/new");

  const parsed = threadSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category_id: formData.get("category_id"),
    province_id: formData.get("province_id") || undefined,
    members_only: formData.get("members_only") === "1",
  });
  if (!parsed.success) {
    redirect(`/board/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { data, error } = await supabase
    .from("threads")
    .insert({ ...parsed.data, author_id: user.id })
    .select("id")
    .single();

  if (error) redirect(`/board/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/board");
  redirect(`/board/thread/${data!.id}`);
}

export async function createReply(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const threadId = Number(formData.get("thread_id"));
  if (!user) redirect(`/auth/login?redirect=/board/thread/${threadId}`);

  const body = String(formData.get("body") || "").trim();
  if (body.length < 1) redirect(`/board/thread/${threadId}`);

  await supabase.from("posts").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
  });

  revalidatePath(`/board/thread/${threadId}`);
}

/** ปักหมุด/ยกเลิกปักหมุดกระทู้ (RPC ตรวจสิทธิ์ admin ฝั่ง DB) */
export async function setThreadPin(formData: FormData) {
  const supabase = createClient();
  const id = Number(formData.get("thread_id"));
  const pinned = String(formData.get("pinned")) === "1";
  await supabase.rpc("set_thread_pin", { p_thread: id, p_pinned: pinned });
  revalidatePath(`/board/thread/${id}`);
  revalidatePath("/board");
  revalidatePath("/");
}

/** กดถูกใจ/ยกเลิกถูกใจ กระทู้หลัก */
export async function reactThread(formData: FormData) {
  const id = Number(formData.get("thread_id"));
  await toggleLike("thread", id);
  revalidatePath(`/board/thread/${id}`);
}

/** กดถูกใจ/ยกเลิกถูกใจ ความเห็น */
export async function reactPost(formData: FormData) {
  const postId = Number(formData.get("post_id"));
  const threadId = Number(formData.get("thread_id"));
  await toggleLike("post", postId);
  revalidatePath(`/board/thread/${threadId}`);
}

/** รายงานเนื้อหา (ใช้กับ useFormState) */
export async function reportAction(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนรายงาน" };

  const { error } = await supabase.rpc("submit_report", {
    p_target_type: String(formData.get("target_type") || ""),
    p_target_id: Number(formData.get("target_id")),
    p_reason: String(formData.get("reason") || ""),
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function toggleLike(targetType: "thread" | "post", targetId: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("type", "like")
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      type: "like",
    });
  }
}
