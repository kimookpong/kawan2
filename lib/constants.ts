/** ป้ายระดับสมาชิก + สีสำหรับ badge */
export const LEVEL_STYLES: Record<number, { label: string; en: string; cls: string }> = {
  1: { label: "สัมฤทธิ์", en: "BRONZE", cls: "bg-tertiary-container/15 text-tertiary-container" },
  2: { label: "เงิน", en: "SILVER", cls: "bg-secondary-container text-on-secondary-container" },
  3: { label: "ทอง", en: "GOLD", cls: "bg-[#fff4d6] text-[#7a5a00]" },
  4: { label: "แพลทินัม", en: "PLATINUM", cls: "bg-primary-container/15 text-primary" },
};

export const NAV_ITEMS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/news", label: "ข่าวสารภูมิภาค" },
  { href: "/board", label: "กระดานสนทนา" },
  { href: "/events", label: "ปฏิทินกิจกรรม" },
  { href: "/marketplace", label: "ตลาดซื้อขาย" },
  { href: "/leaderboard", label: "หอเกียรติยศ" },
];

export const ROLES = ["member", "editor", "admin"] as const;

export const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  member: { label: "สมาชิก", cls: "bg-surface-container text-on-surface-variant" },
  editor: { label: "บรรณาธิการ", cls: "bg-tertiary-container/15 text-tertiary-container" },
  admin: { label: "แอดมิน", cls: "bg-primary-container/15 text-primary" },
};

export const PROVINCES = [
  { slug: "all", name: "ทุกจังหวัด" },
  { slug: "pattani", name: "ปัตตานี" },
  { slug: "narathiwat", name: "นราธิวาส" },
  { slug: "yala", name: "ยะลา" },
];
