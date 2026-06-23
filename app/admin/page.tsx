import Link from "next/link";
import { Users, MessageSquare, Newspaper, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ count: members }, { count: threads }, { count: news }, { count: events }, { data: roleRows }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("threads").select("*", { count: "exact", head: true }),
      supabase.from("news").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("role"),
    ]);

  const roleCount = (roleRows ?? []).reduce(
    (acc: Record<string, number>, r: any) => ((acc[r.role] = (acc[r.role] ?? 0) + 1), acc),
    {}
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">ภาพรวมระบบ</h1>

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
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-primary">{icon}<span className="text-xs text-on-surface-variant">{label}</span></div>
      <p className="mt-1 text-2xl font-bold text-primary">{value.toLocaleString("th-TH")}</p>
    </div>
  );
}

function RoleStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-on-surface">{value.toLocaleString("th-TH")}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
