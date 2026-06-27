import { BBCodeEditor } from "@/components/board/bbcode-editor";

type Cat = { id: number; name_th: string };
type Province = { id: number; name_th: string };
type Defaults = {
  title?: string;
  description?: string;
  category_id?: number | null;
  province_id?: number | null;
  price?: number | null;
  price_type?: string;
  condition?: string;
  cover_url?: string | null;
  image_urls?: string[] | null;
  contact_phone_override?: string | null;
};

export function ListingForm({
  action,
  categories,
  provinces,
  defaults = {},
  listingId,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  categories: Cat[];
  provinces: Province[];
  defaults?: Defaults;
  listingId?: number;
  submitLabel: string;
}) {
  return (
    <form action={action} className="card space-y-4 p-6">
      {listingId && (
        <input type="hidden" name="listing_id" value={listingId} />
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">หัวข้อประกาศ *</label>
        <input
          name="title"
          required
          minLength={5}
          maxLength={200}
          defaultValue={defaults.title ?? ""}
          className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">หมวดสินค้า *</label>
          <select
            name="category_id"
            required
            defaultValue={defaults.category_id ?? ""}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          >
            <option value="">— เลือกหมวด —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_th}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">จังหวัด</label>
          <select
            name="province_id"
            defaultValue={defaults.province_id ?? ""}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          >
            <option value="">— เลือกจังหวัด —</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name_th}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ราคา (บาท)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.price ?? ""}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">รูปแบบราคา</label>
          <select
            name="price_type"
            defaultValue={defaults.price_type ?? "fixed"}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          >
            <option value="fixed">ราคาตายตัว</option>
            <option value="negotiable">ต่อรองได้</option>
            <option value="contact">ติดต่อสอบถาม</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">สภาพ</label>
          <select
            name="condition"
            defaultValue={defaults.condition ?? "used"}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          >
            <option value="new">ของใหม่</option>
            <option value="like_new">เหมือนใหม่</option>
            <option value="used">มือสอง</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          URL รูปหลัก (cover)
        </label>
        <input
          name="cover_url"
          type="url"
          placeholder="https://..."
          defaultValue={defaults.cover_url ?? ""}
          className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          URL รูปเพิ่มเติม (สูงสุด 8 รูป, ขึ้นบรรทัดใหม่หรือคั่นด้วย ,)
        </label>
        <textarea
          name="image_urls_raw"
          rows={4}
          placeholder="https://...&#10;https://..."
          defaultValue={(defaults.image_urls ?? []).join("\n")}
          className="w-full rounded border border-outline-variant px-3 py-2 font-mono text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          เบอร์ติดต่อสำหรับประกาศนี้ (ไม่กรอก = ใช้เบอร์ของร้าน)
        </label>
        <input
          name="contact_phone_override"
          defaultValue={defaults.contact_phone_override ?? ""}
          className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          รายละเอียดสินค้า (รองรับ BBCode)
        </label>
        <div className="overflow-hidden rounded border border-outline-variant">
          <BBCodeEditor
            name="description"
            rows={10}
            defaultValue={defaults.description ?? ""}
            placeholder="บอกรายละเอียดสินค้า สภาพ การจัดส่ง การชำระเงิน ฯลฯ"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
