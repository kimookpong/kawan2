"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { processNewsFromUrl } from "@/app/news/fetch/actions";
import { useEffect } from "react";

const initialState = { error: "" };

export function DraftForm({ url, title, description }: { url: string; title: string; description: string }) {
  const [state, formAction] = useFormState(processNewsFromUrl, initialState);

  useEffect(() => {
    if (state?.error) {
      alert(`ดึงข้อมูลไม่สำเร็จ: ${state.error}`);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="url" value={url} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="description" value={description} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-accent inline-flex items-center gap-1 text-sm disabled:opacity-50">
      <Plus className="h-4 w-4" /> {pending ? "กำลังดึงข้อมูล..." : "สร้างฉบับร่าง"}
    </button>
  );
}
