import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function updateProfile(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase
    .from("profiles")
    .update({
      display_name: String(formData.get("display_name") || ""),
      bio: String(formData.get("bio") || ""),
      province_id: formData.get("province_id") ? Number(formData.get("province_id")) : null,
    })
    .eq("id", user.id);

  revalidatePath("/me");
}

export default async function MePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/me");

  const [{ data: profile }, { data: provinces }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, bio, province_id").eq("id", user.id).single(),
    supabase.from("provinces").select("id, name_th").eq("is_active", true),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-primary">ตั้งค่าโปรไฟล์</h1>
      <form action={updateProfile} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">ชื่อผู้ใช้</label>
          <input
            value={profile?.username ?? ""}
            disabled
            className="w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-on-surface-variant"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ชื่อที่แสดง</label>
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">จังหวัด</label>
          <select
            name="province_id"
            defaultValue={profile?.province_id ?? ""}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          >
            <option value="">— ไม่ระบุ —</option>
            {(provinces ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name_th}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">แนะนำตัว (bio)</label>
          <textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            rows={4}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex justify-end">
          <button className="btn-primary">บันทึก</button>
        </div>
      </form>
    </div>
  );
}
