import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Pin, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setListingStatus } from "@/app/marketplace/actions";
import { adminToggleListingFlag } from "@/app/admin/marketplace/actions";
import {
  CONDITION_LABEL,
  formatPrice,
  LISTING_STATUS_LABEL,
} from "@/lib/marketplace";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";
import { ConfirmDeleteListing } from "@/components/marketplace/confirm-delete-listing";

export const metadata = {
  title: "จัดการประกาศ",
  robots: { index: false, follow: false },
};

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin/marketplace/listings");
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "editor") redirect("/");

  const filter = searchParams.status ?? "available";
  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select(
      "id, title, price, price_type, condition, status, cover_url, is_pinned, is_featured, view_count, favorite_count, created_at, sellers(shop_name, profiles(username))",
    )
    .eq("status", filter)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const STATUS_TABS = ["available", "reserved", "sold", "hidden", "deleted"] as const;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">จัดการประกาศ</h1>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((s) => (
            <Link
              key={s}
              href={`/admin/marketplace/listings?status=${s}`}
              className={`rounded px-3 py-1 text-sm ${
                filter === s
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {LISTING_STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </div>

      <div className="card divide-y divide-outline-variant">
        {(listings ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            ไม่มีประกาศในสถานะนี้
          </p>
        ) : (
          (listings ?? []).map((l: any) => {
            const seller = l.sellers;
            return (
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
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>{CONDITION_LABEL[l.condition]}</span>
                    {seller && (
                      <Link
                        href={`/u/${seller.profiles?.username}`}
                        className="text-primary hover:underline"
                      >
                        {seller.shop_name}
                      </Link>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {l.view_count}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <form action={adminToggleListingFlag}>
                    <input type="hidden" name="listing_id" value={l.id} />
                    <input type="hidden" name="flag" value="is_pinned" />
                    <input type="hidden" name="value" value={l.is_pinned ? "0" : "1"} />
                    <button
                      className={`rounded p-1.5 ${l.is_pinned ? "bg-tertiary-container text-on-tertiary-container" : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}
                      aria-label="ปักหมุด"
                      title="ปักหมุด"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={adminToggleListingFlag}>
                    <input type="hidden" name="listing_id" value={l.id} />
                    <input type="hidden" name="flag" value="is_featured" />
                    <input type="hidden" name="value" value={l.is_featured ? "0" : "1"} />
                    <button
                      className={`rounded p-1.5 ${l.is_featured ? "bg-amber-100 text-amber-700" : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}
                      aria-label="เด่น"
                      title="เด่น (Featured)"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={setListingStatus}>
                    <input type="hidden" name="listing_id" value={l.id} />
                    <input type="hidden" name="status" value={l.status === "hidden" ? "available" : "hidden"} />
                    <button
                      className="rounded border border-outline-variant p-1.5 text-on-surface-variant hover:bg-surface-container"
                      aria-label={l.status === "hidden" ? "เปิด" : "ซ่อน"}
                      title={l.status === "hidden" ? "เปิดประกาศ" : "ซ่อนประกาศ"}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </form>
                  <ConfirmDeleteListing listingId={l.id} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
