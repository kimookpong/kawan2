"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Flag, Check } from "lucide-react";
import { reportAction } from "@/app/board/actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-on-error transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "กำลังส่ง..." : "ยืนยันรายงาน"}
    </button>
  );
}

/** ปุ่มรายงานเนื้อหา — เปิดกล่องยืนยัน + เหตุผล (ไม่บังคับ) แล้วส่งให้แอดมิน */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "thread" | "post" | "news" | "news_comment";
  targetId: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(reportAction, null);

  if (state?.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
        <Check className="h-3.5 w-3.5" /> รายงานแล้ว ขอบคุณที่ช่วยดูแลชุมชน
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-error"
      >
        <Flag className="h-3.5 w-3.5" /> รายงาน
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-outline-variant bg-surface p-3 shadow-card">
          <p className="text-sm font-semibold text-on-surface">รายงานเนื้อหานี้</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            แจ้งทีมผู้ดูแลให้ตรวจสอบ — โปรดระบุเหตุผล (ไม่บังคับ)
          </p>
          <form action={formAction} className="mt-2 space-y-2">
            <input type="hidden" name="target_type" value={targetType} />
            <input type="hidden" name="target_id" value={targetId} />
            <textarea
              name="reason"
              rows={2}
              placeholder="เช่น เนื้อหาไม่เหมาะสม / สแปม / ละเมิดผู้อื่น"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-sm outline-none focus:border-primary"
            />
            {state?.error && <p className="text-xs text-error">{state.error}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low"
              >
                ยกเลิก
              </button>
              <SubmitBtn />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
