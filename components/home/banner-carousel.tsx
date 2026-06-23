"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Banner = {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  image?: string | null;
  theme: "green" | "amber" | "dark";
};

const THEME: Record<Banner["theme"], { wrap: string; overlay: string; eyebrow: string; cta: string }> = {
  green: {
    wrap: "bg-primary text-on-primary",
    overlay: "bg-gradient-to-r from-primary via-primary/80 to-primary/30",
    eyebrow: "text-on-tertiary-container",
    cta: "bg-tertiary-container text-on-tertiary hover:opacity-90",
  },
  amber: {
    wrap: "bg-[#0f1b2e] text-white",
    overlay: "bg-gradient-to-r from-[#0f1b2e] via-[#0f1b2e]/85 to-[#0f1b2e]/40",
    eyebrow: "text-amber-400",
    cta: "bg-amber-400 text-[#0f1b2e] hover:bg-amber-300",
  },
  dark: {
    wrap: "bg-inverse-surface text-inverse-on-surface",
    overlay: "bg-gradient-to-r from-inverse-surface via-inverse-surface/80 to-inverse-surface/30",
    eyebrow: "text-inverse-primary",
    cta: "bg-inverse-primary text-primary hover:opacity-90",
  },
};

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const n = banners.length;
  const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  return (
    <div className="group relative overflow-hidden rounded-xl">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {banners.map((b) => {
          const t = THEME[b.theme];
          return (
            <div key={b.id} className={`relative min-w-full ${t.wrap}`}>
              <div className="relative h-[200px] sm:h-[240px]">
                {b.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className={`absolute inset-0 ${t.overlay}`} />
                <div className="relative flex h-full max-w-2xl flex-col justify-center gap-2 p-6 sm:p-10">
                  {b.eyebrow && <p className={`text-xs font-bold tracking-widest ${t.eyebrow}`}>{b.eyebrow}</p>}
                  <h2 className="text-xl font-bold leading-snug sm:text-2xl md:text-3xl">{b.title}</h2>
                  {b.subtitle && <p className="line-clamp-2 text-sm opacity-80">{b.subtitle}</p>}
                  {b.cta && (
                    <Link
                      href={b.cta.href}
                      className={`mt-2 inline-flex w-fit items-center rounded-lg px-5 py-2.5 text-sm font-bold transition ${t.cta}`}
                    >
                      {b.cta.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <>
          {/* arrows */}
          <button
            onClick={() => go(-1)}
            aria-label="ก่อนหน้า"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="ถัดไป"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* dots */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`สไลด์ ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
