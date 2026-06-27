export const PRICE_TYPE_LABEL: Record<string, string> = {
  fixed: "ราคาตายตัว",
  negotiable: "ต่อรองได้",
  contact: "ติดต่อสอบถาม",
};

export const CONDITION_LABEL: Record<string, string> = {
  new: "ของใหม่",
  like_new: "เหมือนใหม่",
  used: "มือสอง",
};

export const LISTING_STATUS_LABEL: Record<string, string> = {
  available: "ขายอยู่",
  reserved: "จอง",
  sold: "ขายแล้ว",
  hidden: "ซ่อน",
  deleted: "ลบแล้ว",
};

export const SELLER_STATUS_LABEL: Record<string, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  suspended: "ระงับการใช้งาน",
};

export function formatPrice(price: number | null | undefined, priceType: string): string {
  if (priceType === "contact" || price == null) return "ติดต่อสอบถาม";
  const text = Number(price).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `฿ ${text}${priceType === "negotiable" ? " (ต่อรองได้)" : ""}`;
}

export function parseImageUrls(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 8);
}
