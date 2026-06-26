import Link from "next/link";
import { MembershipPromo } from "./membership-promo";

export function Footer() {
  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-container px-4 py-8 md:px-6">
        {/* แบนเนอร์สนับสนุน (กะทัดรัด) — ซ่อนเองในหน้า /membership */}
        <MembershipPromo />

        {/* แถบล่าง — โลโก้ + ลิงก์ + ลิขสิทธิ์ */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-outline-variant pt-6 text-sm text-on-surface-variant md:flex-row">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image2.png" alt="Kawan2" className="h-8 w-auto" />
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
