import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABEL: Record<string, string> = {
  dm: "ข้อความใหม่",
  reply: "มีคนตอบกระทู้ของคุณ",
  mention: "มีคนกล่าวถึงคุณ",
  badge: "คุณได้รับเหรียญรางวัล",
  level_up: "คุณเลื่อนระดับสมาชิก",
  ban: "บัญชีของคุณถูกระงับการใช้งาน",
};

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/notifications");

  const { data: notifs } = await supabase
    .from("notifications")
    .select("id, type, payload, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="w-full space-y-4">
      <h1 className="text-xl font-bold text-primary sm:text-2xl">การแจ้งเตือน</h1>
      <div className="card divide-y divide-outline-variant">
        {(notifs ?? []).map((n) => (
          <div key={n.id} className={`p-4 ${n.is_read ? "" : "bg-primary-container/5"}`}>
            <p className="text-sm font-medium">{TYPE_LABEL[n.type] ?? n.type}</p>
            <p className="text-xs text-on-surface-variant">
              {new Date(n.created_at).toLocaleString("th-TH")}
            </p>
          </div>
        ))}
        {(!notifs || notifs.length === 0) && (
          <p className="p-6 text-center text-sm text-on-surface-variant">ยังไม่มีการแจ้งเตือน</p>
        )}
      </div>
    </div>
  );
}
