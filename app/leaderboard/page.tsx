import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEVEL_STYLES } from "@/lib/constants";

export const revalidate = 120;

export default async function LeaderboardPage() {
  const supabase = createClient();
  const { data: top } = await supabase
    .from("profiles")
    .select("username, display_name, reputation, level_id")
    .order("reputation", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-primary">หอเกียรติยศ</h1>
      <p className="text-sm text-on-surface-variant">จัดอันดับสมาชิกตามคะแนนสะสม</p>

      <div className="card divide-y divide-outline-variant">
        {(top ?? []).map((p, i) => {
          const lvl = LEVEL_STYLES[p.level_id];
          return (
            <Link key={p.username} href={`/u/${p.username}`} className="flex items-center gap-3 p-4 hover:bg-surface-container-low">
              <span className={`w-6 text-center font-bold ${i < 3 ? "text-tertiary-container" : "text-on-surface-variant"}`}>
                {i + 1}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-on-primary">
                {(p.display_name || p.username).charAt(0).toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="font-medium">{p.display_name || p.username}</p>
                {lvl && <span className={`chip ${lvl.cls}`}>{lvl.en}</span>}
              </div>
              <span className="font-bold text-primary">{p.reputation.toLocaleString("th-TH")}</span>
            </Link>
          );
        })}
        {(!top || top.length === 0) && (
          <p className="p-6 text-center text-sm text-on-surface-variant">ยังไม่มีข้อมูลสมาชิก</p>
        )}
      </div>
    </div>
  );
}
