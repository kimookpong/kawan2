import { Check, Crown, AlertCircle, CheckCircle2, PenLine, MessageSquare, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MEMBERSHIP_TIERS, tierFeatures } from "@/lib/membership";
import { subscribe, openBillingPortal } from "./actions";

const TIERS = MEMBERSHIP_TIERS;

export const metadata = {
  title: "สนับสนุนเรา",
  description: "ร่วมสนับสนุนค่าเซิฟเวอร์ — รับ EXP เพิ่ม ปิดโฆษณา และสิทธิพิเศษอื่นๆ",
};

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tier = "free";
  let until: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("membership_tier, membership_until")
      .eq("id", user.id)
      .single();
    tier = data?.membership_tier ?? "free";
    until = data?.membership_until ?? null;
  }

  const isMember = tier !== "free";

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest text-emerald-600">JOIN · MEMBERSHIP</p>
        <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">ร่วมสนับสนุนค่าเซิฟเวอร์</h1>
        <p className="mt-2 text-on-surface-variant">
          ปิดโฆษณา รับ EXP เพิ่ม มีตราสมาชิก — และสิทธิพิเศษอื่นๆ
        </p>
      </div>

      {searchParams.success && (
        <p className="flex items-center justify-center gap-2 rounded border border-primary/30 bg-primary-container/5 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> ขอบคุณที่สนับสนุน! สถานะสมาชิกจะอัปเดตภายในไม่กี่วินาที
        </p>
      )}
      {searchParams.canceled && (
        <p className="rounded border border-outline-variant bg-surface-container px-4 py-3 text-center text-sm text-on-surface-variant">
          ยกเลิกการชำระเงินแล้ว
        </p>
      )}
      {searchParams.error && (
        <p className="flex items-center justify-center gap-2 rounded border border-error-container bg-error-container px-4 py-3 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}

      {isMember && (
        <div className="card flex flex-col items-center justify-between gap-3 p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-amber-500" />
            <div>
              <p className="font-semibold">คุณเป็น “{TIERS[tier as "supporter" | "patron"]?.name}” อยู่ตอนนี้</p>
              {until && (
                <p className="text-xs text-on-surface-variant">
                  ต่ออายุ/หมดอายุ: {new Date(until).toLocaleDateString("th-TH")}
                </p>
              )}
            </div>
          </div>
          <form action={openBillingPortal}>
            <button className="btn-outline">จัดการการสมัคร</button>
          </form>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {(["free", "supporter", "patron"] as const).map((key) => {
          const t = TIERS[key];
          const popular = key === "patron";
          const isFree = key === "free";
          const current = tier === key;
          const accent = isFree ? "text-on-surface-variant" : popular ? "text-amber-600" : "text-emerald-600";
          return (
            <div
              key={key}
              className={`card relative p-6 ${popular ? "border-amber-400" : ""}`}
            >
              {popular && (
                <span className="absolute -top-3 right-5 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#0f1b2e]">
                  POPULAR
                </span>
              )}
              <p className={`text-xs font-bold tracking-widest ${accent}`}>
                {isFree ? "TIER · เริ่มต้น" : `TIER · ${key === "supporter" ? "01" : "02"}`}
              </p>
              <h2 className="mt-2 text-xl font-bold text-on-surface">{t.name}</h2>
              <p className="mt-1 text-3xl font-extrabold text-on-surface">
                {t.price} <span className="text-sm font-normal text-on-surface-variant">/เดือน</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-on-surface">
                {tierFeatures(t).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className={`h-4 w-4 shrink-0 ${isFree ? "text-on-surface-variant" : popular ? "text-amber-500" : "text-emerald-500"}`} /> {f}
                  </li>
                ))}
              </ul>

              {isFree ? (
                <div className="mt-6 w-full rounded-lg border border-outline-variant px-5 py-3 text-center text-sm font-bold text-on-surface-variant">
                  {current ? "ระดับปัจจุบัน" : "ระดับเริ่มต้น"}
                </div>
              ) : (
                <form action={subscribe} className="mt-6">
                  <input type="hidden" name="tier" value={key} />
                  <button
                    disabled={current}
                    className={`w-full rounded-lg px-5 py-3 text-sm font-bold transition disabled:opacity-50 ${
                      popular
                        ? "bg-amber-400 text-[#0f1b2e] hover:bg-amber-300"
                        : "border border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {current ? "แพ็กเกจปัจจุบัน" : `สมัคร ${key === "patron" ? "Patron" : "Supporter"} — ${t.price}`}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* วิธีรับ EXP */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-on-surface">วิธีรับ EXP</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          สะสม EXP เพื่อเลื่อนระดับ — สมาชิกที่สนับสนุนจะได้รับตัวคูณ EXP เพิ่ม
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: PenLine, label: "ตั้งกระทู้ใหม่" },
            { Icon: MessageSquare, label: "แสดงความคิดเห็น" },
            { Icon: Heart, label: "ได้รับไลก์" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-container/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-on-surface">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-on-surface-variant">
        ยกเลิกได้ทุกเมื่อ · ชำระผ่าน Stripe / PromptPay
      </p>
    </div>
  );
}
