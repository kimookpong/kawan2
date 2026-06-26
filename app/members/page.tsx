import Link from "next/link";
import { Search, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";
import { levelNameClass } from "@/lib/constants";

export const revalidate = 0;

export const metadata = {
  title: "ค้นหาสมาชิก",
  description: "ค้นหาสมาชิกของชุมชนชายแดนใต้จากชื่อหรือชื่อผู้ใช้",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { q?: string; tab?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const tab = searchParams.tab === "banned" ? "banned" : "all";
  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("username, display_name, reputation, level_id, role, avatar_url, banned_until");

  if (tab === "banned") {
    query = query
      .gt("banned_until", new Date().toISOString())
      .order("banned_until", { ascending: true })
      .limit(100);
  } else {
    query = query.order("reputation", { ascending: false }).limit(60);
    if (q) {
      const term = `%${q}%`;
      query = query.or(`username.ilike.${term},display_name.ilike.${term}`);
    }
  }

  const { data: members } = await query;

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-primary text-on-primary"
        : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
    }`;

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-xl font-bold text-primary sm:text-2xl">ค้นหาสมาชิก</h1>
        <p className="text-sm text-on-surface-variant">
          ค้นหาสมาชิกจากชื่อหรือชื่อผู้ใช้
        </p>
      </div>

      {/* แท็บ */}
      <div className="flex flex-wrap gap-2">
        <Link href="/members" className={tabClass(tab === "all")}>
          สมาชิก
        </Link>
        <Link href="/members?tab=banned" className={tabClass(tab === "banned")}>
          <Ban className="h-3.5 w-3.5" /> ติดโทษแบน
        </Link>
      </div>

      {tab === "all" && (
        <form action="/members" method="get" className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="พิมพ์ชื่อหรือชื่อผู้ใช้..."
            className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </form>
      )}

      <div className="card divide-y divide-outline-variant">
        {(members ?? []).map((p: any) => (
          <Link
            key={p.username}
            href={`/u/${p.username}`}
            className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-low"
          >
            <Avatar
              src={p.avatar_url}
              name={p.display_name || p.username}
              role={p.role}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <p className={`truncate font-medium ${levelNameClass(p.level_id)}`}>{p.display_name || p.username}</p>
              <div className="flex items-center gap-2">
                <span className="truncate text-xs text-on-surface-variant">
                  @{p.username}
                </span>
                <LevelBadge levelId={p.level_id} />
              </div>
            </div>
            {tab === "banned" ? (
              <span className="shrink-0 text-right text-xs font-medium text-error">
                <span className="inline-flex items-center gap-1">
                  <Ban className="h-3.5 w-3.5" /> ถูกแบน
                </span>
                <span className="block text-[10px] font-normal text-on-surface-variant">
                  ถึง {new Date(p.banned_until).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                </span>
              </span>
            ) : (
              <span className="shrink-0 text-sm font-bold text-primary">
                {p.reputation.toLocaleString("th-TH")}
              </span>
            )}
          </Link>
        ))}
        {(!members || members.length === 0) && (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            {tab === "banned"
              ? "ไม่มีสมาชิกที่ติดโทษแบนอยู่"
              : q
                ? `ไม่พบสมาชิกที่ตรงกับ "${q}"`
                : "ยังไม่มีข้อมูลสมาชิก"}
          </p>
        )}
      </div>
    </div>
  );
}
