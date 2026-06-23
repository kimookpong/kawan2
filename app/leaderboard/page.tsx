import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";

export const revalidate = 120;

export default async function LeaderboardPage() {
  const supabase = createClient();
  const { data: top } = await supabase
    .from("profiles")
    .select("username, display_name, reputation, level_id, role, avatar_url")
    .order("reputation", { ascending: false })
    .limit(50);

  return (
    <div className="w-full space-y-4">
      <h1 className="text-xl font-bold text-primary sm:text-2xl">หอเกียรติยศ</h1>
      <p className="text-sm text-on-surface-variant">จัดอันดับสมาชิกตามคะแนนสะสม</p>

      <div className="card divide-y divide-outline-variant">
        {(top ?? []).map((p, i) => (
          <Link key={p.username} href={`/u/${p.username}`} className="flex items-center gap-3 p-4 hover:bg-surface-container-low">
            <span className={`w-6 text-center font-bold ${i < 3 ? "text-tertiary-container" : "text-on-surface-variant"}`}>
              {i + 1}
            </span>
            <Avatar src={(p as any).avatar_url} name={p.display_name || p.username} role={(p as any).role} size={36} />
            <div className="flex-1">
              <p className="font-medium">{p.display_name || p.username}</p>
              <LevelBadge levelId={p.level_id} />
            </div>
            <span className="font-bold text-primary">{p.reputation.toLocaleString("th-TH")}</span>
          </Link>
        ))}
        {(!top || top.length === 0) && (
          <p className="p-6 text-center text-sm text-on-surface-variant">ยังไม่มีข้อมูลสมาชิก</p>
        )}
      </div>
    </div>
  );
}
