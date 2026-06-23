/**
 * ป้ายระดับสมาชิก — อิงบรรดาศักดิ์ขุนนางมลายูโบราณ (แหลมมลายู/ปาตานี)
 * ไล่จากสามัญชน → อัครมหาเสนาบดี
 * ชื่อ/เกณฑ์คะแนนแก้ได้ในหน้า /admin/levels (สีกำหนดตาม level_id ที่นี่)
 */
export const LEVEL_STYLES: Record<number, { label: string; en: string; cls: string }> = {
  1: { label: "รายัต", en: "RAKYAT", cls: "bg-surface-container text-on-surface-variant" },
  2: { label: "ฮูลูบาลัง", en: "HULUBALANG", cls: "bg-emerald-100 text-emerald-700" },
  3: { label: "เบินตารา", en: "BENTARA", cls: "bg-teal-100 text-teal-700" },
  4: { label: "ออรัง กายอ", en: "ORANG KAYA", cls: "bg-sky-100 text-sky-700" },
  5: { label: "ปังลีมา", en: "PANGLIMA", cls: "bg-indigo-100 text-indigo-700" },
  6: { label: "เตอเมิงกุง", en: "TEMENGGUNG", cls: "bg-amber-100 text-amber-700" },
  7: { label: "ลักษมณา", en: "LAKSAMANA", cls: "bg-orange-100 text-orange-700" },
  8: { label: "เบินดาฮารา", en: "BENDAHARA", cls: "bg-yellow-100 text-yellow-800" },
};

export const NAV_ITEMS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/news", label: "ข่าวสารภูมิภาค" },
  { href: "/board", label: "กระดานสนทนา" },
  { href: "/events", label: "ปฏิทินกิจกรรม" },
  { href: "/marketplace", label: "ตลาดซื้อขาย" },
  { href: "/members", label: "ค้นหาสมาชิก" },
];

export const ROLES = ["member", "editor", "admin"] as const;

export const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  member: { label: "สมาชิก", cls: "bg-surface-container text-on-surface-variant" },
  editor: { label: "บรรณาธิการ", cls: "bg-tertiary-container/15 text-tertiary-container" },
  admin: { label: "แอดมิน", cls: "bg-primary-container/15 text-primary" },
};

/** รูป fallback เมื่อข่าวไม่มีรูปปก */
export const NEWS_FALLBACK_IMG = "/wallpaper.png";

export const PROVINCES = [
  { slug: "all", name: "ทุกจังหวัด" },
  { slug: "pattani", name: "ปัตตานี" },
  { slug: "narathiwat", name: "นราธิวาส" },
  { slug: "yala", name: "ยะลา" },
];
