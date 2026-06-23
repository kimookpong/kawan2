import { Mail, MessageSquare, Shield } from "lucide-react";

export const metadata = {
  title: "ติดต่อเรา",
  description: "ช่องทางติดต่อทีมงาน Kawan2 — สอบถาม แจ้งปัญหา หรือเสนอแนะเกี่ยวกับชุมชนชายแดนใต้",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  {
    Icon: Mail,
    title: "อีเมล",
    body: "สอบถามทั่วไป ความร่วมมือ หรือแจ้งปัญหาการใช้งาน",
    value: "support@kawan2.com",
    href: "mailto:support@kawan2.com",
  },
  {
    Icon: Shield,
    title: "แจ้งเนื้อหาไม่เหมาะสม",
    body: "พบเนื้อหาที่ละเมิดแนวปฏิบัติชุมชน แจ้งทีมผู้ดูแลได้ที่",
    value: "report@kawan2.com",
    href: "mailto:report@kawan2.com",
  },
  {
    Icon: MessageSquare,
    title: "พูดคุยในชุมชน",
    body: "ตั้งคำถามหรือเสนอแนะผ่านกระดานสนทนาของเรา",
    value: "ไปที่กระดานสนทนา",
    href: "/board",
  },
];

export default function ContactPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary sm:text-2xl">ติดต่อเรา</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          มีคำถาม ข้อเสนอแนะ หรือต้องการแจ้งปัญหา? ติดต่อทีมงาน Kawan2 ได้ตามช่องทางด้านล่าง
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ Icon, title, body, value, href }) => (
          <a key={title} href={href} className="card flex flex-col gap-2 p-5 transition hover:shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-container/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="font-semibold text-on-surface">{title}</h2>
            <p className="text-sm text-on-surface-variant">{body}</p>
            <span className="mt-auto text-sm font-medium text-primary">{value}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
