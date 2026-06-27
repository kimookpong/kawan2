import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { approveSeller, rejectSeller } from "@/app/marketplace/actions";
import { SELLER_STATUS_LABEL } from "@/lib/marketplace";
import { Avatar } from "@/components/avatar";

export const metadata = {
  title: "อนุมัติผู้ขาย",
  robots: { index: false, follow: false },
};

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: { status?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin/marketplace/sellers");
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "editor") redirect("/");

  const filter = searchParams.status ?? "pending";
  const { data: sellers, error } = await supabase
    .from("sellers")
    .select(
      "id, shop_name, contact_phone, contact_line, contact_facebook, province_id, address, logo_url, description, status, rejection_reason, created_at, profiles!sellers_id_fkey(username, display_name, avatar_url, role), provinces(name_th)",
    )
    .eq("status", filter)
    .order("created_at", { ascending: false });
  if (error) console.error("admin sellers query error:", error);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">
          จัดการผู้ขาย
        </h1>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "suspended"] as const).map((s) => (
            <Link
              key={s}
              href={`/admin/marketplace/sellers?status=${s}`}
              className={`rounded px-3 py-1 text-sm ${
                filter === s
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {SELLER_STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </div>

      {searchParams.error && (
        <p className="rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}

      <div className="space-y-3">
        {(sellers ?? []).length === 0 ? (
          <p className="card p-6 text-center text-sm text-on-surface-variant">
            ไม่มีผู้ขายในสถานะนี้
          </p>
        ) : (
          (sellers ?? []).map((s: any) => {
            const p = s.profiles;
            return (
              <div key={s.id} className="card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar
                    src={p?.avatar_url}
                    name={p?.display_name || p?.username}
                    role={p?.role}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.shop_name}</p>
                    <p className="text-xs text-on-surface-variant">
                      โดย{" "}
                      <Link
                        href={`/u/${p?.username}`}
                        className="text-primary hover:underline"
                      >
                        @{p?.username}
                      </Link>
                      {" · "}ยื่นเมื่อ {new Date(s.created_at).toLocaleString("th-TH")}
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      <span>📞 {s.contact_phone}</span>
                      {s.contact_line && <span>LINE: {s.contact_line}</span>}
                      {s.contact_facebook && (
                        <a href={s.contact_facebook} target="_blank" className="truncate text-primary hover:underline" rel="noopener">
                          FB: {s.contact_facebook}
                        </a>
                      )}
                      {s.provinces && <span>📍 {s.provinces.name_th}</span>}
                      {s.address && <span className="truncate">{s.address}</span>}
                      {s.logo_url && (
                        <a href={s.logo_url} target="_blank" className="text-primary hover:underline" rel="noopener">
                          ดูโลโก้
                        </a>
                      )}
                    </div>
                    {s.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-on-surface-variant">
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>

                {filter === "pending" && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-outline-variant pt-3">
                    <form action={approveSeller}>
                      <input type="hidden" name="seller_id" value={s.id} />
                      <button className="btn-primary gap-1">
                        <Check className="h-4 w-4" /> อนุมัติ
                      </button>
                    </form>
                    <form action={rejectSeller} className="flex flex-1 items-center gap-2">
                      <input type="hidden" name="seller_id" value={s.id} />
                      <input
                        name="reason"
                        placeholder="เหตุผลที่ปฏิเสธ (จำเป็น)"
                        required
                        className="flex-1 rounded border border-outline-variant px-2 py-1.5 text-sm outline-none focus:border-primary"
                      />
                      <button className="btn-outline gap-1 text-error">
                        <X className="h-4 w-4" /> ปฏิเสธ
                      </button>
                    </form>
                  </div>
                )}
                {filter === "rejected" && s.rejection_reason && (
                  <p className="mt-2 rounded bg-error-container px-3 py-1.5 text-sm text-on-error-container">
                    เหตุผล: {s.rejection_reason}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
