import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, Eye, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, LISTING_STATUS_LABEL } from "@/lib/marketplace";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";
import { StatusSelector } from "@/components/marketplace/status-selector";

export const metadata = {
  title: "แดชบอร์ดผู้ขาย",
  robots: { index: false, follow: false },
};

export default async function SellerDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/marketplace/seller/dashboard");

  const { data: seller } = await supabase
    .from("sellers")
    .select("status, shop_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!seller) redirect("/marketplace/seller/register");
  if (seller.status !== "approved") redirect("/marketplace/seller/status");

  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, price_type, status, cover_url, view_count, favorite_count, created_at")
    .eq("seller_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">
            แดชบอร์ดผู้ขาย
          </h1>
          <p className="text-sm text-on-surface-variant">{seller.shop_name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/marketplace/seller/register" className="btn-outline">
            แก้ไขข้อมูลร้าน
          </Link>
          <Link href="/marketplace/listing/new" className="btn-primary inline-flex items-center gap-1">
            <Plus className="h-4 w-4" /> ตั้งประกาศใหม่
          </Link>
        </div>
      </div>

      <div className="card divide-y divide-outline-variant">
        {(listings ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            ยังไม่มีประกาศ — กด "ตั้งประกาศใหม่" เพื่อเริ่ม
          </p>
        ) : (
          (listings ?? []).map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.cover_url || NEWS_FALLBACK_IMG}
                alt=""
                className="h-16 w-16 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/marketplace/listing/${l.id}`}
                  className="block truncate font-medium hover:text-primary"
                >
                  {l.title}
                </Link>
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(l.price, l.price_type)}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="rounded bg-surface-container px-2 py-0.5">
                    {LISTING_STATUS_LABEL[l.status] ?? l.status}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {l.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {l.favorite_count}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                <Link
                  href={`/marketplace/listing/${l.id}/edit`}
                  className="btn-outline gap-1 text-xs"
                >
                  <Edit className="h-3.5 w-3.5" /> แก้ไข
                </Link>
                <StatusSelector listingId={l.id} current={l.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
