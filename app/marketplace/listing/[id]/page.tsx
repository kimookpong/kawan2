import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Edit,
  Eye,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { renderBBCode } from "@/lib/bbcode";
import { Avatar } from "@/components/avatar";
import { ReportButton } from "@/components/report-button";
import { JsonLd } from "@/components/seo/json-ld";
import { LevelBadge } from "@/components/user-badges";
import {
  CONDITION_LABEL,
  formatPrice,
  LISTING_STATUS_LABEL,
} from "@/lib/marketplace";
import { NEWS_FALLBACK_IMG, levelNameStyle } from "@/lib/constants";
import {
  createListingComment,
  deleteListingComment,
  setListingStatus,
  toggleFavorite,
} from "@/app/marketplace/actions";

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
      "id, title, description, price, price_type, condition, cover_url, image_urls, status, view_count, favorite_count, contact_phone_override, created_at, seller_id, sellers(shop_name, contact_phone, contact_line, contact_facebook, logo_url, provinces(name_th), profiles!sellers_id_fkey(username, display_name, avatar_url, role, level_id)), marketplace_categories(name_th, slug), provinces(name_th)",
    )
    .eq("id", id)
    .single();

  if (!l) notFound();
  await supabase.rpc("increment_listing_view", { p_listing: id }).then(() => {}, () => {});

  const { data: { user } } = await supabase.auth.getUser();
  let isOwner = false;
  let isStaff = false;
  let isFav = false;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStaff = me?.role === "admin" || me?.role === "editor";
    isOwner = user.id === l.seller_id;
    const { data: fav } = await supabase
      .from("marketplace_favorites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .maybeSingle();
    isFav = !!fav;
  }

  const { data: comments } = await supabase
    .from("listing_comments")
    .select(
      "id, body, created_at, author_id, profiles(username, display_name, avatar_url, role, level_id)",
    )
    .eq("listing_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: true });

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

          {/* ความเห็น */}
          <div id="comments" className="card mt-4 scroll-mt-20 p-5">
            <h2 className="mb-3 border-b border-outline-variant pb-2 text-lg font-bold">
              ความเห็น ({(comments ?? []).length})
            </h2>

            <div className="space-y-3">
              {(comments ?? []).map((c: any) => {
                const author = c.profiles;
                const name =
                  author?.display_name || author?.username || "สมาชิก";
                const canDelete =
                  user && (user.id === c.author_id || isStaff);
                return (
                  <div
                    key={c.id}
                    id={`comment-${c.id}`}
                    className="flex gap-3 scroll-mt-20"
                  >
                    <Link
                      href={author?.username ? `/u/${author.username}` : "#"}
                      className="shrink-0"
                    >
                      <Avatar
                        src={author?.avatar_url}
                        name={name}
                        role={author?.role}
                        size={36}
                      />
                    </Link>
                    <div className="min-w-0 flex-1 rounded-lg bg-surface-container-low p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            href={author?.username ? `/u/${author.username}` : "#"}
                            className="text-sm font-semibold hover:text-primary"
                            style={levelNameStyle(author?.level_id)}
                          >
                            {name}
                          </Link>
                          {author?.level_id && (
                            <LevelBadge levelId={author.level_id} />
                          )}
                          {c.author_id === l.seller_id && (
                            <span className="rounded bg-primary-container px-1.5 text-[10px] font-semibold text-on-primary-container">
                              ผู้ขาย
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          {new Date(c.created_at).toLocaleString("th-TH")}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface">
                        {c.body}
                      </p>
                      {canDelete && (
                        <form action={deleteListingComment} className="mt-1">
                          <input type="hidden" name="comment_id" value={c.id} />
                          <input type="hidden" name="listing_id" value={id} />
                          <button className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-error">
                            <Trash2 className="h-3 w-3" /> ลบ
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
              {(comments ?? []).length === 0 && (
                <p className="py-4 text-center text-sm text-on-surface-variant">
                  ยังไม่มีความเห็น เป็นคนแรกที่สอบถามได้เลย
                </p>
              )}
            </div>

            {user ? (
              <form
                action={createListingComment}
                className="mt-4 border-t border-outline-variant pt-3"
              >
                <input type="hidden" name="listing_id" value={id} />
                <textarea
                  name="body"
                  required
                  minLength={1}
                  maxLength={2000}
                  rows={3}
                  placeholder="ถามผู้ขาย หรือแสดงความเห็นเกี่ยวกับประกาศนี้..."
                  className="w-full rounded border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    ความเห็นนี้แสดงต่อทุกคน — สำหรับคุยส่วนตัวให้กด "ส่งข้อความ"
                  </span>
                  <button className="btn-primary text-sm">ส่งความเห็น</button>
                </div>
              </form>
            ) : (
              <p className="mt-4 border-t border-outline-variant pt-3 text-center text-sm text-on-surface-variant">
                <Link
                  href={`/auth/login?redirect=/marketplace/listing/${id}`}
                  className="text-primary hover:underline"
                >
                  เข้าสู่ระบบ
                </Link>
                {" "}เพื่อแสดงความเห็น
              </p>
            )}
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
              {!user && (
                <Link
                  href={`/auth/login?redirect=/marketplace/listing/${id}`}
                  className="btn-outline gap-1 text-sm"
                >
                  <Lock className="h-4 w-4" /> เข้าสู่ระบบเพื่อดูข้อมูลติดต่อ
                </Link>
              )}
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
              {isOwner && (
                <Link
                  href={`/marketplace/listing/${id}/edit`}
                  className="btn-outline gap-1 text-sm"
                >
                  <Edit className="h-4 w-4" /> แก้ไข
                </Link>
              )}
            </div>

            {(isOwner || isStaff) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-outline-variant pt-3">
                <span className="text-xs text-on-surface-variant">
                  {isOwner ? "เครื่องมือ:" : "ผู้ดูแล:"}
                </span>
                <form action={setListingStatus}>
                  <input type="hidden" name="listing_id" value={id} />
                  <input
                    type="hidden"
                    name="status"
                    value={l.status === "hidden" ? "available" : "hidden"}
                  />
                  <button className="btn-outline gap-1 text-xs">
                    {l.status === "hidden" ? "เปิดประกาศ" : "ซ่อนประกาศ"}
                  </button>
                </form>
                <form action={setListingStatus}>
                  <input type="hidden" name="listing_id" value={id} />
                  <input type="hidden" name="status" value="deleted" />
                  <button className="btn-outline gap-1 text-xs text-error">
                    ลบประกาศ
                  </button>
                </form>
              </div>
            )}

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
              {!user && (seller?.contact_line || seller?.contact_facebook) && (
                <p className="rounded bg-surface-container px-2 py-1.5 text-xs text-on-surface-variant">
                  <Lock className="mr-1 inline h-3 w-3" />
                  เข้าสู่ระบบเพื่อดูช่องทางติดต่อเพิ่มเติม
                </p>
              )}
              {user && seller?.contact_line && (
                <p>LINE: <span className="font-medium">{seller.contact_line}</span></p>
              )}
              {user && seller?.contact_facebook && (
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
