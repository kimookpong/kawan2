import Link from "next/link";
import { cache } from "react";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/server";
import {
  Crown,
  Handshake,
  Shield,
  Timer,
  Check,
  Star,
  Clock,
} from "lucide-react";

export type Author = {
  username: string;
  display_name: string | null;
  avatar_url?: string | null;
  level_id: number;
  role?: string | null;
  reputation?: number;
  created_at?: string | null;
  bio?: string | null;
  threads?: { count: number }[] | null;
  posts?: { count: number }[] | null;
};

// Caching membership levels per-request to avoid redundant DB hits
const getCachedLevels = cache(async () => {
  const supabase = createClient();
  const { data } = await supabase
    .from("membership_levels")
    .select("id, name_th, name_en, min_points, color")
    .order("id");
  return data || [];
});

/** การ์ดผู้เขียน — คอลัมน์ซ้ายของกระทู้/ความเห็น (สไตล์ webboard พรีเมียม) */
export async function AuthorCard({
  author,
  compact = false,
}: {
  author: Author | null;
  compact?: boolean;
}) {
  if (!author) return null;
  const name = author.display_name || author.username;

  // ดึงข้อมูลระดับทั้งหมดและคำนวณความก้าวหน้า
  const levels = await getCachedLevels();
  const currentRep = author.reputation ?? 0;

  const currentLevel =
    levels.find((l) => l.id === author.level_id) || levels[0];
  const nextLevel = levels.find((l) => l.min_points > currentRep);

  let progress = 100;
  let remainingPercentage = 0;
  if (nextLevel && currentLevel) {
    const currentMin = currentLevel.min_points;
    const nextMin = nextLevel.min_points;
    const diff = nextMin - currentMin;
    if (diff > 0) {
      const currentProgress = currentRep - currentMin;
      progress = Math.max(
        0,
        Math.min(100, Math.round((currentProgress / diff) * 100)),
      );
      remainingPercentage = 100 - progress;
    }
  }

  const levelName = currentLevel ? currentLevel.name_th : "รายัต";
  const levelId = author.level_id;
  const levelColor =
    (currentLevel as { color?: string } | undefined)?.color || "#475569";
  const levelBadgeStyle = {
    backgroundColor: `${levelColor}1A`,
    color: levelColor,
    borderColor: `${levelColor}40`,
  } as const;

  // ตั้งค่าดีไซน์และธีมของการ์ดแยกตามระดับชั้น (Tier)
  let cardBg = "bg-surface dark:bg-surface-container-low";
  let headerBg = "bg-surface-container-lowest border-t border-emerald-600/30";
  let headerIcon = null;
  let avatarBorder = "border-emerald-600 dark:border-emerald-500";
  let badgeIcon = <Shield className="w-3.5 h-3.5 text-slate-500" />;
  let progressColor = "bg-slate-500 dark:bg-slate-400";
  let nameClass = "text-on-surface font-semibold";
  let leftStripeClass = "border-l-[5px] border-l-emerald-600";

  // โครงสร้างเส้นขอบล่างแบบกำหนดสีเอง (Custom Bottom Border Stripe)

  if (levelId >= 16) {
    cardBg = "bg-[#fef9eb] dark:bg-amber-950/10";
    headerBg = "bg-[#fbf1d5] dark:bg-amber-950/20";
    headerIcon = (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500">
        <Crown className="h-3.5 w-3.5" />
      </div>
    );
    avatarBorder = "border-amber-500";
    badgeIcon = (
      <Timer className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
    );
    progressColor = "bg-purple-500";
    nameClass = "text-amber-600 dark:text-amber-500 font-bold";
    leftStripeClass = "border-l-[5px] border-l-amber-500";
  } else if (levelId >= 6) {
    cardBg = "bg-[#f0fbf6] dark:bg-emerald-950/10";
    headerBg = "bg-[#dbf3e5] dark:bg-emerald-950/20";
    headerIcon = (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
        <Handshake className="h-3.5 w-3.5" />
      </div>
    );
    avatarBorder = "border-emerald-600 dark:border-emerald-500";
    badgeIcon = (
      <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    );
    progressColor = "bg-emerald-500";
    nameClass = "text-on-surface font-semibold";
    leftStripeClass = "border-l-[5px] border-l-emerald-500";
  }

  // กำหนดสีของข้อความและป้าย Role
  let roleColorClass = "text-emerald-600 dark:text-emerald-500 font-bold";
  let roleBadgeClass =
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  // กำหนดขอบซ้ายและกรอบรูปตามระดับสิทธิ์ (Role) หากมีบทบาทพิเศษ หากเป็นผู้ใช้ทั่วไปให้ยึดตามระดับ Level
  if (author.role === "admin") {
    leftStripeClass = "border-l-[5px] border-l-amber-500";
    avatarBorder = "border-amber-500";
    roleColorClass = "text-amber-600 dark:text-amber-500 font-bold";
    roleBadgeClass = "bg-amber-500 text-white";
  } else if (author.role === "editor") {
    leftStripeClass = "border-l-[5px] border-l-[#8a5a2b]";
    avatarBorder = "border-[#8a5a2b]";
    roleColorClass = "text-[#8a5a2b] dark:text-[#a07040] font-bold";
    roleBadgeClass = "bg-[#8a5a2b] text-white";
  }

  // คำนวณสถิติ
  const threadsCount = author.threads?.[0]?.count ?? 0;
  const postsCount = author.posts?.[0]?.count ?? 0;
  const totalPosts = threadsCount + postsCount;

  const joinDate = author.created_at ? new Date(author.created_at) : new Date();
  const diffTime = Math.abs(new Date().getTime() - joinDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const joinDateFormatted = joinDate.toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
    day: "numeric",
  });

  // ฟังก์ชันจัดรูปแบบตัวเลขสถิติ (เช่น 1100 -> 1.1k)
  function formatStatNumber(num: number): string {
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1);
      return formatted.endsWith(".0")
        ? `${Math.floor(num / 1000)}k`
        : `${formatted}k`;
    }
    return num.toString();
  }

  function formatReputation(num: number): string {
    const formatted = formatStatNumber(Math.abs(num));
    if (num >= 0) return `+${formatted}`;
    return `-${formatted}`;
  }

  // สีของเข็มกลัดเครื่องหมายถูกด้านบน ตามระดับสิทธิ์ (Role)
  let checkBadgeBg = "bg-emerald-600";
  if (author.role === "admin") {
    checkBadgeBg = "bg-amber-500";
  } else if (author.role === "editor") {
    checkBadgeBg = "bg-[#8a5a2b]";
  }

  return (
    <>
      {/* 1) แสดงผลบน Mobile (ดีไซน์การ์ดแนวนอนพร้อมแถบสีตามระดับ) */}
      <div
        className={`sm:hidden flex items-center gap-3 w-full p-2.5 rounded-t-lg border-b border-outline-variant/40 ${cardBg}`}
      >
        <div
          className={`relative rounded-full p-[2px] border-2 flex items-center justify-center shrink-0 aspect-square ${avatarBorder} w-[52px] h-[52px]`}
        >
          <Avatar src={author.avatar_url} name={name} size={44} />
          <div
            className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ${checkBadgeBg} text-white ring-2 ring-surface`}
          >
            <Check className="h-2.5 w-2.5 stroke-[3]" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/u/${author.username}`}
              className={`hover:underline truncate text-sm ${nameClass}`}
            >
              {name}
            </Link>
            {author.role && author.role !== "member" && (
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${roleBadgeClass}`}
              >
                {author.role}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span
              className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={levelBadgeStyle}
            >
              {levelName} · LV {author.level_id}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
              <Star className="h-3 w-3" />
              {formatReputation(currentRep)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant/75 font-medium">
              <Clock className="h-3 w-3" />
              {diffDays} วัน
            </span>
          </div>
        </div>
      </div>

      {/* 2) แสดงผลบน Desktop (ดีไซน์คอลัมน์แนวตั้ง พาร์ทเนอร์ในโครงสร้าง Card) */}
      <div
        className={`hidden sm:flex flex-col shrink-0 self-stretch border-solid border-r border-outline-variant/60 justify-between ${
          compact ? "sm:w-40" : "sm:w-44"
        } ${cardBg} ${leftStripeClass}`}
      >
        {/* หัวการ์ด */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b border-outline-variant/40 ${headerBg}`}
        >
          <div className="flex items-center gap-1">
            {headerIcon}
            <span
              className={`text-[9px] font-extrabold tracking-wider uppercase ${roleColorClass}`}
            >
              {author.role === "admin"
                ? "ADMIN"
                : author.role === "editor"
                  ? "EDITOR"
                  : "MEMBER"}
            </span>
          </div>
          <div
            className={`flex h-4 w-4 items-center justify-center rounded-full ${checkBadgeBg} text-white p-0.5 shadow-sm`}
          >
            <Check className="h-2.5 w-2.5 stroke-[3]" />
          </div>
        </div>

        {/* เนื้อหาการ์ดส่วนกลาง */}
        <div className="flex-1 flex flex-col items-center p-3">
          {/* รูปอวาตาร์ขอบพรีเมียม */}
          <div
            className={`relative rounded-full p-[3px] border-2 mb-3 flex items-center justify-center shrink-0 aspect-square ${avatarBorder} ${
              compact ? "w-[74px] h-[74px]" : "w-[86px] h-[86px]"
            }`}
          >
            <Avatar
              src={author.avatar_url}
              name={name}
              size={compact ? 64 : 76}
            />
          </div>

          {/* ชื่อสมาชิก */}
          <Link
            href={`/u/${author.username}`}
            className={`block text-sm hover:underline truncate max-w-full text-center ${nameClass}`}
          >
            {name}
          </Link>

          {/* ป้ายระดับ */}
          <div
            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border"
            style={levelBadgeStyle}
          >
            {badgeIcon}
            <span>
              {levelName} · LV {author.level_id}
            </span>
          </div>

          {/* หลอดเก็บแต้มความก้าวหน้า */}
          <div className="mt-3.5 w-full">
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {nextLevel ? (
              <p className="mt-1.5 text-[10px] text-on-surface-variant/80 font-medium text-center">
                อีก {remainingPercentage}% จะถึง Lv {nextLevel.id}
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] text-on-surface-variant/80 font-medium text-center">
                ระดับสูงสุด
              </p>
            )}
          </div>

          {/* เส้นคั่นบางๆ */}
          <div className="w-full border-t border-outline-variant/60 my-3"></div>

          {/* สถิติตัวเลข 3 ช่อง */}
          <div className="grid grid-cols-3 w-full text-center divide-x divide-outline-variant/60">
            <div className="px-0.5">
              <p className="text-[13px] font-bold text-on-surface tracking-tight leading-tight">
                {formatStatNumber(totalPosts)}
              </p>
              <p className="text-[9px] text-on-surface-variant/80 font-medium mt-0.5">
                โพสต์
              </p>
            </div>
            <div className="px-0.5">
              <p className="text-[13px] font-bold text-on-surface tracking-tight leading-tight">
                {formatReputation(currentRep)}
              </p>
              <p className="text-[9px] text-on-surface-variant/80 font-medium mt-0.5">
                ชื่อเสียง
              </p>
            </div>
            <div className="px-0.5">
              <p className="text-[13px] font-bold text-on-surface tracking-tight leading-tight">
                {diffDays} วัน
              </p>
              <p className="text-[9px] text-on-surface-variant/80 font-medium mt-0.5">
                อายุ
              </p>
            </div>
          </div>

          {/* คำนิยามตัวตน (Bio) ด้านล่างสถิติ */}
          {author.bio && (
            <p className="mt-4 text-[10px] text-amber-600 dark:text-amber-500 italic text-center max-w-full line-clamp-2 px-1">
              “ {author.bio} ”
            </p>
          )}
        </div>

        {/* ส่วนท้ายของการ์ดที่จะชิดขอบล่างเสมอ */}
        <div className="flex flex-col items-center w-full shrink-0">
          <p className="mb-3.5 text-[9px] text-on-surface-variant/70 font-medium">
            เข้าร่วม - {joinDateFormatted}
          </p>
        </div>
      </div>
    </>
  );
}
