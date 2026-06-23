export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <p className="mt-2 text-on-surface-variant">{note ?? "ฟีเจอร์นี้กำลังพัฒนา จะเปิดให้ใช้งานในเฟสถัดไป"}</p>
    </div>
  );
}
