import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateListing } from "@/app/marketplace/actions";
import { ListingForm } from "@/components/marketplace/listing-form";

export const metadata = {
  title: "แก้ไขประกาศ",
  robots: { index: false, follow: false },
};

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const id = Number(params.id);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/marketplace/listing/${id}/edit`);

  const [{ data: listing }, { data: categories }, { data: provinces }] =
    await Promise.all([
      supabase
        .from("marketplace_listings")
        .select("id, title, description, category_id, province_id, price, price_type, condition, cover_url, image_urls, contact_phone_override, seller_id")
        .eq("id", id)
        .single(),
      supabase.from("marketplace_categories").select("id, name_th").eq("is_active", true).order("sort_order"),
      supabase.from("provinces").select("id, name_th").order("name_th"),
    ]);

  if (!listing) notFound();
  // แก้ไขได้เฉพาะเจ้าตัว (staff มีปุ่มซ่อน/ลบที่หน้ารายละเอียดและหน้าจัดการแทน)
  if (listing.seller_id !== user.id) redirect(`/marketplace/listing/${id}`);

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">แก้ไขประกาศ</h1>
        <Link href={`/marketplace/listing/${id}`} className="text-sm text-primary hover:underline">
          ← กลับไปประกาศ
        </Link>
      </div>
      {searchParams.error && (
        <p className="mb-4 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}
      <ListingForm
        action={updateListing}
        categories={categories ?? []}
        provinces={provinces ?? []}
        listingId={id}
        submitLabel="บันทึกการแก้ไข"
        defaults={{
          title: listing.title,
          description: listing.description,
          category_id: listing.category_id,
          province_id: listing.province_id,
          price: listing.price,
          price_type: listing.price_type,
          condition: listing.condition,
          cover_url: listing.cover_url,
          image_urls: listing.image_urls,
          contact_phone_override: listing.contact_phone_override,
        }}
      />
    </div>
  );
}
