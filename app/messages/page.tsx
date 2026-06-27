import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessagesList, type ConvItem } from "@/components/messages/messages-list";

export const metadata = {
  title: "ข้อความ",
  robots: { index: false, follow: false },
};

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
    .select(
      "conversation_id, last_read_at, hidden_at, conversations(id, last_message_at)",
    )
    .eq("user_id", user.id)
    .is("hidden_at", null);

  const convIds = (memberships ?? []).map((m: any) => m.conversation_id);

  const { data: others } = convIds.length
    ? await supabase
        .from("conversation_members")
        .select(
          "conversation_id, profiles(username, display_name, avatar_url, role)",
        )
        .in("conversation_id", convIds)
        .neq("user_id", user.id)
    : { data: [] as any[] };

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
    if (
      lr &&
      new Date(m.created_at) > new Date(lr) &&
      m.sender_id !== user.id
    ) {
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

  const items: ConvItem[] = (memberships ?? [])
    .map((m: any) => {
      const other = otherByConv.get(m.conversation_id) ?? null;
      const last = lastByConv.get(m.conversation_id);
      const unread = unreadByConv.get(m.conversation_id) ?? 0;
      const otherName =
        other?.display_name || other?.username || "ผู้ใช้";
      const preview = last
        ? (last.sender_id === user.id ? "คุณ: " : "") + (last.body ?? "")
        : "ยังไม่มีข้อความ — เริ่มทักทาย";
      return {
        conversation_id: m.conversation_id,
        other,
        otherName,
        preview,
        lastTime:
          last?.created_at ?? m.conversations?.last_message_at ?? null,
        unread,
      };
    })
    .sort((a, b) => {
      const at = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const bt = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return bt - at;
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
      <MessagesList items={items} />
    </div>
  );
}
