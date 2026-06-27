"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { formatPrice, LISTING_STATUS_LABEL } from "@/lib/marketplace";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";

type Msg = { id: number; body: string | null; sender_id: string; created_at: string };
type ListingContext = {
  id: number;
  title: string;
  cover_url: string | null;
  price: number | null;
  price_type: string;
  status: string;
} | null;

export function ChatRoom({
  conversationId,
  currentUserId,
  otherName,
  otherUsername,
  otherAvatar,
  otherRole,
  initialMessages,
  listingContext,
}: {
  conversationId: number;
  currentUserId: string;
  otherName: string;
  otherUsername?: string | null;
  otherAvatar?: string | null;
  otherRole?: string | null;
  initialMessages: Msg[];
  listingContext?: ListingContext;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
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
    setSendError(null);
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body });
    if (error) {
      setText(body);
      setSendError(error.message || "ส่งข้อความไม่สำเร็จ");
    }
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

      {listingContext && (
        <Link
          href={`/marketplace/listing/${listingContext.id}`}
          className="flex items-center gap-3 border-x border-b border-outline-variant bg-primary-container/30 px-4 py-2 transition hover:bg-primary-container/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listingContext.cover_url || NEWS_FALLBACK_IMG}
            alt=""
            className="h-10 w-10 shrink-0 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
              สอบถามเกี่ยวกับประกาศ
            </p>
            <p className="truncate text-sm font-medium text-on-surface">
              {listingContext.title}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-primary">
              {formatPrice(listingContext.price, listingContext.price_type)}
            </p>
            {listingContext.status !== "available" && (
              <span className="rounded bg-error px-1.5 text-[10px] font-bold text-on-error">
                {LISTING_STATUS_LABEL[listingContext.status]}
              </span>
            )}
          </div>
        </Link>
      )}

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

      {sendError && (
        <p className="border-x border-outline-variant bg-error-container px-4 py-2 text-xs text-on-error-container">
          ส่งข้อความไม่สำเร็จ: {sendError}
        </p>
      )}

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
