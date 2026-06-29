import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Award,
  MessageSquare,
  MessagesSquare,
  Ban,
  Swords,
  MapPin,
  CalendarDays,
  Trophy,
  Medal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";
import { ModerationPanel } from "@/components/moderation-panel";
import { JsonLd } from "@/components/seo/json-ld";
import { ThreadListItem } from "@/components/board/thread-list-item";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("username", params.username)
    .single();
  if (!p) return { title: "ไม่พบสมาชิก" };
  const name = p.display_name || p.username;
  const desc = (p.bio ?? `โปรไฟล์ของ ${name} บน Kawan2`).slice(0, 160);
  return {
    title: `${name} (@${p.username})`,
    description: desc,
    alternates: { canonical: `/u/${params.username}` },
    openGraph: {
      type: "profile",
      title: `${name} (@${p.username})`,
      description: desc,
      images: p.avatar_url ? [p.avatar_url] : undefined,
    },
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { ok?: string; error?: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, reputation, level_id, role, disabled, banned_until, created_at, provinces(name_th)",
    )
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSelf = user?.id === profile.id;

  // สิทธิ์ของผู้ชม (เจ้าหน้าที่)
  let viewerRole: string | null = null;
  if (user && !isSelf) {
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    viewerRole = me?.role ?? null;
  }
  const isStaff = viewerRole === "admin" || viewerRole === "editor";
  const isBanned = profile.banned_until
    ? new Date(profile.banned_until).getTime() > Date.now()
    : false;

  const [
    { count: threadCount },
    { count: postCount },
    { data: badges },
    { data: nextLevel },
    { data: recentThreads },
    { data: recentPosts },
  ] = await Promise.all([
    supabase
      .from("threads")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id),
    supabase
      .from("user_badges")
      .select("badges(name_th, icon, description)")
      .eq("user_id", profile.id),
    supabase
      .from("membership_levels")
      .select("min_points, name_th")
      .gt("min_points", profile.reputation)
      .order("min_points")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("threads")
      .select(
        "id, title, created_at, reply_count, like_count, view_count, is_pinned, categories(name_th, slug)",
      )
      .eq("author_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("posts")
      .select(
        "id, body, created_at, thread_id, threads(id, title, categories(name_th, slug))",
      )
      .eq("author_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const { data: guildMem } = await supabase
    .from("guild_members")
    .select("role, guilds(name, slug)")
    .eq("user_id", profile.id)
    .maybeSingle();
  const guild: any = guildMem?.guilds ?? null;

  const progress = nextLevel
    ? Math.min(
        100,
        Math.round((profile.reputation / nextLevel.min_points) * 100),
      )
    : 100;

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.app";
  const pName = profile.display_name || profile.username;

  return (
    <div className="w-full space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          dateCreated: profile.created_at ?? undefined,
          mainEntity: {
            "@type": "Person",
            name: pName,
            alternateName: `@${profile.username}`,
            description: profile.bio ?? undefined,
            image: profile.avatar_url ?? undefined,
            url: `${SITE}/u/${profile.username}`,
          },
        }}
      />

      {searchParams.ok && (
        <p className="rounded border border-primary/30 bg-primary-container/5 px-4 py-2 text-sm text-primary">
          ดำเนินการเรียบร้อย
        </p>
      )}
      {searchParams.error && (
        <p className="rounded border border-error-container bg-error-container px-4 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}

      {/* สถานะถูกระงับ/ปิดบัญชี */}
      {(isBanned || profile.disabled) && (
        <p className="flex items-center gap-2 rounded border border-error-container bg-error-container px-4 py-2 text-sm text-on-error-container">
          <Ban className="h-4 w-4" />
          {profile.disabled
            ? "บัญชีนี้ถูกปิดใช้งาน"
            : `สมาชิกนี้ถูกระงับการใช้งานถึง ${new Date(profile.banned_until!).toLocaleString("th-TH")}`}
        </p>
      )}

      {/* แผงเจ้าหน้าที่ */}
      {isStaff && (
        <ModerationPanel
          targetId={profile.id}
          username={profile.username}
          targetRole={profile.role}
          isAdmin={viewerRole === "admin"}
          bannedUntil={profile.banned_until}
          disabled={profile.disabled}
        />
      )}

      {/* header */}
      <div className="card overflow-hidden">
        {/* banner */}
        <div className="relative h-28 bg-gradient-to-br from-primary via-primary to-tertiary-container sm:h-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
        </div>

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          {/* avatar + name + actions */}
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
              <span className="rounded-full bg-surface-container-lowest ring-4 ring-surface-container-lowest">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.display_name || profile.username}
                  role={profile.role}
                  size={96}
                />
              </span>
              <div className="min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold text-on-surface sm:text-2xl">
                    {profile.display_name || profile.username}
                  </h1>
                  <LevelBadge levelId={profile.level_id} showTier />
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-on-surface-variant">
                  <span>@{profile.username}</span>
                  {(profile as any).provinces?.name_th && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {(profile as any).provinces.name_th}
                    </span>
                  )}
                  {guild && (
                    <Link
                      href={`/guilds/${guild.slug}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Swords className="h-3.5 w-3.5" />
                      {guild.name}
                    </Link>
                  )}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-on-surface-variant">
                  <CalendarDays className="h-3 w-3" />
                  เข้าร่วมเมื่อ{" "}
                  {new Date(profile.created_at).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:pb-1">
              {isSelf ? (
                <Link href="/me" className="btn-outline text-sm">
                  แก้ไขโปรไฟล์
                </Link>
              ) : (
                user && (
                  <Link
                    href={`/messages/new?to=${profile.id}`}
                    className="btn-accent inline-flex items-center gap-1 text-sm"
                  >
                    <MessageSquare className="h-4 w-4" /> ส่งข้อความ
                  </Link>
                )
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-surface-container-low p-3 text-sm text-on-surface">
              {profile.bio}
            </p>
          )}

          {/* progress level */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-tertiary-container" />
                คะแนนสะสม{" "}
                <span className="font-semibold text-on-surface">
                  {profile.reputation.toLocaleString("th-TH")}
                </span>
              </span>
              {nextLevel ? (
                <span className="truncate">
                  ถัดไป: <span className="font-medium">{nextLevel.name_th}</span>{" "}
                  ({nextLevel.min_points.toLocaleString("th-TH")})
                </span>
              ) : (
                <span className="font-medium text-tertiary-container">
                  ระดับสูงสุดแล้ว
                </span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tertiary-container to-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* สถิติ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat Icon={MessageSquare} label="กระทู้" value={threadCount ?? 0} />
        <Stat Icon={MessagesSquare} label="ความเห็น" value={postCount ?? 0} />
        <Stat Icon={Trophy} label="คะแนน" value={profile.reputation} />
        <Stat Icon={Medal} label="เหรียญ" value={badges?.length ?? 0} />
      </div>

      {/* ประวัติการใช้งาน */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* กระทู้ที่ตั้ง */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 border-l-4 border-tertiary-container pl-3 text-lg font-bold">
            <MessageSquare className="h-5 w-5 text-primary" /> กระทู้ที่ตั้ง
          </h2>
          <div className="card overflow-hidden divide-y divide-outline-variant">
            {(recentThreads ?? []).length > 0 ? (
              (recentThreads ?? []).map((t: any) => (
                <ThreadListItem
                  key={t.id}
                  t={{
                    ...t,
                    profiles: {
                      username: profile.username,
                      display_name: profile.display_name,
                      level_id: profile.level_id,
                    },
                  }}
                />
              ))
            ) : (
              <p className="p-6 text-center text-sm text-on-surface-variant">
                ยังไม่มีกระทู้
              </p>
            )}
          </div>
        </section>

        {/* ความเห็นที่ตอบ */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 border-l-4 border-tertiary-container pl-3 text-lg font-bold">
            <MessagesSquare className="h-5 w-5 text-primary" /> ความเห็นล่าสุด
          </h2>
          <div className="card overflow-hidden divide-y divide-outline-variant">
            {(recentPosts ?? []).length > 0 ? (
              (recentPosts ?? []).map((p: any) => (
                <PostListItem key={p.id} p={p} />
              ))
            ) : (
              <p className="p-6 text-center text-sm text-on-surface-variant">
                ยังไม่มีความเห็น
              </p>
            )}
          </div>
        </section>
      </div>

      {/* badges */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 border-l-4 border-tertiary-container pl-3 text-lg font-bold">
          <Award className="h-5 w-5 text-tertiary-container" /> เหรียญรางวัล
          {badges && badges.length > 0 && (
            <span className="text-sm font-normal text-on-surface-variant">
              ({badges.length})
            </span>
          )}
        </h2>
        {(badges ?? []).length > 0 ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {(badges ?? []).map((b: any, i) => (
              <div
                key={i}
                className="card flex items-start gap-2 p-3 transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <Award className="h-6 w-6 shrink-0 text-tertiary-container" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-on-surface">
                    {b.badges?.name_th}
                  </p>
                  <p className="line-clamp-2 text-xs text-on-surface-variant">
                    {b.badges?.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="card p-6 text-center text-sm text-on-surface-variant">
            ยังไม่มีเหรียญรางวัล
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
}: {
  Icon?: any;
  label: string;
  value: number;
}) {
  return (
    <div className="card flex items-center gap-3 p-3 sm:p-4">
      {Icon && (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-container/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-on-surface sm:text-xl">
          {value.toLocaleString("th-TH")}
        </p>
        <p className="text-xs text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

/** แถวความเห็นแบบเดียวกับ ThreadListItem แต่แสดงตัวอย่างเนื้อความที่ตอบ */
function PostListItem({ p }: { p: any }) {
  const when = new Date(p.created_at).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const preview = (p.body ?? "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const title = p.threads?.title ?? "(กระทู้ถูกลบ)";
  const cat = p.threads?.categories;

  return (
    <Link
      href={`/board/thread/${p.thread_id}`}
      className="flex items-start gap-3 px-3 py-2 transition hover:bg-surface-container-low"
    >
      <span className="shrink-0 pt-0.5">
        <MessagesSquare className="h-4 w-4 text-on-surface-variant" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {cat && (
            <span className="chip bg-primary-container/10 text-primary">
              {cat.name_th}
            </span>
          )}
          <p className="truncate font-medium text-on-surface text-sm">
            {title}
          </p>
        </div>
        <p className="line-clamp-2 text-xs text-on-surface-variant">
          {preview.slice(0, 200) || "(ไม่มีเนื้อหา)"}
        </p>
        <p className="text-[11px] text-on-surface-variant">{when} น.</p>
      </div>
    </Link>
  );
}
