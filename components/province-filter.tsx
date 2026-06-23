"use client";

import { useState } from "react";
import { PROVINCES } from "@/lib/constants";

/** ตัวกรองจังหวัด (client) — ในเวอร์ชันเต็มจะผูกกับ query string */
export function ProvinceFilter() {
  const [active, setActive] = useState("all");
  return (
    <div className="flex flex-wrap gap-2">
      {PROVINCES.map((p) => (
        <button
          key={p.slug}
          onClick={() => setActive(p.slug)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            active === p.slug
              ? "bg-primary text-on-primary"
              : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
