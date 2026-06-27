import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { ConvRowMenu } from "@/components/messages/conv-row-menu";

export const metadata = {
  title: "ข้อความ",
  robots: { index: false, follow: false },
};

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีก่อน`;
  const h = Math.floor(min / 60);
  if (h < 24)
    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const day = Math.floor(h / 24);
  if (day < 7)
    return d.toLocaleDateString("th-TH", { weekday: "short" }) +
      " " +
      d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/messages");

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, hidden_at, conversations(id, last_message_at)")
    .eq("user_id", user.id)
    .is("hidden_at", null);

  const convIds = (memberships ?? []).map((m: any) => m.conversation_id);

  // อีกฝั่ง (สำหรับห้อง 1:1)
  const { data: others } = convIds.length
    ? await supabase
        .from("conversation_members")
        .select("conversation_id, profiles(username, display_name, avatar_url, role)")
        .in("conversation_id", convIds)
        .neq("user_id", user.id)
    : { data: [] as any[] };

  // ข้อความล่าสุดต่อห้อง (ดึงหลายข้อความแล้ว group ฝั่ง app)
  const { data: recentMsgs } = convIds.length
    ? await supabase
        .from("messages")
        .select("conversation_id, body, sender_id, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [] as any[] };

  const lastByConv = new Map<number, any>();
  const unreadByConv = new Map<number, number>();
  const lastReadByConv = new Map<number, string>(
    (memberships ?? []).map((m: any) => [
      m.conversation_id,
      m.last_read_at ?? "1970-01-01T00:00:00Z",
    ]),
  );

  for (const m of recentMsgs ?? []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, m);
    }
    const lr = lastReadByConv.get(m.conversation_id);
    if (lr && new Date(m.created_at) > new Date(lr) && m.sender_id !== user.id) {
      unreadByConv.set(
        m.conversation_id,
        (unreadByConv.get(m.conversation_id) ?? 0) + 1,
      );
    }
  }

  const otherByConv = new Map<number, any>();
  (others ?? []).forEach((o: any) =>
    otherByConv.set(o.conversation_id, o.profiles),
  );

  const sorted = [...(memberships ?? [])].sort((a: any, b: any) => {
    const aLast =
      lastByConv.get(a.conversation_id)?.created_at ??
      a.conversations?.last_message_at ??
      0;
    const bLast =
      lastByConv.get(b.conversation_id)?.created_at ??
      b.conversations?.last_message_at ??
      0;
    return new Date(bLast).getTime() - new Date(aLast).getTime();
  });

  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
        ข้อความ
      </h1>
      {searchParams.error && (
        <p className="mb-3 rounded border border-error-container bg-error-container px-4 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}
      <div className="card divide-y divide-outline-variant">
        {sorted.length > 0 ? (
          sorted.map((m: any) => {
            const other = otherByConv.get(m.conversation_id);
            const last = lastByConv.get(m.conversation_id);
            const unread = unreadByConv.get(m.conversation_id) ?? 0;
            const isUnread = unread > 0;
            const otherName =
              other?.display_name || other?.username || "ผู้ใช้";
            const preview = last
              ? (last.sender_id === user.id ? "คุณ: " : "") + (last.body ?? "")
              : "ยังไม่มีข้อความ — เริ่มทักทาย";
            return (
              <div
                key={m.conversation_id}
                className="flex items-center gap-1 pr-2 transition hover:bg-surface-container-low"
              >
                <Link
                  href={`/messages/${m.conversation_id}`}
                  className="flex flex-1 items-center gap-3 px-3 py-3"
                >
                  <Avatar
                    src={other?.avatar_url}
                    name={otherName}
                    role={other?.role ?? null}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate ${isUnread ? "font-semibold text-on-surface" : "font-medium text-on-surface"}`}
                      >
                        {otherName}
                      </p>
                      {last && (
                        <span
                          className={`shrink-0 text-[11px] ${isUnread ? "font-semibold text-primary" : "text-on-surface-variant"}`}
                        >
                          {relTime(last.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${isUnread ? "text-on-surface" : "text-on-surface-variant"}`}
                      >
                        {preview}
                      </p>
                      {isUnread && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <ConvRowMenu conversationId={m.conversation_id} />
              </div>
            );
          })
        ) : (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            ยังไม่มีบทสนทนา — เปิดโปรไฟล์สมาชิกแล้วกด “ส่งข้อความ”
          </p>
        )}
      </div>
    </div>
  );
}
