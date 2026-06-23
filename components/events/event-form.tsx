import { createClient } from "@/lib/supabase/server";

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  cover_url: string | null;
  province_id: number | null;
  starts_at: string | null;
  ends_at: string | null;
};

/** แปลง ISO → ค่าใส่ใน <input type="datetime-local"> (YYYY-MM-DDTHH:mm) */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FIELD = "w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary";

export async function EventForm({
  action,
  event,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  event?: EventRow;
  submitLabel: string;
}) {
  const supabase = createClient();
  const { data: provinces } = await supabase.from("provinces").select("id, name_th").order("id");

  return (
    <form action={action} className="card space-y-4 p-5">
      {event && <input type="hidden" name="id" value={event.id} />}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-on-surface">ชื่อกิจกรรม *</span>
        <input name="title" required defaultValue={event?.title ?? ""} maxLength={200} className={FIELD} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-on-surface">รายละเอียด</span>
        <textarea name="description" rows={4} defaultValue={event?.description ?? ""} className={FIELD} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-on-surface">สถานที่</span>
          <input name="location" defaultValue={event?.location ?? ""} className={FIELD} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-on-surface">จังหวัด</span>
          <select name="province_id" defaultValue={event?.province_id ?? ""} className={FIELD}>
            <option value="">— ไม่ระบุ —</option>
            {(provinces ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name_th}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-on-surface">วันเวลาที่เริ่ม *</span>
          <input type="datetime-local" name="starts_at" required defaultValue={toLocalInput(event?.starts_at ?? null)} className={FIELD} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-on-surface">วันเวลาที่สิ้นสุด</span>
          <input type="datetime-local" name="ends_at" defaultValue={toLocalInput(event?.ends_at ?? null)} className={FIELD} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-on-surface">ลิงก์รูปปก (URL)</span>
        <input name="cover_url" type="url" defaultValue={event?.cover_url ?? ""} placeholder="https://..." className={FIELD} />
      </label>

      <div className="flex justify-end">
        <button className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
