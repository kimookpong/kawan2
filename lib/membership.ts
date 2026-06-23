/**
 * เงื่อนไข/สิทธิประโยชน์ของแต่ละระดับสมาชิก (membership tiers)
 * ใช้เป็นแหล่งข้อมูลกลางสำหรับหน้า /membership, แบนเนอร์สนับสนุน และลอจิกจำกัดสิทธิ์
 */

export type MembershipTier = "free" | "supporter" | "patron";

export type TierDef = {
  key: MembershipTier;
  name: string;
  price: string; // ราคา/เดือน
  /** ตัวคูณ EXP ที่ได้รับจากทุกกิจกรรม */
  expMultiplier: number;
  /** แสดงโฆษณาหรือไม่ */
  ads: boolean;
  /** จำนวนโพสต์ต่อวัน */
  postsPerDay: number;
  /** จำนวนกระทู้ที่ติดตามได้ (Infinity = ไม่อั้น) */
  followLimit: number;
  /** จำนวนข้อความส่วนตัว (DM) ต่อวัน */
  dmPerDay: number;
  /** เกราะกันการรายงาน (Report shield) */
  reportShield: boolean;
  /** ตราระดับสมาชิกพิเศษ */
  memberBadge: boolean;
};

export const MEMBERSHIP_TIERS: Record<MembershipTier, TierDef> = {
  free: {
    key: "free",
    name: "สมาชิกทั่วไป",
    price: "฿0",
    expMultiplier: 1,
    ads: true,
    postsPerDay: 5,
    followLimit: 5,
    dmPerDay: 5,
    reportShield: false,
    memberBadge: false,
  },
  supporter: {
    key: "supporter",
    name: "ผู้สนับสนุน",
    price: "฿29",
    expMultiplier: 1.5,
    ads: false,
    postsPerDay: 10,
    followLimit: 50,
    dmPerDay: 50,
    reportShield: true,
    memberBadge: true,
  },
  patron: {
    key: "patron",
    name: "ผู้อุปถัมภ์",
    price: "฿99",
    expMultiplier: 2,
    ads: false,
    postsPerDay: 25,
    followLimit: Infinity,
    dmPerDay: 50,
    reportShield: true,
    memberBadge: true,
  },
};

/** สร้างรายการสิทธิประโยชน์แบบข้อความสำหรับแสดงผล */
export function tierFeatures(t: TierDef): string[] {
  return [
    `รับ EXP x${t.expMultiplier}`,
    t.ads ? "มีโฆษณา" : "ปิดโฆษณา",
    `โพสต์ได้วันละ ${t.postsPerDay} ครั้ง`,
    t.followLimit === Infinity ? "ติดตามกระทู้ได้ไม่อั้น" : `ติดตามกระทู้ได้ ${t.followLimit} รายการ`,
    `ส่งข้อความส่วนตัววันละ ${t.dmPerDay} ครั้ง`,
    ...(t.reportShield ? ["เกราะกัน Report"] : []),
    ...(t.memberBadge ? ["ตราระดับสมาชิก"] : []),
  ];
}

/** แหล่งที่มาของ EXP */
export const EXP_SOURCES = [
  { label: "ตั้งกระทู้ใหม่", icon: "post" as const },
  { label: "แสดงความคิดเห็น", icon: "comment" as const },
  { label: "ได้รับไลก์", icon: "like" as const },
];
