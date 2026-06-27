import {
  AtSign,
  Bell,
  Heart,
  Mail,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trophy,
} from "lucide-react";

export type NotifLite = {
  id: number;
  type: string;
  payload: any;
  is_read?: boolean;
  created_at?: string;
};

export function hrefForNotification(
  n: NotifLite,
  actorUsername?: string | null,
): string {
  const p = n.payload ?? {};
  switch (n.type) {
    case "reply_thread":
    case "reply_post":
      return `/board/thread/${p.thread_id}${p.post_id ? `#post-${p.post_id}` : ""}`;
    case "mention":
      if (p.ref === "thread" && p.thread_id) return `/board/thread/${p.thread_id}`;
      if (p.ref === "news" && p.news_id) return `/news/${p.news_id}`;
      return "/notifications";
    case "like":
      if (p.target_type === "thread" && p.target_id)
        return `/board/thread/${p.target_id}`;
      if (p.target_type === "post" && p.thread_id)
        return `/board/thread/${p.thread_id}#post-${p.target_id}`;
      return "/notifications";
    case "dm":
      return p.conversation_id ? `/messages/${p.conversation_id}` : "/messages";
    case "badge":
    case "level_up":
      return actorUsername ? `/u/${actorUsername}` : "/notifications";
    case "report":
      return "/admin/reports";
    case "seller_approved":
    case "seller_rejected":
      return "/marketplace/seller/status";
    case "ban":
    case "disable":
    case "enable":
    default:
      return "/notifications";
  }
}

export function iconForNotification(type: string, size: "sm" | "md" = "md") {
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  switch (type) {
    case "reply_thread":
    case "reply_post":
      return <MessageSquare className={`${cls} text-primary`} />;
    case "like":
      return <Heart className={`${cls} text-rose-500`} />;
    case "mention":
      return <AtSign className={`${cls} text-sky-500`} />;
    case "dm":
      return <Mail className={`${cls} text-primary`} />;
    case "ban":
    case "disable":
      return <ShieldAlert className={`${cls} text-error`} />;
    case "enable":
      return <ShieldCheck className={`${cls} text-green-600`} />;
    case "badge":
    case "level_up":
      return <Trophy className={`${cls} text-amber-500`} />;
    case "seller_approved":
      return <Store className={`${cls} text-green-600`} />;
    case "seller_rejected":
      return <Store className={`${cls} text-error`} />;
    default:
      return <Bell className={`${cls} text-on-surface-variant`} />;
  }
}

export function messageForNotification(
  n: NotifLite,
  actorName: string,
): React.ReactNode {
  switch (n.type) {
    case "reply_thread":
      return (
        <>
          <span className="font-medium">{actorName}</span> ตอบกระทู้ของคุณ
        </>
      );
    case "reply_post":
      return (
        <>
          <span className="font-medium">{actorName}</span> ตอบความเห็นของคุณ
        </>
      );
    case "like":
      return (
        <>
          <span className="font-medium">{actorName}</span> ถูกใจ
          {n.payload?.target_type === "post" ? "ความเห็นของคุณ" : "กระทู้ของคุณ"}
        </>
      );
    case "mention":
      return (
        <>
          <span className="font-medium">{actorName}</span> กล่าวถึงคุณ
        </>
      );
    case "dm":
      return (
        <>
          <span className="font-medium">{actorName}</span> ส่งข้อความถึงคุณ
        </>
      );
    case "ban":
      return "บัญชีของคุณถูกระงับการใช้งานชั่วคราว";
    case "disable":
      return "บัญชีของคุณถูกปิดการใช้งาน";
    case "enable":
      return "บัญชีของคุณถูกเปิดใช้งานอีกครั้ง";
    case "badge":
      return "คุณได้รับเหรียญรางวัล";
    case "level_up":
      return "คุณเลื่อนระดับสมาชิก";
    case "report":
      return "มีการรายงานเนื้อหาใหม่ (รอแอดมินตรวจสอบ)";
    case "seller_approved":
      return "ใบสมัครผู้ขายของคุณได้รับการอนุมัติ";
    case "seller_rejected":
      return (
        <>
          ใบสมัครผู้ขายถูกปฏิเสธ
          {n.payload?.reason && (
            <span className="text-on-surface-variant"> — {n.payload.reason}</span>
          )}
        </>
      );
    default:
      return n.type;
  }
}
