import { Shield, Ban, CircleSlash, Coins, CheckCircle2 } from "lucide-react";
import { banUser, unbanUser, setDisabled, adjustPoints } from "@/app/u/actions";

export function ModerationPanel({
  targetId,
  username,
  targetRole,
  isAdmin,
  bannedUntil,
  disabled,
}: {
  targetId: string;
  username: string;
  targetRole?: string | null;
  isAdmin: boolean;
  bannedUntil: string | null;
  disabled: boolean;
}) {
  const isBanned = bannedUntil ? new Date(bannedUntil).getTime() > Date.now() : false;
  const cannotSanction = targetRole === "admin"; // ห้ามจัดการ admin

  return (
    <section className="card border-amber-400/40 p-5">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-on-surface">
        <Shield className="h-5 w-5 text-amber-500" /> แผงจัดการสมาชิก (เจ้าหน้าที่)
      </h2>

      {cannotSanction ? (
        <p className="text-sm text-on-surface-variant">ไม่สามารถจัดการบัญชีผู้ดูแลระบบได้</p>
      ) : (
        <div className="space-y-4">
          {/* สถานะ */}
          <div className="flex flex-wrap gap-2 text-xs">
            {isBanned && (
              <span className="inline-flex items-center gap-1 rounded bg-error-container px-2 py-1 text-on-error-container">
                <Ban className="h-3.5 w-3.5" /> แบนถึง {new Date(bannedUntil!).toLocaleString("th-TH")}
              </span>
            )}
            {disabled && (
              <span className="inline-flex items-center gap-1 rounded bg-error-container px-2 py-1 text-on-error-container">
                <CircleSlash className="h-3.5 w-3.5" /> บัญชีถูกปิดใช้งาน
              </span>
            )}
            {!isBanned && !disabled && (
              <span className="inline-flex items-center gap-1 rounded bg-primary-container/15 px-2 py-1 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> ปกติ
              </span>
            )}
          </div>

          {/* แบน / ปลดแบน (admin + editor) */}
          <div className="rounded-lg border border-outline-variant p-3">
            <p className="mb-2 text-sm font-medium">ระงับการใช้งาน (Ban)</p>
            {isBanned ? (
              <form action={unbanUser} className="flex items-center gap-2">
                <input type="hidden" name="target" value={targetId} />
                <input type="hidden" name="username" value={username} />
                <button className="btn-outline">ปลดแบน</button>
              </form>
            ) : (
              <form action={banUser} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="target" value={targetId} />
                <input type="hidden" name="username" value={username} />
                <label className="block">
                  <span className="mb-1 block text-xs text-on-surface-variant">ระยะเวลา</span>
                  <select name="days" className="rounded border border-outline-variant px-2 py-1.5 text-sm outline-none focus:border-primary">
                    <option value="1">1 วัน</option>
                    <option value="3">3 วัน</option>
                    <option value="7">7 วัน</option>
                    <option value="30">30 วัน</option>
                  </select>
                </label>
                <label className="block flex-1">
                  <span className="mb-1 block text-xs text-on-surface-variant">เหตุผล (ไม่บังคับ)</span>
                  <input name="reason" className="w-full rounded border border-outline-variant px-2 py-1.5 text-sm outline-none focus:border-primary" />
                </label>
                <button className="inline-flex items-center gap-1 rounded bg-error px-3 py-1.5 text-sm font-medium text-on-error hover:opacity-90">
                  <Ban className="h-4 w-4" /> แบน
                </button>
              </form>
            )}
          </div>

          {isAdmin && (
            <>
              {/* ปรับแต้ม (admin) */}
              <div className="rounded-lg border border-outline-variant p-3">
                <p className="mb-2 flex items-center gap-1 text-sm font-medium"><Coins className="h-4 w-4 text-amber-500" /> ปรับแต้ม</p>
                <form action={adjustPoints} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="target" value={targetId} />
                  <input type="hidden" name="username" value={username} />
                  <label className="block w-32">
                    <span className="mb-1 block text-xs text-on-surface-variant">จำนวน (+/-)</span>
                    <input name="amount" type="number" required placeholder="เช่น 100 หรือ -50" className="w-full rounded border border-outline-variant px-2 py-1.5 text-sm outline-none focus:border-primary" />
                  </label>
                  <label className="block flex-1">
                    <span className="mb-1 block text-xs text-on-surface-variant">เหตุผล</span>
                    <input name="reason" className="w-full rounded border border-outline-variant px-2 py-1.5 text-sm outline-none focus:border-primary" />
                  </label>
                  <button className="btn-primary">บันทึก</button>
                </form>
              </div>

              {/* ปิด/เปิดบัญชี (admin) */}
              <div className="rounded-lg border border-outline-variant p-3">
                <p className="mb-2 text-sm font-medium">สถานะบัญชี</p>
                <form action={setDisabled} className="flex items-center gap-2">
                  <input type="hidden" name="target" value={targetId} />
                  <input type="hidden" name="username" value={username} />
                  <input type="hidden" name="disabled" value={disabled ? "0" : "1"} />
                  <button className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium ${disabled ? "bg-primary text-on-primary" : "border border-error text-error hover:bg-error/5"}`}>
                    <CircleSlash className="h-4 w-4" /> {disabled ? "เปิดใช้งานบัญชี" : "ปิดใช้งานบัญชี"}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
