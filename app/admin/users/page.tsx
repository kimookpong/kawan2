import Link from "next/link";
import { Search, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setUserRole, resetUserNames } from "../actions";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { LevelBadge } from "@/components/user-badges";
import { Avatar } from "@/components/avatar";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; ok?: string; error?: string };
}) {
  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();

  // ผู้ใช้ปัจจุบัน (ไว้ disable การแก้ role ของตัวเอง)
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, role, level_id, reputation, avatar_url, created_at, provinces(name_th)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
  }

  const { data: users } = await query;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">จัดการสมาชิก</h1>
        <form className="flex gap-2" action="/admin/users">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-on-surface-variant" />
            <input
              name="q"
              defaultValue={q}
              placeholder="ค้นหาชื่อผู้ใช้..."
              className="rounded border border-outline-variant py-2 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="btn-primary">ค้นหา</button>
        </form>
      </div>

      {searchParams.ok && (
        <p className="flex items-center gap-2 rounded border border-primary/30 bg-primary-container/5 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> อัปเดตสิทธิ์เรียบร้อย
        </p>
      )}
      {searchParams.error && (
        <p className="flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-outline-variant bg-surface-container-low text-left text-xs text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-medium">สมาชิก</th>
              <th className="px-4 py-3 font-medium">จังหวัด</th>
              <th className="px-4 py-3 font-medium">คะแนน</th>
              <th className="px-4 py-3 font-medium">สิทธิ์ปัจจุบัน</th>
              <th className="px-4 py-3 font-medium">เปลี่ยนสิทธิ์</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {(users ?? []).map((u: any) => {
              const role = ROLE_LABELS[u.role] ?? ROLE_LABELS.member;
              const isSelf = u.id === user?.id;
              return (
                <tr key={u.id} className="hover:bg-surface-container-low">
                  <td className="px-4 py-3">
                    <Link href={`/u/${u.username}`} className="flex items-center gap-2">
                      <Avatar src={u.avatar_url} name={u.display_name || u.username} role={u.role} size={32} />
                      <span>
                        <span className="block font-medium text-on-surface">{u.display_name || u.username}</span>
                        <span className="block text-xs text-on-surface-variant">@{u.username}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{u.provinces?.name_th ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      {u.reputation.toLocaleString("th-TH")}
                      <LevelBadge levelId={u.level_id} />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${role.cls}`}>{role.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSelf ? (
                        <span className="text-xs text-on-surface-variant">(บัญชีคุณ)</span>
                      ) : (
                        <form action={setUserRole} className="flex items-center gap-2">
                          <input type="hidden" name="target" value={u.id} />
                          <input type="hidden" name="q" value={q} />
                          <select
                            name="role"
                            defaultValue={u.role}
                            className="rounded border border-outline-variant px-2 py-1.5 text-sm outline-none focus:border-primary"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
                            ))}
                          </select>
                          <button className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:opacity-90">
                            บันทึก
                          </button>
                        </form>
                      )}
                      <form action={resetUserNames}>
                        <input type="hidden" name="target" value={u.id} />
                        <input type="hidden" name="q" value={q} />
                        <button
                          title="รีเซ็ตสิทธิ์เปลี่ยนชื่อ (username/ชื่อที่แสดง) ให้ผู้ใช้นี้"
                          className="inline-flex items-center gap-1 rounded border border-outline-variant px-2.5 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container hover:text-primary"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> รีเซ็ตชื่อ
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                  ไม่พบสมาชิก{q && ` ที่ตรงกับ "${q}"`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
