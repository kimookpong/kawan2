import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function updateProfile(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const patch: Record<string, unknown> = {
    bio: String(formData.get("bio") || ""),
    avatar_url: String(formData.get("avatar_url") || "") || null,
    province_id: formData.get("province_id") ? Number(formData.get("province_id")) : null,
  };
  // username / display_name ส่งมาเฉพาะตอนช่องไม่ถูกล็อก (disabled = ไม่ส่ง)
  const uname = formData.get("username");
  if (uname !== null) patch.username = String(uname).trim();
  const dname = formData.get("display_name");
  if (dname !== null) patch.display_name = String(dname).trim();

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);

  revalidatePath("/me");
  redirect(`/me?${error ? "error=" + encodeURIComponent(error.message) : "ok=1"}`);
}

export default async function MePage({ searchParams }: { searchParams: { error?: string; ok?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/me");

  const [{ data: profile }, { data: provinces }] = await Promise.all([
    supabase.from("profiles")
      .select("username, display_name, avatar_url, bio, province_id, role, level_id, username_changed_at, display_name_changed_at")
      .eq("id", user.id).single(),
    supabase.from("provinces").select("id, name_th").eq("is_active", true),
  ]);

  const now = Date.now();
  const nextDate = (iso: string | null) =>
    iso ? new Date(new Date(iso).getTime() + YEAR_MS).toLocaleDateString("th-TH") : null;
  const canUsername = !profile?.username_changed_at || now - new Date(profile.username_changed_at).getTime() > YEAR_MS;
  const canDisplay = !profile?.display_name_changed_at || now - new Date(profile.display_name_changed_at).getTime() > YEAR_MS;

  return (
    <div className="w-full max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-primary">ตั้งค่าโปรไฟล์</h1>

      {searchParams.ok && (
        <p className="mb-4 flex items-center gap-2 rounded border border-primary/30 bg-primary-container/5 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> บันทึกเรียบร้อย
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}

      <form action={updateProfile} className="card space-y-4 p-6">
        {/* avatar */}
        <div className="flex items-center gap-4">
          <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.username} role={profile?.role} size={64} />
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">รูปโปรไฟล์ (URL)</label>
            <input
              name="avatar_url"
              type="url"
              defaultValue={profile?.avatar_url ?? ""}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-on-surface-variant">วางลิงก์รูปภาพ — บันทึกแล้วจะแสดงทุกที่ในระบบ</p>
          </div>
        </div>

        {/* username */}
        <div>
          <label className="mb-1 block text-sm font-medium">ชื่อผู้ใช้ (username)</label>
          <input
            name="username"
            defaultValue={profile?.username ?? ""}
            disabled={!canUsername}
            pattern="[a-zA-Z0-9_]+"
            minLength={3}
            className={`w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${!canUsername ? "bg-surface-container text-on-surface-variant" : ""}`}
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            {canUsername ? "เปลี่ยนได้ปีละครั้ง (a-z, 0-9, _)" : `เปลี่ยนได้อีกครั้ง ${nextDate(profile!.username_changed_at)} — ถ้าจำเป็นแจ้งแอดมินรีเซ็ตให้`}
          </p>
        </div>

        {/* display name */}
        <div>
          <label className="mb-1 block text-sm font-medium">ชื่อที่แสดง</label>
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            disabled={!canDisplay}
            className={`w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${!canDisplay ? "bg-surface-container text-on-surface-variant" : ""}`}
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            {canDisplay ? "เปลี่ยนได้ปีละครั้ง" : `เปลี่ยนได้อีกครั้ง ${nextDate(profile!.display_name_changed_at)} — ถ้าจำเป็นแจ้งแอดมินรีเซ็ตให้`}
          </p>
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
