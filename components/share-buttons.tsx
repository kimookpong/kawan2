"use client";

import { useEffect, useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

/** ปุ่มแชร์ไปโซเชียล — LINE, Facebook, X และ Web Share API (มือถือ) */
export function ShareButtons({ title }: { title?: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const enc = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title ?? "");

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* ผู้ใช้ยกเลิก */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ไม่รองรับ */
    }
  }

  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-on-surface-variant">แชร์:</span>

      <a
        href={`https://social-plugins.line.me/lineit/share?url=${enc}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} text-white hover:opacity-90`}
        style={{ background: "#06C755" }}
      >
        LINE
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} text-white hover:opacity-90`}
        style={{ background: "#1877F2" }}
      >
        Facebook
      </a>

      <a
        href={`https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-black text-white hover:opacity-90`}
      >
        X
      </a>

      <button onClick={copyLink} className={`${base} border border-outline-variant text-on-surface-variant hover:bg-surface-container-low`}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
        {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
      </button>

      {canNativeShare && (
        <button onClick={nativeShare} className={`${base} border border-outline-variant text-on-surface-variant hover:bg-surface-container-low`}>
          <Share2 className="h-3.5 w-3.5" /> แชร์อื่นๆ
        </button>
      )}
    </div>
  );
}
