"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** เปลี่ยน role ผู้ใช้ (RPC ตรวจสิทธิ์ admin ฝั่ง DB) */
export async function setUserRole(formData: FormData) {
  const supabase = createClient();
  const target = String(formData.get("target"));
  const newRole = String(formData.get("role"));
  const q = String(formData.get("q") || "");

  const { error } = await supabase.rpc("set_user_role", {
    target,
    new_role: newRole,
  });

  revalidatePath("/admin/users");
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set(error ? "error" : "ok", error ? error.message : "1");
  redirect(`/admin/users?${params.toString()}`);
}
