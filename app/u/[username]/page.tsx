import { notFound } from "next/navigation";
import Link from "next/link";
import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LEVEL_STYLES } from "@/lib/constants";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, reputation, level_id, created_at, provinces(name_th)")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isSelf = user?.id === profile.id;
  const lvl = LEVEL_STYLES[profile.level_id];

  const [{ count: threadCount }, { data: badges }, { data: nextLevel }] = await Promise.all([
    supabase.from("threads").select("*", { count: "exact", head: true }).eq("author_id", profile.id),
    supabase.from("user_badges").select("badges(name_th, icon, description)").eq("user_id", profile.id),
    supabase.from("membership_levels").select("min_points, name_th").gt("min_points", profile.reputation).order("min_points").limit(1).maybeSingle(),
  ]);

  const progress = nextLevel
    ? Math.min(100, Math.round((profile.reputation / nextLevel.min_points) * 100))
    : 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* header */}
      <div className="card overflow-hidden">
        <div className="h-28 bg-primary" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <span className="grid h-20 w-20 place-items-center rounded-full border-4 border-surface-container-lowest bg-primary-container text-2xl font-bold text-on-primary">
              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
            </span>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{profile.display_name || profile.username}</h1>
              <p className="text-sm text-on-surface-variant">
                @{profile.username}
                {(profile as any).provinces && ` · ${(profile as any).provinces.name_th}`}
              </p>
            </div>
            <div className="flex gap-2">
              {lvl && <span className={`chip ${lvl.cls}`}>{lvl.en} MEMBER</span>}
              {isSelf ? (
                <Link href="/me" className="btn-outline">แก้ไขโปรไฟล์</Link>
              ) : (
                <Link href={`/messages/new?to=${profile.id}`} className="btn-accent">ส่งข้อความ</Link>
              )}
            </div>
          </div>

          {profile.bio && <p className="mt-4 text-sm text-on-surface">{profile.bio}</p>}

          {/* progress level */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>คะแนนสะสม {profile.reputation.toLocaleString("th-TH")}</span>
              {nextLevel && <span>ถัดไป: {nextLevel.name_th} ({nextLevel.min_points})</span>}
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full bg-tertiary-container" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* สถิติ */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="กระทู้" value={threadCount ?? 0} />
        <Stat label="คะแนน" value={profile.reputation} />
        <Stat label="เหรียญ" value={badges?.length ?? 0} />
      </div>

      {/* badges */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">เหรียญรางวัล</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(badges ?? []).map((b: any, i) => (
            <div key={i} className="card p-4 text-center">
              <Award className="mx-auto h-7 w-7 text-tertiary-container" />
              <p className="mt-1 text-sm font-medium">{b.badges?.name_th}</p>
              <p className="text-xs text-on-surface-variant">{b.badges?.description}</p>
            </div>
          ))}
          {(!badges || badges.length === 0) && (
            <p className="text-sm text-on-surface-variant">ยังไม่มีเหรียญรางวัล</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold text-primary">{value.toLocaleString("th-TH")}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
