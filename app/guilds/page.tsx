import Link from "next/link";
import { Shield, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function GuildsPage() {
  const supabase = createClient();
  const { data: guilds } = await supabase
    .from("guild_rankings")
    .select("id, name, slug, description, emblem_url, is_official, member_count, xp, total_points")
    .order("total_points", { ascending: false })
    .order("member_count", { ascending: false })
    .limit(60);

  const { data: { user } } = await supabase.auth.getUser();
  let myGuildId: number | null = null;
  let canCreate = false;
  if (user) {
    const [{ data: mem }, { data: me }] = await Promise.all([
      supabase.from("guild_members").select("guild_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("role, membership_tier").eq("id", user.id).single(),
    ]);
    myGuildId = mem?.guild_id ?? null;
    canCreate = me?.role === "admin" || (me?.membership_tier && me.membership_tier !== "free");
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">กิลด์</h1>
          <p className="text-sm text-on-surface-variant">รวมกลุ่มชาวชายแดนใต้ — เข้าร่วมได้ทีละ 1 กิลด์</p>
        </div>
        {canCreate && (
          <Link href="/guilds/new" className="btn-accent inline-flex items-center gap-1"><Plus className="h-4 w-4" /> สร้างกิลด์</Link>
        )}
      </div>

      {!canCreate && user && (
        <p className="rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant">
          อยากสร้างกิลด์ของตัวเอง? ต้องเป็น <Link href="/membership" className="text-primary hover:underline">สมาชิกผู้สนับสนุน</Link> ก่อน
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(guilds ?? []).map((g: any, i: number) => (
          <Link key={g.id} href={`/guilds/${g.slug}`} className="card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card sm:p-5">
            <div className="flex items-center gap-3">
              <span className={`w-5 shrink-0 text-center text-base font-bold ${i < 3 ? "text-tertiary-container" : "text-outline"}`}>{i + 1}</span>
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-on-primary sm:h-12 sm:w-12">
                {g.emblem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.emblem_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Shield className="h-6 w-6" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate font-semibold text-on-surface">{g.name}</p>
                  {g.is_official && <span className="chip bg-amber-100 text-amber-800">ทางการ</span>}
                  {myGuildId === g.id && <span className="chip bg-primary-container/15 text-primary">ของคุณ</span>}
                </div>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {g.member_count}</span>
                  <span className="font-medium text-primary">{g.total_points.toLocaleString("th-TH")} แต้ม</span>
                </p>
              </div>
            </div>
            {g.description && <p className="mt-3 line-clamp-2 text-sm text-on-surface-variant">{g.description}</p>}
          </Link>
        ))}
        {(!guilds || guilds.length === 0) && (
          <p className="text-sm text-on-surface-variant">ยังไม่มีกิลด์ — เป็นกิลด์แรกของชุมชน!</p>
        )}
      </div>
    </div>
  );
}
