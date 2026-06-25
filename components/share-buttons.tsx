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
    "inline-flex h-9 w-9 items-center justify-center rounded-full transition shrink-0";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-on-surface-variant">แชร์:</span>

      <a
        href={`https://social-plugins.line.me/lineit/share?url=${enc}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} text-white hover:opacity-90`}
        style={{ background: "#06C755" }}
        title="แชร์ไป LINE"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M24 10.3c0-5.7-5.4-10.3-12-10.3S0 4.6 0 10.3c0 5.1 4.3 9.4 10.1 10.2.4.1.9.3 1.1.7l.4 1.7c.1.5.4 1.3.4 1.3s.1.1.2.1h.2c.1-.1.1-.3.1-.4l-.2-2.5v-.5c.6-.1 1.2-.3 1.8-.5 6-1 9.9-5.3 9.9-9.8zm-15.6 2.4c0 .3-.2.5-.5.5H6.2V8.9c0-.3-.2-.5-.5-.5s-.5.2-.5.5v4.3c0 .3.2.5.5.5h2.2c.3 0 .5-.2.5-.5s-.2-.5-.5-.5zm2.8 0c0 .3-.2.5-.5.5s-.5-.2-.5-.5V8.9c0-.3-.2-.5-.5-.5s-.5.2-.5.5v3.8c0 .3.2.5.5.5s.5-.2.5-.5V8.9c0-.3-.2-.5-.5-.5s-.5.2-.5.5v3.8zm5.7-.5v-3.3c0-.3-.2-.5-.5-.5s-.5.2-.5.5v3.3l-2.4-3.5c-.1-.1-.2-.2-.4-.2h-.2c-.3 0-.5.2-.5.5v4.3c0 .3.2.5.5.5s.5-.2.5-.5v-3.3l2.4 3.5c.1.1.2.2.4.2h.2c.3 0 .5-.2.5-.5zm4.8-2.3c0-.3-.2-.5-.5-.5h-2.1V8.9c0-.3-.2-.5-.5-.5s-.5.2-.5.5v4.3c0 .3.2.5.5.5h2.6c.3 0 .5-.2.5-.5s-.2-.5-.5-.5h-2.1v-.8h2.1c.3 0 .5-.2.5-.5z" />
        </svg>
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} text-white hover:opacity-90`}
        style={{ background: "#1877F2" }}
        title="แชร์ไป Facebook"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      <a
        href={`https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-black text-white hover:opacity-90`}
        title="แชร์ไป X"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      <button
        onClick={copyLink}
        className={`${base} border border-outline-variant text-on-surface-variant hover:bg-surface-container-low`}
        title={copied ? "คัดลอกสำเร็จแล้ว" : "คัดลอกลิงก์"}
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
      </button>

      {canNativeShare && (
        <button
          onClick={nativeShare}
          className={`${base} border border-outline-variant text-on-surface-variant hover:bg-surface-container-low`}
          title="แชร์ไปยังแอปอื่น"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
