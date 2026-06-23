"use client";

import { CornerUpLeft } from "lucide-react";

/** ปุ่ม "อ้างอิง" — ส่งข้อความ quote ไปยัง BBCodeEditor ผ่าน custom event */
export function QuoteButton({ author, body }: { author: string; body: string }) {
  const onClick = () => {
    const plain = body
      .replace(/\[[^\]]*\]/g, "") // ตัด BBCode tag
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
    const text = `[quote=${author}]${plain}[/quote]\n`;
    window.dispatchEvent(new CustomEvent("bbcode-quote", { detail: text }));
  };

  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-primary">
      <CornerUpLeft className="h-3.5 w-3.5" /> อ้างอิง
    </button>
  );
}
