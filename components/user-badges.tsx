import { Shield, BadgeCheck } from "lucide-react";
import { LEVEL_STYLES } from "@/lib/constants";

/** ป้ายระดับสมาชิก (ภาษาไทย + สีประจำ level) */
export function LevelBadge({
  levelId,
  showTier = false,
}: {
  levelId: number;
  showTier?: boolean;
}) {
  const lvl = LEVEL_STYLES[levelId];
  if (!lvl) return null;
  const c = `var(--lvl-${levelId}, #64748b)`;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{
        color: c,
        backgroundColor: `color-mix(in srgb, ${c} 14%, transparent)`,
      }}
    >
      <Shield className="h-3 w-3" strokeWidth={2} />
      {showTier ? `${lvl.label} · LV ${levelId}` : lvl.label}
    </span>
  );
}

/** สัญลักษณ์สำหรับ role admin / editor (member = ไม่แสดง) */
export function RoleBadge({ role }: { role?: string | null }) {
  if (role === "admin") {
    return (
      <span
        title="ผู้ดูแลระบบ"
        className="inline-flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary"
      >
        <Shield className="h-3 w-3" /> ADMIN
      </span>
    );
  }
  if (role === "editor") {
    return (
      <span
        title="บรรณาธิการ"
        className="inline-flex items-center gap-0.5 rounded bg-tertiary-container px-1.5 py-0.5 text-[10px] font-bold text-on-tertiary"
      >
        <BadgeCheck className="h-3 w-3" /> EDITOR
      </span>
    );
  }
  return null;
}

/** ไอคอนยืนยันตัวตนเล็กๆ วางทับมุมอวาตาร์ (เฉพาะ staff) */
export function RoleAvatarMark({ role }: { role?: string | null }) {
  if (role !== "admin" && role !== "editor") return null;
  const color = role === "admin" ? "text-primary" : "text-tertiary-container";
  return (
    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-surface-container-lowest">
      <BadgeCheck className={`h-4 w-4 ${color}`} />
    </span>
  );
}
