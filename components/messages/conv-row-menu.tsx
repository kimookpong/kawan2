"use client";

import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { hideConversation } from "@/app/messages/actions";

export function ConvRowMenu({ conversationId }: { conversationId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
        aria-label="เมนูเพิ่มเติม"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button
            aria-hidden
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
            }}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-card">
            <form action={hideConversation}>
              <input
                type="hidden"
                name="conversation_id"
                value={conversationId}
              />
              <button
                type="submit"
                onClick={(e) => {
                  if (
                    !confirm(
                      "ลบแชตนี้ออกจากรายการของคุณ?\n(ห้องจะกลับมาเมื่อมีข้อความใหม่)",
                    )
                  ) {
                    e.preventDefault();
                    setOpen(false);
                  }
                  // กรณีกดยืนยัน: ปล่อยให้ form submit ทำงาน
                  // ห้าม setOpen(false) ตรงนี้ — จะ unmount form ก่อน submit
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-error-container"
              >
                <Trash2 className="h-4 w-4" /> ลบแชต
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
