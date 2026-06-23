import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";

export default async function MessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/messages");

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, conversations(id, last_message_at)")
    .eq("user_id", user.id);

  const convIds = (memberships ?? []).map((m: any) => m.conversation_id);

  // ดึงคู่สนทนา + ข้อความล่าสุด
  const { data: others } = convIds.length
    ? await supabase
        .from("conversation_members")
        .select("conversation_id, profiles(username, display_name, avatar_url)")
        .in("conversation_id", convIds)
        .neq("user_id", user.id)
    : { data: [] as any[] };

  const otherByConv = new Map<number, any>();
  (others ?? []).forEach((o: any) => otherByConv.set(o.conversation_id, o.profiles));

  const sorted = [...(memberships ?? [])].sort(
    (a: any, b: any) =>
      new Date(b.conversations?.last_message_at ?? 0).getTime() -
      new Date(a.conversations?.last_message_at ?? 0).getTime()
  );

  return (
    <div className="w-full">
      <h1 className="mb-4 text-2xl font-bold text-primary">ข้อความ</h1>
      <div className="card divide-y divide-outline-variant">
        {sorted.length > 0 ? (
          sorted.map((m: any) => {
            const other = otherByConv.get(m.conversation_id);
            return (
              <Link
                key={m.conversation_id}
                href={`/messages/${m.conversation_id}`}
                className="flex items-center gap-3 p-4 hover:bg-surface-container-low"
              >
                <Avatar src={other?.avatar_url} name={other?.display_name || other?.username} size={40} />
                <div className="flex-1">
                  <p className="font-medium">{other?.display_name || other?.username || "ผู้ใช้"}</p>
                  <p className="text-xs text-on-surface-variant">
                    {m.conversations?.last_message_at &&
                      new Date(m.conversations.last_message_at).toLocaleString("th-TH")}
                  </p>
                </div>
              </Link>
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
