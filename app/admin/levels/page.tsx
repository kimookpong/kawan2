import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LevelBadge } from "@/components/user-badges";

async function saveLevel(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.rpc("update_level", {
    p_id: Number(formData.get("id")),
    p_name_th: String(formData.get("name_th")),
    p_name_en: String(formData.get("name_en")),
    p_min_points: Number(formData.get("min_points")),
    p_color: String(formData.get("color") || ""),
  });
  revalidatePath("/admin/levels");
  redirect(`/admin/levels?${error ? "error=" + encodeURIComponent(error.message) : "ok=1"}`);
}

export default async function AdminLevelsPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: levels } = await supabase
    .from("membership_levels")
    .select("id, name_th, name_en, min_points, color")
    .order("id");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-primary sm:text-2xl">จัดการระดับสมาชิก</h1>
        <p className="text-sm text-on-surface-variant">
          แก้ชื่อและคะแนนขั้นต่ำของแต่ละระดับ — เมื่อบันทึก ระบบจะคำนวณระดับของสมาชิกทุกคนใหม่ทันที
        </p>
      </div>

      {searchParams.ok && (
        <p className="flex items-center gap-2 rounded border border-primary/30 bg-primary-container/5 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> บันทึกและคำนวณระดับสมาชิกใหม่เรียบร้อย
        </p>
      )}
      {searchParams.error && (
        <p className="flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}

      <div className="space-y-3">
        {(levels ?? []).map((l: any) => (
          <form key={l.id} action={saveLevel} className="card flex flex-wrap items-end gap-3 p-4">
            <input type="hidden" name="id" value={l.id} />
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-on-primary">
                {l.id}
              </span>
              <LevelBadge levelId={l.id} />
            </div>
            <Field label="ชื่อ (ไทย)" name="name_th" defaultValue={l.name_th} className="min-w-[140px] flex-1" />
            <Field label="ชื่อ (อังกฤษ)" name="name_en" defaultValue={l.name_en} className="min-w-[120px] flex-1" />
            <Field label="คะแนนขั้นต่ำ" name="min_points" type="number" defaultValue={String(l.min_points)} className="w-32" />
            <label className="block">
              <span className="mb-1 block text-xs text-on-surface-variant">สี (RGB)</span>
              <input
                name="color"
                type="color"
                defaultValue={l.color || "#64748b"}
                className="h-10 w-14 cursor-pointer rounded border border-outline-variant bg-surface-container-low p-1"
              />
            </label>
            <button className="btn-primary">บันทึก</button>
          </form>
        ))}
        {(!levels || levels.length === 0) && (
          <p className="card p-6 text-center text-sm text-on-surface-variant">ยังไม่มีข้อมูลระดับสมาชิก</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label, name, defaultValue, type = "text", className = "",
}: {
  label: string; name: string; defaultValue: string; type?: string; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-on-surface-variant">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        required
        className="w-full rounded border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
