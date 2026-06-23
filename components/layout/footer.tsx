import Link from "next/link";
import { Check } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-container px-4 py-8 md:px-6">
        {/* การ์ดสนับสนุนค่าเซิฟเวอร์ */}
        <div className="rounded-xl bg-[#0f1b2e] p-6 text-white md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_1fr_0.9fr] lg:items-start">
            {/* คอลัมน์ซ้าย — หัวข้อ */}
            <div>
              <p className="text-xs font-bold tracking-widest text-emerald-400">JOIN · MEMBERSHIP</p>
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">ร่วมสนับสนุนค่าเซิฟเวอร์</h2>
              <p className="mt-3 text-sm text-white/60">
                ปิดโฆษณา รับ EXP เพิ่ม มีตราสมาชิก — และสิทธิพิเศษอื่นๆ
              </p>
            </div>

            {/* Tier 01 — ผู้สนับสนุน */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-bold tracking-widest text-emerald-400">TIER · 01</p>
              <h3 className="mt-2 text-lg font-bold">ผู้สนับสนุน</h3>
              <p className="mt-1 text-2xl font-extrabold">
                ฿49 <span className="text-sm font-normal text-white/50">/เดือน</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {["ปิดโฆษณา", "รับโบนัส EXP x1.5", "อัพโหลดรูปโปรไฟล์เอง", "ตราระดับสมาชิก"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tier 02 — ผู้อุปถัมภ์ (popular) */}
            <div className="relative rounded-xl border border-amber-400/60 bg-white/[0.03] p-5">
              <span className="absolute -top-3 right-4 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#0f1b2e]">
                POPULAR
              </span>
              <p className="text-xs font-bold tracking-widest text-amber-400">TIER · 02</p>
              <h3 className="mt-2 text-lg font-bold">ผู้อุปถัมภ์</h3>
              <p className="mt-1 text-2xl font-extrabold">
                ฿149 <span className="text-sm font-normal text-white/50">/เดือน</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {["ทุกสิทธิ์ของผู้สนับสนุน", "รับโบนัส EXP x2", "ส่งหลังไมค์ไม่อั้น", "ติดตามกระทู้ไม่อั้น"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-amber-400" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* คอลัมน์ขวา — ปุ่ม */}
            <div className="flex flex-col gap-3">
              <Link
                href="/membership"
                className="rounded-lg bg-amber-400 px-5 py-3 text-center text-sm font-bold text-[#0f1b2e] transition hover:bg-amber-300"
              >
                สมัคร Patron — ฿149
              </Link>
              <Link
                href="/membership"
                className="rounded-lg border border-emerald-400/60 px-5 py-3 text-center text-sm font-bold text-emerald-400 transition hover:bg-emerald-400/10"
              >
                สมัคร Supporter
              </Link>
              <p className="text-center text-xs text-white/40">
                ยกเลิกได้ทุกเมื่อ · ชำระผ่าน Stripe / PromptPay
              </p>
            </div>
          </div>
        </div>

        {/* แถบล่าง — โลโก้ + ลิงก์ + ลิขสิทธิ์ */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-outline-variant pt-6 text-sm text-on-surface-variant md:flex-row">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image.png" alt="Kawan2" className="h-7 w-7 rounded" />
            <span className="font-black text-primary">
              kawan<span className="text-tertiary-container">2</span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/news" className="hover:text-primary">ข่าวสาร</Link>
            <Link href="/board" className="hover:text-primary">กระดานสนทนา</Link>
            <Link href="/events" className="hover:text-primary">กิจกรรม</Link>
            <Link href="/guidelines" className="hover:text-primary">แนวปฏิบัติชุมชน</Link>
            <Link href="/contact" className="hover:text-primary">ติดต่อเรา</Link>
          </nav>
          <p className="text-xs">© {new Date().getFullYear()} Kawan2</p>
        </div>
      </div>
    </footer>
  );
}
