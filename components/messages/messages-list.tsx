"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckSquare, Square, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ConvRowMenu } from "@/components/messages/conv-row-menu";
import { hideConversations } from "@/app/messages/actions";

type Other = {
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
} | null;

export type ConvItem = {
  conversation_id: number;
  other: Other;
  otherName: string;
  preview: string;
  lastTime: string | null;
  unread: number;
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
    return (
      d.toLocaleDateString("th-TH", { weekday: "short" }) +
      " " +
      d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
    );
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function Row({
  item,
  selectMode,
  selected,
}: {
  item: ConvItem;
  selectMode: boolean;
  selected: boolean;
}) {
  const isUnread = item.unread > 0;
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      {selectMode && (
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
            selected
              ? "border-primary bg-primary"
              : "border-outline-variant bg-surface"
          }`}
          aria-hidden
        >
          {selected && <Check className="h-4 w-4 text-on-primary" />}
        </span>
      )}
      <Avatar
        src={item.other?.avatar_url}
        name={item.otherName}
        role={item.other?.role ?? null}
        size={48}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate ${isUnread ? "font-semibold text-on-surface" : "font-medium text-on-surface"}`}
          >
            {item.otherName}
          </p>
          {item.lastTime && (
            <span
              className={`shrink-0 text-[11px] ${isUnread ? "font-semibold text-primary" : "text-on-surface-variant"}`}
            >
              {relTime(item.lastTime)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`truncate text-sm ${isUnread ? "text-on-surface" : "text-on-surface-variant"}`}
          >
            {item.preview}
          </p>
          {isUnread && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">
              {item.unread > 9 ? "9+" : item.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessagesList({ items }: { items: ConvItem[] }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const exit = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const selectAll = () => setSelected(new Set(items.map((i) => i.conversation_id)));

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm text-on-surface-variant">
          {items.length} บทสนทนา
        </span>
        {!selectMode ? (
          items.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="btn-outline gap-1 text-sm"
            >
              <CheckSquare className="h-4 w-4" /> เลือก
            </button>
          )
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={allSelected ? () => setSelected(new Set()) : selectAll}
              className="btn-outline gap-1 text-sm"
            >
              {allSelected ? (
                <>
                  <Square className="h-4 w-4" /> ยกเลิกเลือกทั้งหมด
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" /> เลือกทั้งหมด
                </>
              )}
            </button>
            <button
              type="button"
              onClick={exit}
              className="btn-outline text-sm"
            >
              ออก
            </button>
          </div>
        )}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="sticky top-2 z-30 mb-3 flex items-center justify-between gap-2 rounded-lg border border-primary bg-primary-container px-3 py-2 text-sm text-on-primary-container">
          <span>เลือก {selected.size} รายการ</span>
          <form action={hideConversations}>
            {Array.from(selected).map((id) => (
              <input
                key={id}
                type="hidden"
                name="conversation_id"
                value={id}
              />
            ))}
            <button
              type="submit"
              onClick={(e) => {
                if (
                  !confirm(
                    `ลบ ${selected.size} แชต?\n(แต่ละห้องจะกลับมาเมื่อมีข้อความใหม่)`,
                  )
                ) {
                  e.preventDefault();
                }
              }}
              className="btn-primary gap-1 text-sm"
            >
              <Trash2 className="h-4 w-4" /> ลบที่เลือก
            </button>
          </form>
        </div>
      )}

      <div className="card divide-y divide-outline-variant">
        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            ยังไม่มีบทสนทนา — เปิดโปรไฟล์สมาชิกแล้วกด “ส่งข้อความ”
          </p>
        ) : (
          items.map((item) => {
            const isSel = selected.has(item.conversation_id);
            if (selectMode) {
              return (
                <button
                  key={item.conversation_id}
                  type="button"
                  onClick={() => toggle(item.conversation_id)}
                  className={`flex w-full text-left transition ${
                    isSel ? "bg-primary/5" : "hover:bg-surface-container-low"
                  }`}
                >
                  <Row item={item} selectMode={selectMode} selected={isSel} />
                </button>
              );
            }
            return (
              <div
                key={item.conversation_id}
                className="flex items-center gap-1 pr-2 transition hover:bg-surface-container-low"
              >
                <Link
                  href={`/messages/${item.conversation_id}`}
                  className="flex flex-1"
                >
                  <Row item={item} selectMode={false} selected={false} />
                </Link>
                <ConvRowMenu conversationId={item.conversation_id} />
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
