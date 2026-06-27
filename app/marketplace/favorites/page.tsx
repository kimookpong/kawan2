import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/marketplace/listing-card";

export const metadata = {
  title: "ประกาศที่บันทึก",
  robots: { index: false, follow: false },
};

export default async function MarketplaceFavoritesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/marketplace/favorites");

  const { data: favs } = await supabase
    .from("marketplace_favorites")
    .select(
      "listing_id, created_at, marketplace_listings(id, title, cover_url, price, price_type, condition, status, marketplace_categories(name_th), provinces(name_th))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (favs ?? [])
    .map((f: any) => f.marketplace_listings)
    .filter((l: any) => l && l.status !== "hidden" && l.status !== "deleted");

  return (
    <div className="w-full space-y-4">
      <h1 className="text-xl font-bold text-primary sm:text-2xl">
        ประกาศที่บันทึก
      </h1>

      {items.length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((l: any) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      ) : (
        <p className="card p-8 text-center text-sm text-on-surface-variant">
          ยังไม่มีรายการที่บันทึก — กดไอคอนหัวใจในประกาศเพื่อบันทึก
        </p>
      )}
    </div>
  );
}
