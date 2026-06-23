import { BBCodeEditor } from "@/components/board/bbcode-editor";

const NEWS_CATEGORIES = ["ข่าวทั่วไป", "วัฒนธรรม", "การศึกษา", "กิจกรรม", "กีฬา", "เศรษฐกิจ", "ประกาศ"];

export type NewsDefaults = {
  id?: number;
  slug?: string;
  title?: string;
  category?: string | null;
  province_id?: number | null;
  excerpt?: string | null;
  body?: string;
  cover_url?: string | null;
  is_featured?: boolean;
  status?: string;
};

export function NewsForm({
  action,
  provinces,
  defaults = {},
  submitLabel,
  isEdit = false,
}: {
  action: (formData: FormData) => void;
  provinces: { id: number; name_th: string }[];
  defaults?: NewsDefaults;
  submitLabel: string;
  isEdit?: boolean;
}) {
  return (
    <form action={action} className="card space-y-4 p-6">
      {isEdit && <input type="hidden" name="id" value={defaults.id} />}
      {isEdit && <input type="hidden" name="slug" value={defaults.slug} />}

      <Field label="หัวข้อข่าว">
        <input name="title" required defaultValue={defaults.title ?? ""} className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="หมวดหมู่">
          <select name="category" defaultValue={defaults.category ?? ""} className={inputCls}>
            <option value="">— ไม่ระบุ —</option>
            {NEWS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="จังหวัด">
          <select name="province_id" defaultValue={defaults.province_id ?? ""} className={inputCls}>
            <option value="">— ทุกจังหวัด —</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name_th}</option>)}
          </select>
        </Field>
        <Field label="สถานะ">
          <select name="status" defaultValue={defaults.status ?? "draft"} className={inputCls}>
            <option value="draft">ฉบับร่าง</option>
            <option value="published">เผยแพร่</option>
            <option value="archived">เก็บเข้าคลัง</option>
          </select>
        </Field>
      </div>

      <Field label="รูปปก (URL)">
        <input name="cover_url" type="url" defaultValue={defaults.cover_url ?? ""} placeholder="https://..." className={inputCls} />
      </Field>

      <Field label="เกริ่นนำ (excerpt)">
        <textarea name="excerpt" rows={2} defaultValue={defaults.excerpt ?? ""} className={inputCls} />
      </Field>

      <Field label="เนื้อหา (รองรับ BBCode)">
        <div className="overflow-hidden rounded border border-outline-variant">
          <BBCodeEditor name="body" defaultValue={defaults.body ?? ""} rows={12} placeholder="เนื้อหาข่าว... ใช้ปุ่มจัดรูปแบบด้านบนได้" />
        </div>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_featured" defaultChecked={defaults.is_featured} className="h-4 w-4" />
        ปักเป็นข่าวเด่น (แสดงบน hero หน้าแรก)
      </label>

      <div className="flex items-center justify-end gap-2 border-t border-outline-variant pt-4">
        <button className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}

const inputCls = "w-full rounded border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
