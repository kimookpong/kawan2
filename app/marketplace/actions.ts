"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseImageUrls } from "@/lib/marketplace";

// ─────────────────────────── Seller ───────────────────────────

const sellerSchema = z.object({
  shop_name: z.string().min(3, "ชื่อร้านสั้นเกินไป").max(60),
  description: z.string().max(2000).optional(),
  contact_phone: z.string().min(8, "กรอกเบอร์โทร"),
  contact_line: z.string().max(60).optional(),
  contact_facebook: z.string().max(200).optional(),
  province_id: z.coerce.number().int().positive().optional(),
  address: z.string().max(300).optional(),
  logo_url: z.string().url().or(z.literal("")).optional(),
  accept: z.string().refine((v) => v === "1", "ต้องยอมรับเงื่อนไข"),
});

export async function registerSeller(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/marketplace/seller/register");

  const parsed = sellerSchema.safeParse({
    shop_name: formData.get("shop_name"),
    description: formData.get("description") || undefined,
    contact_phone: formData.get("contact_phone"),
    contact_line: formData.get("contact_line") || undefined,
    contact_facebook: formData.get("contact_facebook") || undefined,
    province_id: formData.get("province_id") || undefined,
    address: formData.get("address") || undefined,
    logo_url: formData.get("logo_url") || undefined,
    accept: formData.get("accept") || "",
  });
  if (!parsed.success) {
    redirect(`/marketplace/seller/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { accept: _ignored, ...payload } = parsed.data;
  const insertData = { id: user.id, ...payload };

  const { error } = await supabase
    .from("sellers")
    .upsert(insertData, { onConflict: "id" });

  if (error) {
    redirect(`/marketplace/seller/register?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/marketplace/seller/status");
  redirect("/marketplace/seller/status");
}

export async function updateSeller(formData: FormData) {
  return registerSeller(formData);
}

export async function approveSeller(formData: FormData) {
  const supabase = createClient();
  const target = String(formData.get("seller_id") || "");
  const { error } = await supabase.rpc("approve_seller", { target });
  if (error) redirect(`/admin/marketplace/sellers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/marketplace/sellers");
  redirect("/admin/marketplace/sellers");
}

export async function rejectSeller(formData: FormData) {
  const supabase = createClient();
  const target = String(formData.get("seller_id") || "");
  const reason = String(formData.get("reason") || "ไม่ผ่านการพิจารณา");
  const { error } = await supabase.rpc("reject_seller", { target, p_reason: reason });
  if (error) redirect(`/admin/marketplace/sellers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/marketplace/sellers");
  redirect("/admin/marketplace/sellers");
}

// ─────────────────────────── Listing ───────────────────────────

const listingSchema = z.object({
  title: z.string().min(5, "หัวข้อสั้นเกินไป").max(200),
  description: z.string().max(8000).default(""),
  category_id: z.coerce.number().int().positive(),
  province_id: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().nonnegative().optional(),
  price_type: z.enum(["fixed", "negotiable", "contact"]).default("fixed"),
  condition: z.enum(["new", "like_new", "used"]).default("used"),
  cover_url: z.string().url("URL รูปหลักไม่ถูกต้อง").or(z.literal("")).optional(),
  image_urls_raw: z.string().optional(),
  contact_phone_override: z.string().max(40).optional(),
});

export async function createListing(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/marketplace/listing/new");

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    category_id: formData.get("category_id"),
    province_id: formData.get("province_id") || undefined,
    price: formData.get("price") || undefined,
    price_type: formData.get("price_type") || "fixed",
    condition: formData.get("condition") || "used",
    cover_url: formData.get("cover_url") || undefined,
    image_urls_raw: formData.get("image_urls_raw") || undefined,
    contact_phone_override: formData.get("contact_phone_override") || undefined,
  });
  if (!parsed.success) {
    redirect(`/marketplace/listing/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { image_urls_raw, ...rest } = parsed.data;
  const image_urls = image_urls_raw ? parseImageUrls(image_urls_raw) : [];
  const price = rest.price_type === "contact" ? null : (rest.price ?? null);

  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({ ...rest, price, image_urls, seller_id: user.id })
    .select("id")
    .single();

  if (error) redirect(`/marketplace/listing/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/marketplace");
  revalidatePath("/marketplace/seller/dashboard");
  redirect(`/marketplace/listing/${data!.id}`);
}

export async function updateListing(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = Number(formData.get("listing_id"));
  if (!user || !id) redirect("/marketplace");

  // เจ้าตัวเท่านั้น (staff แก้ไม่ได้ — ใช้ action ซ่อน/ลบแทน)
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("seller_id")
    .eq("id", id)
    .single();
  if (!listing || listing.seller_id !== user.id) {
    redirect(`/marketplace/listing/${id}`);
  }

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    category_id: formData.get("category_id"),
    province_id: formData.get("province_id") || undefined,
    price: formData.get("price") || undefined,
    price_type: formData.get("price_type") || "fixed",
    condition: formData.get("condition") || "used",
    cover_url: formData.get("cover_url") || undefined,
    image_urls_raw: formData.get("image_urls_raw") || undefined,
    contact_phone_override: formData.get("contact_phone_override") || undefined,
  });
  if (!parsed.success) {
    redirect(`/marketplace/listing/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const { image_urls_raw, ...rest } = parsed.data;
  const image_urls = image_urls_raw ? parseImageUrls(image_urls_raw) : [];
  const price = rest.price_type === "contact" ? null : (rest.price ?? null);

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ ...rest, price, image_urls, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`/marketplace/listing/${id}/edit?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/marketplace/listing/${id}`);
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/seller/dashboard");
  redirect(`/marketplace/listing/${id}`);
}

export async function setListingStatus(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = Number(formData.get("listing_id"));
  const status = String(formData.get("status") || "available");
  if (!user || !id) return;

  // เจ้าตัว หรือ staff เท่านั้น
  const [{ data: listing }, { data: me }] = await Promise.all([
    supabase
      .from("marketplace_listings")
      .select("seller_id")
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);
  const isStaff = me?.role === "admin" || me?.role === "editor";
  if (!listing || (listing.seller_id !== user.id && !isStaff)) return;

  await supabase
    .from("marketplace_listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/marketplace/listing/${id}`);
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/seller/dashboard");
}

export async function createListingComment(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const listingId = Number(formData.get("listing_id"));
  if (!user) redirect(`/auth/login?redirect=/marketplace/listing/${listingId}`);

  const body = String(formData.get("body") || "").trim();
  if (body.length < 1 || !listingId) {
    redirect(`/marketplace/listing/${listingId}`);
  }

  const { error } = await supabase
    .from("listing_comments")
    .insert({ listing_id: listingId, author_id: user.id, body });
  if (error) {
    redirect(
      `/marketplace/listing/${listingId}?error=${encodeURIComponent(error.message)}#comments`,
    );
  }

  revalidatePath(`/marketplace/listing/${listingId}`);
  redirect(`/marketplace/listing/${listingId}#comments`);
}

export async function deleteListingComment(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const commentId = Number(formData.get("comment_id"));
  const listingId = Number(formData.get("listing_id"));
  if (!user || !commentId) return;

  await supabase
    .from("listing_comments")
    .update({ status: "deleted", updated_at: new Date().toISOString() })
    .eq("id", commentId);

  revalidatePath(`/marketplace/listing/${listingId}`);
}

export async function toggleFavorite(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = Number(formData.get("listing_id"));
  if (!user || !id) redirect(`/auth/login?redirect=/marketplace/listing/${id}`);

  const { data: existing } = await supabase
    .from("marketplace_favorites")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("listing_id", id)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("marketplace_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", id);
  } else {
    await supabase
      .from("marketplace_favorites")
      .insert({ user_id: user.id, listing_id: id });
  }
  revalidatePath(`/marketplace/listing/${id}`);
}
