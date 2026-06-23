export const metadata = {
  title: "แนวปฏิบัติชุมชน",
  description: "กติกาและแนวปฏิบัติของชุมชน Kawan2 — เพื่อพื้นที่พูดคุยที่ปลอดภัยและเคารพกันของชาวชายแดนใต้",
  alternates: { canonical: "/guidelines" },
};

const RULES = [
  {
    title: "เคารพซึ่งกันและกัน",
    body: "พูดคุยอย่างสุภาพ ไม่โจมตีตัวบุคคล ไม่ใช้ถ้อยคำหยาบคาย ดูหมิ่น หรือยุยงให้เกิดความเกลียดชังทางเชื้อชาติ ศาสนา หรือพื้นที่",
  },
  {
    title: "เนื้อหาที่เหมาะสม",
    body: "ห้ามโพสต์เนื้อหาผิดกฎหมาย ลามกอนาจาร ความรุนแรง หรือเนื้อหาที่ละเมิดลิขสิทธิ์ของผู้อื่น",
  },
  {
    title: "ไม่สแปมหรือหลอกลวง",
    body: "งดโฆษณาเกินจำเป็น การปั่นยอด การหลอกลวง และการสร้างหลายบัญชีเพื่อบิดเบือนการสนทนา",
  },
  {
    title: "ความเป็นส่วนตัว",
    body: "ห้ามเปิดเผยข้อมูลส่วนบุคคลของผู้อื่นโดยไม่ได้รับอนุญาต เช่น ที่อยู่ เบอร์โทร หรือภาพส่วนตัว",
  },
  {
    title: "ข้อมูลที่ถูกต้อง",
    body: "ช่วยกันตรวจสอบก่อนแชร์ข่าว หลีกเลี่ยงการเผยแพร่ข้อมูลเท็จหรือข่าวลือที่อาจสร้างความเข้าใจผิดในพื้นที่",
  },
  {
    title: "การรายงาน",
    body: "หากพบเนื้อหาที่ไม่เหมาะสม โปรดใช้ปุ่มรายงานเพื่อแจ้งทีมผู้ดูแล ทีมงานจะพิจารณาตามความเหมาะสม",
  },
];

export default function GuidelinesPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary sm:text-2xl">แนวปฏิบัติชุมชน</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          เพื่อให้ Kawan2 เป็นพื้นที่พูดคุยที่ปลอดภัยและเคารพกันสำหรับทุกคน โปรดปฏิบัติตามแนวทางต่อไปนี้
        </p>
      </div>

      <div className="space-y-3">
        {RULES.map((r, i) => (
          <div key={r.title} className="card p-5">
            <h2 className="flex items-center gap-2 font-semibold text-on-surface">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-on-primary">
                {i + 1}
              </span>
              {r.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{r.body}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-on-surface-variant">
        การฝ่าฝืนแนวปฏิบัติอาจส่งผลให้ถูกตักเตือน ระงับการใช้งานชั่วคราว หรือปิดบัญชีถาวร
      </p>
    </div>
  );
}
