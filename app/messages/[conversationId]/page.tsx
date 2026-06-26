import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoom } from "@/components/messages/chat-room";

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const convId = Number(params.conversationId);
  if (!user) redirect(`/auth/login?redirect=/messages/${convId}`);

  // ตรวจว่าเป็นสมาชิกห้อง (RLS จะกันอยู่แล้ว แต่เช็คเพื่อ UX)
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", convId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();

  const { data: other } = await supabase
    .from("conversation_members")
    .select("profiles(username, display_name, avatar_url, role)")
    .eq("conversation_id", convId)
    .neq("user_id", user.id)
    .maybeSingle();

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("conversation_id", convId)
    .order("created_at")
    .limit(100);

  const op = (other?.profiles as any) ?? null;
  const otherName = op?.display_name || op?.username || "ผู้ใช้";

  return (
    <ChatRoom
      conversationId={convId}
      currentUserId={user.id}
      otherName={otherName}
      otherUsername={op?.username ?? null}
      otherAvatar={op?.avatar_url ?? null}
      otherRole={op?.role ?? null}
      initialMessages={initialMessages ?? []}
    />
  );
}
