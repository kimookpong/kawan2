"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Quote, Code, Link2, Image as ImageIcon,
  Youtube, EyeOff, Smile, Eraser, Eye, Pencil, Facebook, Video, Music2, AtSign,
} from "lucide-react";
import { renderBBCode } from "@/lib/bbcode";
import { createClient } from "@/lib/supabase/client";

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😅",
  "😭","😢","😡","👍","👎","🙏","👏","🔥","💯","✨",
  "❤️","💔","🎉","😴","🤝","🙌","😱","😏","🤗","🥰",
];

export function BBCodeEditor({
  name = "body",
  defaultValue = "",
  placeholder = "พิมพ์ข้อความ... รองรับ BBCode เช่น [b]ตัวหนา[/b]",
  rows = 6,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [showEmoji, setShowEmoji] = useState(false);
  const [preview, setPreview] = useState(false);

  // ----- mention autocomplete -----
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null);
  const [mentions, setMentions] = useState<{ username: string; display_name: string | null }[]>([]);

  // รับ event "อ้างอิง" จากปุ่ม QuoteButton
  useEffect(() => {
    function onQuote(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail) return;
      setPreview(false);
      setValue((v) => (v ? v.replace(/\n*$/, "\n\n") : "") + detail);
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
    window.addEventListener("bbcode-quote", onQuote as EventListener);
    return () => window.removeEventListener("bbcode-quote", onQuote as EventListener);
  }, []);

  // ค้นหาผู้ใช้สำหรับ mention (debounce)
  useEffect(() => {
    if (mentionAnchor === null || mentionQuery === null || mentionQuery.length < 1) {
      setMentions([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name")
        .ilike("username", `${mentionQuery}%`)
        .limit(6);
      setMentions(data ?? []);
    }, 180);
    return () => clearTimeout(t);
  }, [mentionQuery, mentionAnchor]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    const caret = e.target.selectionStart ?? v.length;
    const mt = v.slice(0, caret).match(/@([A-Za-z0-9_]{1,30})$/);
    if (mt) {
      setMentionAnchor(caret - mt[0].length);
      setMentionQuery(mt[1]);
    } else {
      setMentionAnchor(null);
      setMentionQuery(null);
    }
  }

  function pickMention(username: string) {
    if (mentionAnchor === null) return;
    const tokenEnd = mentionAnchor + 1 + (mentionQuery?.length ?? 0);
    const next = value.slice(0, mentionAnchor) + "@" + username + " " + value.slice(tokenEnd);
    setValue(next);
    setMentions([]);
    setMentionAnchor(null);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        const pos = mentionAnchor + username.length + 2;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  }

  function apply(before: string, after = "", placeholderText = "") {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end) || placeholderText;
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + before.length + sel.length;
      el.setSelectionRange(start + before.length, caret);
    });
  }

  function insert(text: string) {
    const el = ref.current;
    if (!el) {
      setValue((v) => v + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + text.length;
      el.setSelectionRange(caret, caret);
    });
  }

  const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" title={title} onClick={onClick} className="rounded p-1.5 text-on-surface-variant transition hover:bg-surface-container hover:text-primary">
      {children}
    </button>
  );

  return (
    <div className="relative">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-outline-variant bg-surface-container-low px-2 py-1.5">
        <Btn title="ตัวหนา [b]" onClick={() => apply("[b]", "[/b]", "ตัวหนา")}><Bold className="h-4 w-4" /></Btn>
        <Btn title="ตัวเอียง [i]" onClick={() => apply("[i]", "[/i]", "ตัวเอียง")}><Italic className="h-4 w-4" /></Btn>
        <Btn title="ขีดเส้นใต้ [u]" onClick={() => apply("[u]", "[/u]", "ขีดเส้นใต้")}><Underline className="h-4 w-4" /></Btn>
        <Btn title="ขีดฆ่า [s]" onClick={() => apply("[s]", "[/s]", "ขีดฆ่า")}><Strikethrough className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-outline-variant" />
        <Btn title="อ้างอิง [quote]" onClick={() => apply("[quote]", "[/quote]", "ข้อความอ้างอิง")}><Quote className="h-4 w-4" /></Btn>
        <Btn title="โค้ด [code]" onClick={() => apply("[code]", "[/code]", "code")}><Code className="h-4 w-4" /></Btn>
        <Btn title="สปอยล์ [spoiler]" onClick={() => apply("[spoiler]", "[/spoiler]", "เนื้อหาสปอยล์")}><EyeOff className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-outline-variant" />
        <Btn title="ลิงก์ [url]" onClick={() => apply("[url=https://]", "[/url]", "ข้อความลิงก์")}><Link2 className="h-4 w-4" /></Btn>
        <Btn title="รูปภาพ [img]" onClick={() => insert("[img]https://[/img]")}><ImageIcon className="h-4 w-4" /></Btn>
        <Btn title="วิดีโอ YouTube" onClick={() => insert("[youtube]VIDEO_ID[/youtube]")}><Youtube className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-outline-variant" />
        <Btn title="Facebook โพสต์" onClick={() => insert("[fbpost]https://www.facebook.com/USER/posts/ID[/fbpost]")}><Facebook className="h-4 w-4" /></Btn>
        <Btn title="Facebook คลิป/วิดีโอ" onClick={() => insert("[fbvideo]https://www.facebook.com/USER/videos/ID[/fbvideo]")}><Video className="h-4 w-4" /></Btn>
        <Btn title="TikTok คลิป" onClick={() => insert("[tiktok]https://www.tiktok.com/@USER/video/ID[/tiktok]")}><Music2 className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-outline-variant" />

        {/* สี */}
        <select
          title="สีตัวอักษร"
          onChange={(e) => { if (e.target.value) { apply(`[color=${e.target.value}]`, "[/color]", "ข้อความ"); e.target.selectedIndex = 0; } }}
          className="rounded border border-outline-variant bg-surface-container-lowest px-1.5 py-1 text-xs outline-none"
          defaultValue=""
        >
          <option value="">สี</option>
          <option value="#ba1a1a">แดง</option>
          <option value="#0b513d">เขียว</option>
          <option value="#1d4ed8">น้ำเงิน</option>
          <option value="#b45309">ส้ม</option>
          <option value="#7c3aed">ม่วง</option>
        </select>

        {/* ขนาด */}
        <select
          title="ขนาดตัวอักษร"
          onChange={(e) => { if (e.target.value) { apply(`[size=${e.target.value}]`, "[/size]", "ข้อความ"); e.target.selectedIndex = 0; } }}
          className="rounded border border-outline-variant bg-surface-container-lowest px-1.5 py-1 text-xs outline-none"
          defaultValue=""
        >
          <option value="">ขนาด</option>
          <option value="2">เล็ก</option>
          <option value="4">ปกติ</option>
          <option value="6">ใหญ่</option>
          <option value="7">ใหญ่มาก</option>
        </select>

        <span className="mx-1 h-5 w-px bg-outline-variant" />
        <Btn title="กล่าวถึงผู้ใช้ (@)" onClick={() => insert("@")}><AtSign className="h-4 w-4" /></Btn>
        <Btn title="อิโมจิ" onClick={() => setShowEmoji((s) => !s)}><Smile className="h-4 w-4" /></Btn>
        <Btn title="ล้างทั้งหมด" onClick={() => setValue("")}><Eraser className="h-4 w-4" /></Btn>

        {/* ปุ่ม preview (ขวาสุด) */}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className={`ml-auto inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${
            preview ? "bg-primary text-on-primary" : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          {preview ? <><Pencil className="h-3.5 w-3.5" /> แก้ไข</> : <><Eye className="h-3.5 w-3.5" /> ดูตัวอย่าง</>}
        </button>
      </div>

      {/* emoji panel */}
      {showEmoji && (
        <div className="flex flex-wrap gap-1 border-b border-outline-variant bg-surface-container-lowest p-2">
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => { insert(em); }}
              className="rounded p-1 text-lg leading-none transition hover:bg-surface-container"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* พรีวิว (แสดงแทน textarea แต่ textarea ยังอยู่ใน DOM เพื่อให้ฟอร์มส่งค่าได้) */}
      {preview && (
        <div
          className="bbcode min-h-[8rem] bg-surface-container-lowest px-4 py-3 text-sm text-on-surface"
          dangerouslySetInnerHTML={{ __html: renderBBCode(value) || '<span class="text-on-surface-variant">— ไม่มีเนื้อหา —</span>' }}
        />
      )}
      <div className="relative">
        <textarea
          ref={ref}
          name={name}
          required
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full resize-y bg-surface-container-lowest px-4 py-3 font-mono text-sm outline-none ${preview ? "hidden" : ""}`}
        />

        {/* dropdown แนะนำผู้ใช้สำหรับ @mention */}
        {!preview && mentions.length > 0 && (
          <ul className="absolute left-3 top-2 z-20 w-56 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-card">
            {mentions.map((u) => (
              <li key={u.username}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); pickMention(u.username); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-container"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.display_name || u.username}</span>
                    <span className="block truncate text-xs text-on-surface-variant">@{u.username}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
