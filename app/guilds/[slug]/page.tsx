import Link from "next/link";
import { notFound } from "next/navigation";
import { Shield, Users, AlertCircle, LogOut, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { joinGuild, leaveGuild } from "../actions";

export default async function GuildPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: guild } = await supabase
    .from("guilds")
    .select("id, name, slug, description, emblem_url, is_official, member_count, xp, created_at, owner_id, profiles(username, display_name)")
    .eq("slug", params.slug)
    .single();

  if (!guild) notFound();

  const [{ data: members }, { data: ranking }] = await Promise.all([
    supabase.from("guild_members")
      .select("role, joined_at, profiles(username, display_name, avatar_url, level_id, role)")
      .eq("guild_id", guild.id).order("joined_at"),
    supabase.from("guild_rankings").select("total_points").eq("id", guild.id).maybeSingle(),
  ]);
  const totalPoints = ranking?.total_points ?? 0;

  const { data: { user } } = await supabase.auth.getUser();
  let myGuildId: number | null = null;
  if (user) {
    const { data: mem } = await supabase.from("guild_members").select("guild_id").eq("user_id", user.id).maybeSingle();
    myGuildId = mem?.guild_id ?? null;
  }
  const isMember = myGuildId === guild.id;
  const inOtherGuild = myGuildId !== null && !isMember;
  const owner: any = guild.profiles;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {searchParams.error && (
        <p className="flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}

      {/* header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-on-primary">
            {guild.emblem_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={guild.emblem_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Shield className="h-10 w-10" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface sm:text-2xl">{guild.name}</h1>
              {guild.is_official && <span className="chip bg-amber-100 text-amber-800">ทางการ</span>}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {guild.member_count} สมาชิก</span>
              <span className="font-medium text-primary">{totalPoints.toLocaleString("th-TH")} แต้มรวม</span>
              {owner && <span>· หัวหน้า <Link href={`/u/${owner.username}`} className="text-primary hover:underline">{owner.display_name || owner.username}</Link></span>}
            </p>
          </div>

          <div className="shrink-0">
            {isMember ? (
              <form action={leaveGuild}>
                <input type="hidden" name="slug" value={guild.slug} />
                <button className="btn-outline gap-1"><LogOut className="h-4 w-4" /> ออกจากกิลด์</button>
              </form>
            ) : inOtherGuild ? (
              <span className="text-xs text-on-surface-variant">คุณอยู่กิลด์อื่นแล้ว<br />(ออกก่อนจึงจะเข้าใหม่ได้)</span>
            ) : (
              <form action={joinGuild}>
                <input type="hidden" name="slug" value={guild.slug} />
                <input type="hidden" name="guild_id" value={guild.id} />
                <button className="btn-accent gap-1"><UserPlus className="h-4 w-4" /> เข้าร่วมกิลด์</button>
              </form>
            )}
          </div>
        </div>

        {guild.description && <p className="mt-4 whitespace-pre-wrap text-sm text-on-surface">{guild.description}</p>}
      </div>

      {/* members */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">สมาชิกกิลด์ ({members?.length ?? 0})</h2>
        <div className="card divide-y divide-outline-variant">
          {(members ?? []).map((m: any) => {
            const p = m.profiles;
            const roleLabel = m.role === "leader" ? "หัวหน้า" : m.role === "officer" ? "ผู้ช่วย" : "สมาชิก";
            return (
              <Link key={p?.username} href={`/u/${p?.username}`} className="flex items-center gap-3 p-3 hover:bg-surface-container-low">
                <Avatar src={p?.avatar_url} name={p?.display_name || p?.username} role={p?.role} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p?.display_name || p?.username}</p>
                  <p className="text-xs text-on-surface-variant">@{p?.username}</p>
                </div>
                <span className="chip bg-surface-container text-on-surface-variant">{roleLabel}</span>
              </Link>
            );
          })}
          {(!members || members.length === 0) && (
            <p className="p-6 text-center text-sm text-on-surface-variant">ยังไม่มีสมาชิก</p>
          )}
        </div>
      </section>
    </div>
  );
}
