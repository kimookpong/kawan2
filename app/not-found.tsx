import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <p className="text-5xl font-black text-primary">404</p>
      <p className="mt-2 text-on-surface-variant">ไม่พบหน้าที่คุณค้นหา</p>
      <Link href="/" className="btn-primary mt-6">กลับหน้าแรก</Link>
    </div>
  );
}
