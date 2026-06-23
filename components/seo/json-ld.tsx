/** ฝัง structured data (JSON-LD) สำหรับ rich results ของ Google */
export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // ปลอดภัย: เป็นข้อมูลที่เราสร้างเอง ไม่ใช่ HTML จากผู้ใช้
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
