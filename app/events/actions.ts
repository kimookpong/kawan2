"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseForm(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const cover_url = String(formData.get("cover_url") || "").trim() || null;
  const province_id = formData.get("province_id") ? Number(formData.get("province_id")) : null;
  const startsRaw = String(formData.get("starts_at") || "");
  const endsRaw = String(formData.get("ends_at") || "");
  const starts_at = startsRaw ? new Date(startsRaw).toISOString() : null;
  const ends_at = endsRaw ? new Date(endsRaw).toISOString() : null;
  return { title, description, location, cover_url, province_id, starts_at, ends_at };
}

/** เพิ่มกิจกรรม — RLS อนุญาตเฉพาะ staff (admin/editor) */
export async function createEvent(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/events/new");

  const data = parseForm(formData);
  if (!data.title || !data.starts_at) {
    redirect(`/events/new?error=${encodeURIComponent("กรุณากรอกชื่อกิจกรรมและวันที่เริ่ม")}`);
  }

  const { error } = await supabase.from("events").insert({ ...data, created_by: user.id });
  if (error) redirect(`/events/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}

/** แก้ไขกิจกรรม — RLS อนุญาตเฉพาะ staff */
export async function updateEvent(formData: FormData) {
  const supabase = createClient();
  const id = Number(formData.get("id"));
  const data = parseForm(formData);
  if (!data.title || !data.starts_at) {
    redirect(`/events/${id}/edit?error=${encodeURIComponent("กรุณากรอกชื่อกิจกรรมและวันที่เริ่ม")}`);
  }

  const { error } = await supabase.from("events").update(data).eq("id", id);
  if (error) redirect(`/events/${id}/edit?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}

/** ลบกิจกรรม — RLS อนุญาตเฉพาะ admin */
export async function deleteEvent(formData: FormData) {
  const supabase = createClient();
  const id = Number(formData.get("id"));
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}
