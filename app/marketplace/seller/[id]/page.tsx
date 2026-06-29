import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { ListingCard } from "@/components/marketplace/listing-card";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: s } = await supabase
    .from("sellers")
    .select("shop_name, logo_url, cover_url")
    .eq("id", params.id)
    .eq("status", "approved")
    .maybeSingle();
    
  const image = s?.logo_url || s?.cover_url || undefined;
  
  return {
    title: s?.shop_name ?? "ผู้ขาย",
    description: s ? `ร้าน ${s.shop_name}` : undefined,
    openGraph: {
      title: s?.shop_name ?? "ผู้ขาย",
      description: s ? `ร้าน ${s.shop_name}` : undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function SellerPublicPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: seller } = await supabase
    .from("sellers")
    .select(
      "id, shop_name, description, contact_phone, contact_line, contact_facebook, logo_url, address, status, created_at, profiles!sellers_id_fkey(username, display_name, avatar_url, role, level_id), provinces(name_th)",
    )
    .eq("id", params.id)
    .eq("status", "approved")
    .maybeSingle();

  if (!seller) notFound();

  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select(
      "id, title, cover_url, price, price_type, condition, status, marketplace_categories(name_th), provinces(name_th)",
    )
    .eq("seller_id", params.id)
    .neq("status", "hidden")
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(60);

  const profile: any = seller.profiles;
  const province: any = Array.isArray(seller.provinces)
    ? seller.provinces[0]
    : seller.provinces;

  return (
    <div className="w-full space-y-4">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> กลับตลาด
      </Link>

      <div className="card flex flex-col items-start gap-4 p-5 sm:flex-row">
        <Avatar
          src={seller.logo_url || profile?.avatar_url}
          name={seller.shop_name}
          role={profile?.role}
          size={72}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-on-surface sm:text-2xl">
            {seller.shop_name}
          </h1>
          {profile?.username && (
            <Link
              href={`/u/${profile.username}`}
              className="text-sm text-primary hover:underline"
            >
              @{profile.username}
            </Link>
          )}
          <div className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {province && (
              <span className="flex items-center gap-1 text-on-surface-variant">
                <MapPin className="h-3.5 w-3.5" /> {province.name_th}
                {seller.address ? ` · ${seller.address}` : ""}
              </span>
            )}
            {seller.contact_phone && (
              <span className="flex items-center gap-1 text-on-surface-variant">
                <Phone className="h-3.5 w-3.5" /> {seller.contact_phone}
              </span>
            )}
            {seller.contact_line && (
              <span className="text-on-surface-variant">
                LINE: {seller.contact_line}
              </span>
            )}
            {seller.contact_facebook && (
              <a
                href={seller.contact_facebook}
                target="_blank"
                rel="noopener"
                className="truncate text-primary hover:underline"
              >
                Facebook
              </a>
            )}
          </div>
          {seller.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-on-surface">
              {seller.description}
            </p>
          )}
          <p className="mt-2 text-xs text-on-surface-variant">
            เปิดร้านเมื่อ {new Date(seller.created_at).toLocaleDateString("th-TH")}
          </p>
          {user && user.id !== seller.id && (
            <div className="mt-3">
              <Link
                href={`/messages/new?to=${seller.id}`}
                className="btn-primary inline-flex items-center gap-1 text-sm"
              >
                <MessageCircle className="h-4 w-4" /> ส่งข้อความถึงร้าน
              </Link>
            </div>
          )}
        </div>
      </div>

      <h2 className="border-l-4 border-tertiary-container pl-3 text-lg font-bold">
        ประกาศของร้าน ({(listings ?? []).length})
      </h2>

      {(listings ?? []).length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {(listings ?? []).map((l: any) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      ) : (
        <p className="card p-8 text-center text-sm text-on-surface-variant">
          ร้านนี้ยังไม่มีประกาศ
        </p>
      )}
    </div>
  );
}
