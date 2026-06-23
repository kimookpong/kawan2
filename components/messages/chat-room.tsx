"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = { id: number; body: string | null; sender_id: string; created_at: string };

export function ChatRoom({
  conversationId,
  currentUserId,
  otherName,
  initialMessages,
}: {
  conversationId: number;
  currentUserId: string;
  otherName: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // subscribe ข้อความใหม่แบบ realtime
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
              : [...prev, payload.new as Msg]
          );
        }
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
    if (!body) return;
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body });
    if (error) setText(body); // คืนค่าถ้าส่งไม่สำเร็จ
  }

  return (
    <div className="mx-auto flex h-[75vh] max-w-2xl flex-col">
      <div className="card flex items-center gap-3 rounded-b-none p-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-on-primary">
          {otherName.charAt(0).toUpperCase()}
        </span>
        <p className="font-semibold">{otherName}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto border-x border-outline-variant bg-surface-container-low p-4">
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
        <button className="btn-primary">ส่ง</button>
      </form>
    </div>
  );
}
