/**
 * ป้ายระดับสมาชิก — อิงบรรดาศักดิ์ขุนนางมลายูโบราณ (แหลมมลายู/ปาตานี)
 * ไล่จากสามัญชน → อัครมหาเสนาบดี
 * ชื่อ/เกณฑ์คะแนนแก้ได้ในหน้า /admin/levels (สีกำหนดตาม level_id ที่นี่)
 */
export const LEVEL_STYLES: Record<number, { label: string; en: string; cls: string; name: string }> = {
  1: { label: "รายัต", en: "RAKYAT", cls: "bg-slate-100 text-slate-600", name: "text-on-surface" },
  2: { label: "ฮูลูบาลัง", en: "HULUBALANG", cls: "bg-emerald-100 text-emerald-700", name: "text-emerald-700" },
  3: { label: "เบินตารา", en: "BENTARA", cls: "bg-teal-100 text-teal-700", name: "text-teal-700" },
  4: { label: "ออรัง กายอ", en: "ORANG KAYA", cls: "bg-cyan-100 text-cyan-700", name: "text-cyan-700" },
  5: { label: "ปังลีมา", en: "PANGLIMA", cls: "bg-sky-100 text-sky-700", name: "text-sky-700" },
  6: { label: "เตอเมิงกุง", en: "TEMENGGUNG", cls: "bg-blue-100 text-blue-700", name: "text-blue-700" },
  7: { label: "ลักษมณา", en: "LAKSAMANA", cls: "bg-indigo-100 text-indigo-700", name: "text-indigo-700" },
  8: { label: "เบินดาฮารา", en: "BENDAHARA", cls: "bg-violet-100 text-violet-700", name: "text-violet-700" },
  9: { label: "ชะฮ์บันดาร์", en: "SHAHBANDAR", cls: "bg-purple-100 text-purple-700", name: "text-purple-700" },
  10: { label: "ดาโต๊ะ", en: "DATO", cls: "bg-fuchsia-100 text-fuchsia-700", name: "text-fuchsia-700" },
  11: { label: "มนตรี", en: "MENTERI", cls: "bg-pink-100 text-pink-700", name: "text-pink-700" },
  12: { label: "ปาดูกา", en: "PADUKA", cls: "bg-rose-100 text-rose-700", name: "text-rose-700" },
  13: { label: "มหาเสนา", en: "MAHA SENA", cls: "bg-red-100 text-red-700", name: "text-red-700" },
  14: { label: "ราชา มูดา", en: "RAJA MUDA", cls: "bg-orange-100 text-orange-700", name: "text-orange-700" },
  15: { label: "ราชา", en: "RAJA", cls: "bg-amber-200 text-amber-800", name: "text-amber-700" },
  16: { label: "เปิงฆีรัน", en: "PENGIRAN", cls: "bg-lime-200 text-lime-800", name: "text-lime-700" },
  17: { label: "ซุลต่าน มูดา", en: "SULTAN MUDA", cls: "bg-teal-600 text-white", name: "text-teal-700" },
  18: { label: "ซุลต่าน", en: "SULTAN", cls: "bg-blue-700 text-white", name: "text-blue-700" },
  19: { label: "มหาราชา", en: "MAHARAJA", cls: "bg-purple-700 text-white", name: "text-purple-700" },
  20: { label: "เสรี มหาราชา", en: "SERI MAHARAJA", cls: "bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0f1b2e]", name: "text-amber-600" },
};

/** คืน class สีข้อความของชื่อสมาชิกตามระดับ (ใช้ระบายสีชื่อในหน้า news/webboard) */
export function levelNameClass(levelId?: number | null): string {
  return (levelId && LEVEL_STYLES[levelId]?.name) || "text-on-surface";
}

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
