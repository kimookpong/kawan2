import Link from "next/link";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";

type ThreadRowData = {
  id: number;
  title: string;
  like_count: number;
  reply_count: number;
  view_count: number;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    level_id: number;
    role?: string | null;
    avatar_url?: string | null;
  } | null;
  categories?: { name_th: string; slug: string } | null;
};

export function ThreadRow({ thread }: { thread: ThreadRowData }) {
  const author = thread.profiles;

  return (
    <Link
      href={`/board/thread/${thread.id}`}
      className="flex items-start gap-3 p-4 transition hover:bg-surface-container-low"
    >
      <Avatar
        src={author?.avatar_url}
        name={author?.display_name || author?.username}
        role={author?.role}
        size={36}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {thread.categories && (
            <span className="chip bg-primary-container/10 text-primary">
              {thread.categories.name_th}
            </span>
          )}
          {author && <LevelBadge levelId={author.level_id} />}
        </div>
        <h3 className="mt-1 truncate font-medium text-on-surface text-sm">
          {thread.title}
        </h3>
        <p className="text-xs text-on-surface-variant">
          โดย {author?.display_name || author?.username || "ไม่ทราบ"} ·{" "}
          {new Date(thread.created_at).toLocaleDateString("th-TH")}
        </p>
      </div>
      <div className="hidden shrink-0 gap-4 text-center text-xs text-on-surface-variant sm:flex">
        <span>
          <b className="block text-on-surface">{thread.reply_count}</b>ตอบ
        </span>
        <span>
          <b className="block text-on-surface">{thread.like_count}</b>ไลก์
        </span>
        <span>
          <b className="block text-on-surface">{thread.view_count}</b>อ่าน
        </span>
      </div>
    </Link>
  );
}
