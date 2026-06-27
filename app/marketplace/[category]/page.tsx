import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/marketplace/listing-card";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("marketplace_categories")
    .select("name_th")
    .eq("slug", params.category)
    .single();
  if (!c) return { title: "ไม่พบหมวด" };
  return {
    title: c.name_th,
    description: `ประกาศซื้อขาย: ${c.name_th}`,
  };
}

export default async function MarketplaceCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const supabase = createClient();
  const { data: category } = await supabase
    .from("marketplace_categories")
    .select("id, name_th, slug")
    .eq("slug", params.category)
    .single();
  if (!category) notFound();

  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select(
      "id, title, cover_url, price, price_type, condition, status, created_at, marketplace_categories(name_th), provinces(name_th)",
    )
    .eq("category_id", category.id)
    .neq("status", "hidden")
    .neq("status", "deleted")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <div className="w-full space-y-4">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> กลับตลาด
      </Link>
      <h1 className="text-xl font-bold text-primary sm:text-2xl">
        {category.name_th}
      </h1>

      {(listings ?? []).length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {(listings ?? []).map((l: any) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      ) : (
        <p className="card p-8 text-center text-sm text-on-surface-variant">
          ยังไม่มีประกาศในหมวดนี้
        </p>
      )}
    </div>
  );
}
