import Link from "next/link";
import { Flame, Pin, MessageCircle, MessageSquare, Eye, Lock } from "lucide-react";
import { levelNameStyle } from "@/lib/constants";

type Data = {
  id: number;
  title: string;
  reply_count: number;
  view_count: number;
  created_at: string;
  is_pinned?: boolean;
  members_only?: boolean;
  like_count?: number;
  profiles?: { username: string; display_name: string | null; level_id?: number } | null;
  categories?: { name_th: string; slug: string } | null;
};

/** แถวกระทู้แบบ webboard (ไอคอนไฟ/ปักหมุด + ผู้ตั้ง·เวลา + ตอบ/อ่าน) */
export function ThreadListItem({
  t,
  hideCategory = false,
}: {
  t: Data;
  hideCategory?: boolean;
}) {
  const d = new Date(t.created_at);
  const when = d.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const author = t.profiles?.display_name || t.profiles?.username || "ไม่ทราบ";
  const isHot =
    !t.is_pinned &&
    !t.members_only &&
    ((t.like_count ?? 0) >= 20 || (t.reply_count ?? 0) >= 20);

  return (
    <Link
      href={`/board/thread/${t.id}`}
      className={`flex items-center gap-3 px-3 py-2 transition ${
        t.is_pinned
          ? "bg-primary/5 hover:bg-primary/10"
          : "hover:bg-surface-container-low"
      }`}
    >
      <span className="shrink-0">
        {t.is_pinned ? (
          <Pin className="h-4 w-4 text-tertiary-container" aria-label="ปักหมุด" />
        ) : t.members_only ? (
          <Lock className="h-4 w-4 text-amber-600" aria-label="เฉพาะสมาชิก" />
        ) : isHot ? (
          <Flame className="h-4 w-4 text-orange-500" aria-label="กระทู้เด่น" />
        ) : (
          <MessageSquare className="h-4 w-4 text-on-surface-variant" aria-label="กระทู้" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {!hideCategory && t.categories && (
            <span className="chip bg-primary-container/10 text-primary">
              {t.categories.name_th}
            </span>
          )}
          <p className="truncate font-medium text-on-surface text-sm">
            {t.title}
          </p>
        </div>
        <p className="truncate text-xs text-on-surface-variant">
          <span className="font-medium" style={levelNameStyle(t.profiles?.level_id)}>{author}</span> · {when} น.
        </p>
      </div>

      <div className="shrink-0 space-y-0.5 text-right text-xs text-on-surface-variant">
        <span className="flex items-center justify-end gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {t.reply_count}
        </span>
        <span className="flex items-center justify-end gap-1">
          <Eye className="h-3.5 w-3.5" /> {t.view_count}
        </span>
      </div>
    </Link>
  );
}
