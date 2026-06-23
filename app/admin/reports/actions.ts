"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** แอดมินตัดสินรายงาน: delete=1 → ลบเนื้อหาถาวร, อื่นๆ → ยกเลิก (dismiss) */
export async function resolveReport(formData: FormData) {
  const supabase = createClient();
  const reportId = Number(formData.get("report_id"));
  const del = String(formData.get("delete")) === "1";
  await supabase.rpc("resolve_report", { p_report: reportId, p_delete: del });
  revalidatePath("/admin/reports");
}
