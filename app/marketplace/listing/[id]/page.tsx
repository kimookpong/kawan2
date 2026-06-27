import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Edit,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { renderBBCode } from "@/lib/bbcode";
import { Avatar } from "@/components/avatar";
import { ReportButton } from "@/components/report-button";
import { JsonLd } from "@/components/seo/json-ld";
import { CONDITION_LABEL, formatPrice, LISTING_STATUS_LABEL } from "@/lib/marketplace";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";
import { toggleFavorite } from "@/app/marketplace/actions";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: l } = await supabase
    .from("marketplace_listings")
    .select("title, description")
    .eq("id", Number(params.id))
    .single();
  if (!l) return { title: "ไม่พบประกาศ" };
  const desc = (l.description ?? "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return {
    title: l.title,
    description: desc || undefined,
    alternates: { canonical: `/marketplace/listing/${params.id}` },
  };
}

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const id = Number(params.id);

  const { data: l } = await supabase
    .from("marketplace_listings")
    .select(
      "id, title, description, price, price_type, condition, cover_url, image_urls, status, view_count, favorite_count, contact_phone_override, created_at, seller_id, sellers(shop_name, contact_phone, contact_line, contact_facebook, logo_url, provinces(name_th), profiles(username, display_name, avatar_url, role, level_id)), marketplace_categories(name_th, slug), provinces(name_th)",
    )
    .eq("id", id)
    .single();

  if (!l) notFound();
  await supabase.rpc("increment_listing_view", { p_listing: id }).then(() => {}, () => {});

  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;
  let isFav = false;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    canEdit =
      user.id === l.seller_id || me?.role === "admin" || me?.role === "editor";
    const { data: fav } = await supabase
      .from("marketplace_favorites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .maybeSingle();
    isFav = !!fav;
  }

  const seller: any = l.sellers;
  const sellerProfile: any = seller?.profiles;
  const cat: any = l.marketplace_categories;
  const province: any = Array.isArray(l.provinces) ? l.provinces[0] : l.provinces;
  const allImages = [l.cover_url, ...(l.image_urls ?? [])].filter(Boolean) as string[];
  const phone = l.contact_phone_override || seller?.contact_phone;

  return (
    <div className="w-full space-y-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: l.title,
          image: allImages,
          offers: {
            "@type": "Offer",
            price: l.price ?? undefined,
            priceCurrency: "THB",
            availability:
              l.status === "sold"
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock",
          },
        }}
      />

      <nav className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
        <Link href="/" className="hover:text-primary">หน้าแรก</Link>
        <span>›</span>
        <Link href="/marketplace" className="hover:text-primary">ตลาดซื้อขาย</Link>
        {cat && (
          <>
            <span>›</span>
            <Link href={`/marketplace/${cat.slug}`} className="hover:text-primary">
              {cat.name_th}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ภาพ gallery */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="aspect-square w-full overflow-hidden bg-surface-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={allImages[0] || NEWS_FALLBACK_IMG}
                alt={l.title}
                className="h-full w-full object-cover"
              />
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-1 p-1">
                {allImages.slice(1).map((u, i) => (
                  <a
                    key={i}
                    href={u}
                    target="_blank"
                    rel="noopener"
                    className="block aspect-square overflow-hidden rounded bg-surface-container"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u}
                      alt=""
                      className="h-full w-full object-cover transition hover:scale-105"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* รายละเอียด */}
          <div className="card mt-4 p-5">
            <h2 className="mb-2 text-lg font-bold">รายละเอียด</h2>
            <div
              className="bbcode text-on-surface"
              dangerouslySetInnerHTML={{ __html: renderBBCode(l.description) }}
            />
          </div>
        </div>

        {/* sidebar info */}
        <div className="space-y-4">
          <div className="card p-5">
            {l.status !== "available" && (
              <span className="mb-2 inline-block rounded bg-error px-2 py-0.5 text-xs font-bold text-on-error">
                {LISTING_STATUS_LABEL[l.status]}
              </span>
            )}
            <h1 className="text-xl font-bold text-on-surface">{l.title}</h1>
            <p className="mt-2 text-2xl font-bold text-primary">
              {formatPrice(l.price, l.price_type)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-on-surface-variant">
              <span>สภาพ: {CONDITION_LABEL[l.condition] ?? l.condition}</span>
              {province && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {province.name_th}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {l.view_count} เข้าชม
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> {l.favorite_count} ถูกใจ
              </span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              ลงประกาศเมื่อ {new Date(l.created_at).toLocaleString("th-TH")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant pt-3">
              {user && phone && (
                <a href={`tel:${phone}`} className="btn-outline gap-1 text-sm">
                  <Phone className="h-4 w-4" /> {phone}
                </a>
              )}
              {user && user.id !== l.seller_id && (
                <Link
                  href={`/messages/new?to=${l.seller_id}&listing=${id}`}
                  className="btn-primary gap-1 text-sm"
                >
                  <MessageCircle className="h-4 w-4" /> ส่งข้อความ
                </Link>
              )}
              {user && (
                <form action={toggleFavorite}>
                  <input type="hidden" name="listing_id" value={id} />
                  <button
                    className={`btn-outline gap-1 text-sm ${isFav ? "text-rose-500" : ""}`}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                    {isFav ? "บันทึกแล้ว" : "บันทึก"}
                  </button>
                </form>
              )}
              {canEdit && (
                <Link
                  href={`/marketplace/listing/${id}/edit`}
                  className="btn-outline gap-1 text-sm"
                >
                  <Edit className="h-4 w-4" /> แก้ไข
                </Link>
              )}
            </div>
            <div className="mt-2 flex justify-end">
              <ReportButton targetType="listing" targetId={id} />
            </div>
          </div>

          {/* ร้านค้า */}
          <div className="card p-5">
            <p className="mb-2 text-xs font-semibold text-on-surface-variant">
              ผู้ขาย
            </p>
            <Link
              href={`/marketplace/seller/${l.seller_id}`}
              className="flex items-center gap-3 hover:opacity-90"
            >
              <Avatar
                src={seller?.logo_url || sellerProfile?.avatar_url}
                name={seller?.shop_name || sellerProfile?.username}
                role={sellerProfile?.role}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold hover:text-primary">
                  {seller?.shop_name ?? "ผู้ขาย"}
                </p>
                {sellerProfile?.username && (
                  <span className="block truncate text-xs text-on-surface-variant">
                    @{sellerProfile.username}
                  </span>
                )}
                {seller?.provinces?.name_th && (
                  <p className="text-xs text-on-surface-variant">
                    {seller.provinces.name_th}
                  </p>
                )}
              </div>
            </Link>
            <div className="mt-3 space-y-1 text-sm">
              {seller?.contact_line && (
                <p>LINE: <span className="font-medium">{seller.contact_line}</span></p>
              )}
              {seller?.contact_facebook && (
                <a
                  href={seller.contact_facebook}
                  target="_blank"
                  rel="noopener"
                  className="block truncate text-primary hover:underline"
                >
                  Facebook ของร้าน
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
