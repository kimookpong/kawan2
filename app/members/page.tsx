import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";

export const revalidate = 0;

export const metadata = {
  title: "ค้นหาสมาชิก",
  description: "ค้นหาสมาชิกของชุมชนชายแดนใต้จากชื่อหรือชื่อผู้ใช้",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("username, display_name, reputation, level_id, role, avatar_url")
    .order("reputation", { ascending: false })
    .limit(60);

  if (q) {
    const term = `%${q}%`;
    query = query.or(`username.ilike.${term},display_name.ilike.${term}`);
  }

  const { data: members } = await query;

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-xl font-bold text-primary sm:text-2xl">ค้นหาสมาชิก</h1>
        <p className="text-sm text-on-surface-variant">ค้นหาสมาชิกจากชื่อหรือชื่อผู้ใช้</p>
      </div>

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

      <div className="card divide-y divide-outline-variant">
        {(members ?? []).map((p) => (
          <Link
            key={p.username}
            href={`/u/${p.username}`}
            className="flex items-center gap-3 p-4 hover:bg-surface-container-low"
          >
            <Avatar src={(p as any).avatar_url} name={p.display_name || p.username} role={(p as any).role} size={40} />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{p.display_name || p.username}</p>
              <div className="flex items-center gap-2">
                <span className="truncate text-xs text-on-surface-variant">@{p.username}</span>
                <LevelBadge levelId={p.level_id} />
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-primary">
              {p.reputation.toLocaleString("th-TH")}
            </span>
          </Link>
        ))}
        {(!members || members.length === 0) && (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            {q ? `ไม่พบสมาชิกที่ตรงกับ "${q}"` : "ยังไม่มีข้อมูลสมาชิก"}
          </p>
        )}
      </div>
    </div>
  );
}
