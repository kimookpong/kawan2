import Link from "next/link";
import { Shield, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function GuildsPage() {
  const supabase = createClient();
  const { data: guilds } = await supabase
    .from("guilds")
    .select("id, name, slug, description, emblem_url, is_official, member_count, xp")
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
          <h1 className="text-2xl font-bold text-primary">กิลด์</h1>
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
        {(guilds ?? []).map((g) => (
          <Link key={g.id} href={`/guilds/${g.slug}`} className="card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-on-primary">
                {g.emblem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.emblem_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Shield className="h-6 w-6" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold text-on-surface">{g.name}</p>
                  {g.is_official && <span className="chip bg-amber-100 text-amber-800">ทางการ</span>}
                  {myGuildId === g.id && <span className="chip bg-primary-container/15 text-primary">กิลด์ของคุณ</span>}
                </div>
                <p className="flex items-center gap-1 text-xs text-on-surface-variant"><Users className="h-3.5 w-3.5" /> {g.member_count} สมาชิก · XP {g.xp}</p>
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
