import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/marketplace/listing-card";

export const revalidate = 30;

export const metadata = {
  title: "ตลาดซื้อขาย",
  description: "ตลาดซื้อขายของชุมชนชายแดนใต้",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { q?: string; province?: string; min?: string; max?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const q = (searchParams.q ?? "").trim();
  const provinceId = Number(searchParams.province) || null;
  const minPrice = Number(searchParams.min) || null;
  const maxPrice = Number(searchParams.max) || null;

  const archiveCutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  let query = supabase
    .from("marketplace_listings")
    .select(
      "id, title, cover_url, price, price_type, condition, status, created_at, marketplace_categories(name_th), provinces(name_th)",
    )
    .neq("status", "hidden")
    .neq("status", "deleted")
    // ซ่อนประกาศ sold ที่เก่ากว่า 30 วัน
    .or(`status.neq.sold,updated_at.gte.${archiveCutoff}`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(48);

  if (q) query = query.ilike("title", `%${q}%`);
  if (provinceId) query = query.eq("province_id", provinceId);
  if (minPrice != null) query = query.gte("price", minPrice);
  if (maxPrice != null) query = query.lte("price", maxPrice);

  const [{ data: listings }, { data: categories }, { data: provinces }, { data: mySeller }, { data: me }] =
    await Promise.all([
      query,
      supabase
        .from("marketplace_categories")
        .select("id, name_th, slug, icon")
        .eq("is_active", true)
        .order("sort_order"),
      supabase.from("provinces").select("id, name_th").order("name_th"),
      user
        ? supabase.from("sellers").select("status").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from("profiles").select("role").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);
  const isStaff = me?.role === "admin" || me?.role === "editor";

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">ตลาดซื้อขาย</h1>
        <div className="flex flex-wrap gap-2">
          {user && (
            <Link href="/marketplace/favorites" className="btn-outline text-sm">
              ที่บันทึก
            </Link>
          )}
          {isStaff && (
            <Link href="/admin/marketplace/listings" className="btn-outline text-sm">
              จัดการ
            </Link>
          )}
          {mySeller?.status === "approved" ? (
            <>
              <Link href="/marketplace/seller/dashboard" className="btn-outline text-sm">
                แดชบอร์ดของฉัน
              </Link>
              <Link href="/marketplace/listing/new" className="btn-primary inline-flex items-center gap-1 text-sm">
                <Plus className="h-4 w-4" /> ตั้งประกาศ
              </Link>
            </>
          ) : mySeller ? (
            <Link href="/marketplace/seller/status" className="btn-outline text-sm">
              สถานะผู้ขาย
            </Link>
          ) : user ? (
            <Link href="/marketplace/seller/register" className="btn-accent text-sm">
              สมัครเป็นผู้ขาย
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(categories ?? []).map((c: any) => (
          <Link
            key={c.id}
            href={`/marketplace/${c.slug}`}
            className="chip border border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary"
          >
            {c.name_th}
          </Link>
        ))}
      </div>

      <form action="/marketplace" method="get" className="card flex flex-wrap items-end gap-3 p-3">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
          <input
            name="q"
            defaultValue={q}
            placeholder="ค้นหาประกาศ..."
            className="w-full rounded border border-outline-variant py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          name="province"
          defaultValue={provinceId ?? ""}
          className="rounded border border-outline-variant px-2 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">ทุกจังหวัด</option>
          {(provinces ?? []).map((p: any) => (
            <option key={p.id} value={p.id}>{p.name_th}</option>
          ))}
        </select>
        <input
          name="min"
          type="number"
          min="0"
          placeholder="ราคาต่ำสุด"
          defaultValue={searchParams.min ?? ""}
          className="w-32 rounded border border-outline-variant px-2 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          name="max"
          type="number"
          min="0"
          placeholder="ราคาสูงสุด"
          defaultValue={searchParams.max ?? ""}
          className="w-32 rounded border border-outline-variant px-2 py-2 text-sm outline-none focus:border-primary"
        />
        <button className="btn-primary text-sm">ค้นหา</button>
      </form>

      {(listings ?? []).length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {(listings ?? []).map((l: any) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      ) : (
        <p className="card p-8 text-center text-sm text-on-surface-variant">
          ยังไม่มีประกาศที่ตรงเงื่อนไข
        </p>
      )}
    </div>
  );
}
