import Link from "next/link";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";

export type Author = {
  username: string;
  display_name: string | null;
  avatar_url?: string | null;
  level_id: number;
  role?: string | null;
  reputation?: number;
  created_at?: string | null;
};

/** การ์ดผู้เขียน — คอลัมน์ซ้ายของกระทู้/ความเห็น (สไตล์ webboard) */
export function AuthorCard({ author, compact = false }: { author: Author | null; compact?: boolean }) {
  if (!author) return null;
  const name = author.display_name || author.username;

  return (
    <div
      className={`flex shrink-0 gap-3 sm:flex-col sm:items-center sm:text-center ${
        compact ? "sm:w-36" : "sm:w-44"
      }`}
    >
      <Link href={`/u/${author.username}`} className="block">
        <Avatar src={author.avatar_url} name={name} role={author.role} size={compact ? 44 : 64} />
      </Link>

      <div className="min-w-0 sm:w-full">
        <Link href={`/u/${author.username}`} className="block truncate font-semibold text-on-surface hover:text-primary">
          {name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1 sm:justify-center">
          <LevelBadge levelId={author.level_id} showTier />
        </div>

        {!compact && (
          <dl className="mt-3 space-y-1 border-t border-outline-variant pt-3 text-left text-xs text-on-surface-variant sm:text-center">
            {author.created_at && (
              <div className="flex justify-between sm:block">
                <dt className="inline">เข้าร่วมเมื่อ</dt>{" "}
                <dd className="inline font-medium text-on-surface">
                  {new Date(author.created_at).toLocaleDateString("th-TH", { month: "short", year: "numeric" })}
                </dd>
              </div>
            )}
            {typeof author.reputation === "number" && (
              <div className="flex justify-between sm:block">
                <dt className="inline">คะแนน</dt>{" "}
                <dd className="inline font-medium text-on-surface">{author.reputation.toLocaleString("th-TH")}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
