import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createListing } from "@/app/marketplace/actions";
import { ListingForm } from "@/components/marketplace/listing-form";

export const metadata = {
  title: "ตั้งประกาศใหม่",
  robots: { index: false, follow: false },
};

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/marketplace/listing/new");

  const { data: seller } = await supabase
    .from("sellers")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (!seller) redirect("/marketplace/seller/register");
  if (seller.status !== "approved") redirect("/marketplace/seller/status");

  const [{ data: categories }, { data: provinces }] = await Promise.all([
    supabase
      .from("marketplace_categories")
      .select("id, name_th")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("provinces").select("id, name_th").order("name_th"),
  ]);

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">
          ตั้งประกาศใหม่
        </h1>
        <Link href="/marketplace/seller/dashboard" className="text-sm text-primary hover:underline">
          ← แดชบอร์ด
        </Link>
      </div>
      {searchParams.error && (
        <p className="mb-4 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}
      <ListingForm
        action={createListing}
        categories={categories ?? []}
        provinces={provinces ?? []}
        submitLabel="เผยแพร่ประกาศ"
      />
    </div>
  );
}
