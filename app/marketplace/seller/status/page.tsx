import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "สถานะผู้ขาย",
  robots: { index: false, follow: false },
};

const STATUS_META: Record<
  string,
  { Icon: any; color: string; label: string; description: string }
> = {
  pending: {
    Icon: Clock,
    color: "text-amber-500",
    label: "รออนุมัติ",
    description: "ใบสมัครของคุณอยู่ระหว่างการตรวจสอบ — แอดมินจะแจ้งผลผ่านการแจ้งเตือน",
  },
  approved: {
    Icon: CheckCircle2,
    color: "text-green-600",
    label: "อนุมัติแล้ว",
    description: "คุณสามารถตั้งประกาศขายได้แล้ว",
  },
  rejected: {
    Icon: XCircle,
    color: "text-error",
    label: "ถูกปฏิเสธ",
    description: "ใบสมัครไม่ผ่านการพิจารณา — แก้ไขข้อมูลแล้วยื่นใหม่ได้",
  },
  suspended: {
    Icon: Ban,
    color: "text-error",
    label: "ถูกระงับ",
    description: "บัญชีผู้ขายของคุณถูกระงับการใช้งาน",
  },
};

export default async function SellerStatusPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/marketplace/seller/status");

  const { data: seller } = await supabase
    .from("sellers")
    .select("status, shop_name, rejection_reason, approved_at, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!seller) {
    return (
      <div className="w-full max-w-2xl">
        <h1 className="mb-4 text-xl font-bold text-primary sm:text-2xl">สถานะผู้ขาย</h1>
        <div className="card p-6 text-center">
          <p className="mb-4 text-sm text-on-surface-variant">
            คุณยังไม่ได้สมัครเป็นผู้ขาย
          </p>
          <Link href="/marketplace/seller/register" className="btn-primary inline-block">
            สมัครเป็นผู้ขาย
          </Link>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[seller.status] ?? STATUS_META.pending;
  const Icon = meta.Icon;

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-primary sm:text-2xl">สถานะผู้ขาย</h1>

      <div className="card p-6">
        <div className="flex items-start gap-3">
          <Icon className={`h-8 w-8 shrink-0 ${meta.color}`} />
          <div className="flex-1">
            <p className="text-lg font-bold">{meta.label}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{meta.description}</p>
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t border-outline-variant pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">ชื่อร้าน</span>
            <span className="font-medium">{seller.shop_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">วันที่ยื่นสมัคร</span>
            <span>{new Date(seller.created_at).toLocaleDateString("th-TH")}</span>
          </div>
          {seller.approved_at && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">วันที่อนุมัติ/พิจารณา</span>
              <span>{new Date(seller.approved_at).toLocaleDateString("th-TH")}</span>
            </div>
          )}
          {seller.status === "rejected" && seller.rejection_reason && (
            <div className="mt-3 rounded border border-error-container bg-error-container px-3 py-2 text-on-error-container">
              <p className="font-semibold">เหตุผลที่ปฏิเสธ:</p>
              <p>{seller.rejection_reason}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant pt-4">
          {seller.status === "approved" && (
            <>
              <Link href="/marketplace/seller/dashboard" className="btn-primary">
                ไปแดชบอร์ดผู้ขาย
              </Link>
              <Link href="/marketplace/listing/new" className="btn-outline">
                ตั้งประกาศใหม่
              </Link>
            </>
          )}
          {(seller.status === "rejected" || seller.status === "approved") && (
            <Link href="/marketplace/seller/register" className="btn-outline">
              แก้ไขข้อมูลร้าน
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
