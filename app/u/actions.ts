"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function run(rpc: string, args: Record<string, unknown>, username: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc(rpc, args);
  revalidatePath(`/u/${username}`);
  const q = error ? `?error=${encodeURIComponent(error.message)}` : `?ok=1`;
  redirect(`/u/${username}${q}`);
}

export async function banUser(formData: FormData) {
  await run("ban_user", {
    target: String(formData.get("target")),
    days: Number(formData.get("days")),
    reason: String(formData.get("reason") || "") || null,
  }, String(formData.get("username")));
}

export async function unbanUser(formData: FormData) {
  await run("unban_user", { target: String(formData.get("target")) }, String(formData.get("username")));
}

export async function setDisabled(formData: FormData) {
  await run("set_user_disabled", {
    target: String(formData.get("target")),
    p_disabled: String(formData.get("disabled")) === "1",
  }, String(formData.get("username")));
}

export async function adjustPoints(formData: FormData) {
  await run("admin_adjust_points", {
    target: String(formData.get("target")),
    amount: Number(formData.get("amount")),
    reason: String(formData.get("reason") || "") || null,
  }, String(formData.get("username")));
}
