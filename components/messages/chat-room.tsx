"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";

type Msg = { id: number; body: string | null; sender_id: string; created_at: string };

export function ChatRoom({
  conversationId,
  currentUserId,
  otherName,
  otherUsername,
  otherAvatar,
  otherRole,
  initialMessages,
}: {
  conversationId: number;
  currentUserId: string;
  otherName: string;
  otherUsername?: string | null;
  otherAvatar?: string | null;
  otherRole?: string | null;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Msg).id)
              ? prev
              : [...prev, payload.new as Msg],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body });
    if (error) setText(body);
    setSending(false);
  }

  const headerAvatar = (
    <Avatar src={otherAvatar} name={otherName} role={otherRole ?? null} size={36} />
  );

  return (
    <div className="flex h-[75vh] w-full flex-col">
      <div className="card flex items-center gap-3 rounded-b-none p-4">
        {otherUsername ? (
          <Link
            href={`/u/${otherUsername}`}
            className="flex items-center gap-3 hover:opacity-90"
          >
            {headerAvatar}
            <div>
              <p className="font-semibold leading-tight">{otherName}</p>
              <p className="text-xs text-on-surface-variant">@{otherUsername}</p>
            </div>
          </Link>
        ) : (
          <>
            {headerAvatar}
            <p className="font-semibold">{otherName}</p>
          </>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto border-x border-outline-variant bg-surface-container-low p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-on-surface-variant">
            ยังไม่มีข้อความ — เริ่มทักทายกันได้เลย
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-on-primary/60" : "text-on-surface-variant"}`}>
                  {new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="card flex gap-2 rounded-t-none p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="btn-primary inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> ส่ง
        </button>
      </form>
    </div>
  );
}
