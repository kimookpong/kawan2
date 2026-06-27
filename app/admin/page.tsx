import Link from "next/link";
import {
  Users,
  MessageSquare,
  Newspaper,
  CalendarDays,
  Store,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = createClient();

  const [
    { count: members },
    { count: threads },
    { count: news },
    { count: events },
    { data: roleRows },
    { count: pendingSellers },
    { count: approvedSellers },
    { count: activeListings },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("threads").select("*", { count: "exact", head: true }),
    supabase.from("news").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("role"),
    supabase
      .from("sellers")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("sellers")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("marketplace_listings")
      .select("*", { count: "exact", head: true })
      .in("status", ["available", "reserved"]),
  ]);

  const roleCount = (roleRows ?? []).reduce(
    (acc: Record<string, number>, r: any) => ((acc[r.role] = (acc[r.role] ?? 0) + 1), acc),
    {}
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-primary sm:text-2xl">ภาพรวมระบบ</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="สมาชิก" value={members ?? 0} />
        <StatCard icon={<MessageSquare className="h-5 w-5" />} label="กระทู้" value={threads ?? 0} />
        <StatCard icon={<Newspaper className="h-5 w-5" />} label="ข่าว" value={news ?? 0} />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="กิจกรรม" value={events ?? 0} />
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">สมาชิกแยกตามสิทธิ์</h2>
        <div className="flex flex-wrap gap-6">
          <RoleStat label="แอดมิน" value={roleCount.admin ?? 0} />
          <RoleStat label="บรรณาธิการ" value={roleCount.editor ?? 0} />
          <RoleStat label="สมาชิก" value={roleCount.member ?? 0} />
        </div>
        <Link href="/admin/users" className="btn-primary mt-4 inline-flex">จัดการสมาชิก</Link>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">ตลาดซื้อขาย</h2>
        <div className="grid grid-cols-3 gap-4">
          <RoleStat label="ผู้ขายรออนุมัติ" value={pendingSellers ?? 0} />
          <RoleStat label="ผู้ขายอนุมัติแล้ว" value={approvedSellers ?? 0} />
          <RoleStat label="ประกาศที่กำลังขาย" value={activeListings ?? 0} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/marketplace/sellers"
            className={`inline-flex items-center gap-1 ${(pendingSellers ?? 0) > 0 ? "btn-primary" : "btn-outline"}`}
          >
            <Store className="h-4 w-4" /> อนุมัติผู้ขาย
            {(pendingSellers ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-on-primary px-1.5 text-xs font-bold text-primary">
                {pendingSellers}
              </span>
            )}
          </Link>
          <Link
            href="/admin/marketplace/listings"
            className="btn-outline inline-flex items-center gap-1"
          >
            <ShoppingBag className="h-4 w-4" /> จัดการประกาศ
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-primary">{icon}<span className="text-xs text-on-surface-variant">{label}</span></div>
      <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">{value.toLocaleString("th-TH")}</p>
    </div>
  );
}

function RoleStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-bold text-on-surface sm:text-2xl">{value.toLocaleString("th-TH")}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
