"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown } from "lucide-react";

/**
 * แบนเนอร์ชวนสนับสนุน (แบบกะทัดรัด) แสดงเหนือ footer
 * ซ่อนอัตโนมัติในหน้า /membership เพราะหน้านั้นมีรายการแพ็กเกจอยู่แล้ว
 */
export function MembershipPromo() {
  const pathname = usePathname();
  if (pathname?.startsWith("/membership")) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-xl bg-[#0f1b2e] px-5 py-4 text-white sm:flex-row">
      <div className="flex items-center gap-3">
        <Crown className="h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-bold">ร่วมสนับสนุนค่าเซิฟเวอร์</p>
          <p className="text-xs text-white/60">ปิดโฆษณา · รับ EXP เพิ่ม · ตราระดับสมาชิก</p>
        </div>
      </div>
      <Link
        href="/membership"
        className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-[#0f1b2e] transition hover:bg-amber-300"
      >
        ดูแพ็กเกจ
      </Link>
    </div>
  );
}
