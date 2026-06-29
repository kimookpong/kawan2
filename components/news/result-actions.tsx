"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Plus, Eye, Send, X, FileEdit } from "lucide-react";
import { processNewsFromUrl } from "@/app/news/fetch/actions";
import { useEffect, useState, useRef } from "react";
import { renderBBCode } from "@/lib/bbcode";
import Image from "next/image";

const initialState: any = { error: "", previewData: null };

export function ResultActions({ url, title, description }: { url: string; title: string; description: string }) {
  const [state, formAction] = useFormState(processNewsFromUrl, initialState);
  const [actionType, setActionType] = useState<"preview" | "draft" | "publish">("draft");
  
  // Manage preview modal
  const [showPreview, setShowPreview] = useState(false);
  const previewData = state?.previewData;

  useEffect(() => {
    if (state?.error) {
      alert(`ดำเนินการไม่สำเร็จ: ${state.error}`);
    }
    if (state?.previewData) {
      setShowPreview(true);
    }
  }, [state]);

  // A helper ref to submit the form again from the modal
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (type: "preview" | "draft" | "publish") => {
    setActionType(type);
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  };

  return (
    <>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="url" value={url} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="actionType" value={actionType} />
        <ActionButtons onClick={handleSubmit} />
      </form>

      {showPreview && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <h2 className="text-xl font-bold">พรีวิวข่าว</h2>
              <button 
                onClick={() => setShowPreview(false)}
                className="rounded-full p-2 hover:bg-surface-container transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bbcode">
              {previewData.cover_url && (
                <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg">
                  <Image 
                    src={previewData.cover_url} 
                    alt={previewData.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <h1 className="mb-4 text-3xl font-bold">{previewData.title}</h1>
              {previewData.excerpt && (
                <p className="mb-6 border-l-4 border-primary pl-4 text-lg text-on-surface-variant">
                  {previewData.excerpt}
                </p>
              )}
              <div 
                dangerouslySetInnerHTML={{ __html: renderBBCode(previewData.body) }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-outline-variant bg-surface-container-lowest px-6 py-4">
              <button 
                onClick={() => setShowPreview(false)}
                className="btn-outline px-4 py-2 text-sm"
              >
                ปิด
              </button>
              <button 
                onClick={() => handleSubmit("draft")}
                className="btn-outline flex items-center gap-2 px-4 py-2 text-sm text-primary"
              >
                <FileEdit className="h-4 w-4" /> แก้ไขก่อนโพสต์
              </button>
              <button 
                onClick={() => handleSubmit("publish")}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
              >
                <Send className="h-4 w-4" /> โพสต์ทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionButtons({ onClick }: { onClick: (type: "preview" | "draft" | "publish") => void }) {
  const { pending } = useFormStatus();
  
  return (
    <>
      <button 
        type="button" 
        onClick={() => onClick("preview")}
        disabled={pending} 
        className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        <Eye className="h-3.5 w-3.5" /> พรีวิว
      </button>
      <button 
        type="button" 
        onClick={() => onClick("draft")}
        disabled={pending} 
        className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-50"
      >
        <FileEdit className="h-3.5 w-3.5" /> แก้ไขก่อนโพสต์
      </button>
      <button 
        type="button" 
        onClick={() => onClick("publish")}
        disabled={pending} 
        className="btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" /> {pending ? "กำลังดำเนินการ..." : "โพสต์ทันที"}
      </button>
    </>
  );
}
