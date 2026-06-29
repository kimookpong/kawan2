"use client";

import { useState } from "react";

const PRESET_KEYWORDS = [
  "ปัตตานี",
  "ยะลา",
  "นราธิวาส",
  "สามจังหวัดชายแดนใต้",
  "เหตุการณ์ความไม่สงบ",
  "ศอ.บต.",
  "กอ.รมน. ภาค 4",
  "ฟุตบอล ชายแดนใต้",
  "การศึกษา ชายแดนใต้",
  "การท่องเที่ยว ชายแดนใต้",
  "การเมือง ชายแดนใต้",
  "พัฒนาชุมชน ชายแดนใต้",
  "พหุวัฒนธรรม ชายแดนใต้"
];

export function KeywordInput({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue || "");

  return (
    <div className="space-y-2">
      <input 
        name="keyword" 
        required 
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="เช่น น้ำท่วม ปัตตานี" 
        className="w-full rounded border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" 
      />
      <div className="flex flex-wrap gap-2">
        {PRESET_KEYWORDS.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => setValue(kw)}
            className="rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
}
