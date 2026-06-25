import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, MessageSquare, MessagesSquare, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";
import { ModerationPanel } from "@/components/moderation-panel";
import { JsonLd } from "@/components/seo/json-ld";

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
        "id, title, created_at, reply_count, like_count, view_count, categories(name_th, slug)",
      )
      .eq("author_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("posts")
      .select("id, body, created_at, thread_id, threads(id, title)")
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

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.vercel.app";
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
        <div className="h-28 bg-primary" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <span className="rounded-full ring-4 ring-surface-container-lowest">
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name || profile.username}
                role={profile.role}
                size={80}
              />
            </span>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-sm text-on-surface-variant">
                @{profile.username}
                {guild && (
                  <>
                    {" "}
                    ·{" "}
                    <Link
                      href={`/guilds/${guild.slug}`}
                      className="text-primary hover:underline"
                    >
                      ⚔ {guild.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LevelBadge levelId={profile.level_id} showTier />
              {isSelf ? (
                <Link href="/me" className="btn-outline">
                  แก้ไขโปรไฟล์
                </Link>
              ) : (
                <Link
                  href={`/messages/new?to=${profile.id}`}
                  className="btn-accent"
                >
                  ส่งข้อความ
                </Link>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-on-surface">{profile.bio}</p>
          )}

          {/* progress level */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>
                คะแนนสะสม {profile.reputation.toLocaleString("th-TH")}
              </span>
              {nextLevel && (
                <span>
                  ถัดไป: {nextLevel.name_th} ({nextLevel.min_points})
                </span>
              )}
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full bg-tertiary-container"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* สถิติ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="กระทู้" value={threadCount ?? 0} />
        <Stat label="ความเห็น" value={postCount ?? 0} />
        <Stat label="คะแนน" value={profile.reputation} />
        <Stat label="เหรียญ" value={badges?.length ?? 0} />
      </div>

      {/* ประวัติการใช้งาน */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* กระทู้ที่ตั้ง */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 border-l-4 border-tertiary-container pl-3 text-lg font-bold">
            <MessageSquare className="h-5 w-5 text-primary" /> กระทู้ที่ตั้ง
          </h2>
          <div className="card divide-y divide-outline-variant">
            {(recentThreads ?? []).length > 0 ? (
              (recentThreads ?? []).map((t: any) => (
                <Link
                  key={t.id}
                  href={`/board/thread/${t.id}`}
                  className="block p-4 hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-2">
                    {t.categories && (
                      <span className="chip bg-primary-container/10 text-primary">
                        {t.categories.name_th}
                      </span>
                    )}
                    <span className="text-xs text-on-surface-variant">
                      {new Date(t.created_at).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-medium text-on-surface text-sm">
                    {t.title}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    💬 {t.reply_count} · ❤ {t.like_count} · 👁 {t.view_count}
                  </p>
                </Link>
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
          <div className="card divide-y divide-outline-variant">
            {(recentPosts ?? []).length > 0 ? (
              (recentPosts ?? []).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/board/thread/${p.thread_id}`}
                  className="block p-4 hover:bg-surface-container-low"
                >
                  <p className="text-xs text-on-surface-variant">
                    ตอบในกระทู้ ·{" "}
                    {new Date(p.created_at).toLocaleDateString("th-TH")}
                  </p>
                  <p className="truncate text-sm font-medium text-primary">
                    {p.threads?.title ?? "(กระทู้ถูกลบ)"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                    {p.body.replace(/\[[^\]]*\]/g, "").slice(0, 160)}
                  </p>
                </Link>
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
        <h2 className="mb-3 text-lg font-semibold">เหรียญรางวัล</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(badges ?? []).map((b: any, i) => (
            <div key={i} className="card p-4 text-center">
              <Award className="mx-auto h-7 w-7 text-tertiary-container" />
              <p className="mt-1 text-sm font-medium">{b.badges?.name_th}</p>
              <p className="text-xs text-on-surface-variant">
                {b.badges?.description}
              </p>
            </div>
          ))}
          {(!badges || badges.length === 0) && (
            <p className="text-sm text-on-surface-variant">
              ยังไม่มีเหรียญรางวัล
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xl font-bold text-primary sm:text-2xl">
        {value.toLocaleString("th-TH")}
      </p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
