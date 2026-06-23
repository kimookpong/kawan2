import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, Users, LayoutDashboard, Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/** ป้องกันโซน /admin — เฉพาะ role = admin เท่านั้น */
export const metadata = {
  title: "ผู้ดูแลระบบ",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Shield className="mx-auto h-10 w-10 text-error" />
        <h1 className="mt-3 text-xl font-bold">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-1 text-sm text-on-surface-variant">หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น</p>
        <Link href="/" className="btn-primary mt-6">กลับหน้าแรก</Link>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-6 md:grid-cols-[220px_1fr]">
      <aside className="md:border-r md:border-outline-variant md:pr-4">
        <div className="mb-3 flex items-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          <span className="font-bold">แผงผู้ดูแล</span>
        </div>
        <nav className="flex gap-1 md:flex-col">
          <Link href="/admin" className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-primary">
            <LayoutDashboard className="h-4 w-4" /> ภาพรวม
          </Link>
          <Link href="/admin/users" className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-primary">
            <Users className="h-4 w-4" /> จัดการสมาชิก
          </Link>
          <Link href="/admin/levels" className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-primary">
            <Gauge className="h-4 w-4" /> ระดับสมาชิก
          </Link>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
