import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSeller } from "@/app/marketplace/actions";

export const metadata = {
  title: "สมัครเป็นผู้ขาย",
  robots: { index: false, follow: false },
};

export default async function SellerRegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/marketplace/seller/register");

  const [{ data: existing }, { data: provinces }] = await Promise.all([
    supabase
      .from("sellers")
      .select("status, shop_name, description, contact_phone, contact_line, contact_facebook, province_id, address, logo_url, rejection_reason")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("provinces").select("id, name_th").order("name_th"),
  ]);

  const isResubmit = existing?.status === "rejected";
  const isUpdate = !!existing && existing.status !== "rejected";

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">
          {isUpdate ? "แก้ไขข้อมูลผู้ขาย" : "สมัครเป็นผู้ขาย"}
        </h1>
        <Link href="/marketplace" className="text-sm text-primary hover:underline">
          ← กลับตลาด
        </Link>
      </div>

      {searchParams.error && (
        <p className="mb-4 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          {searchParams.error}
        </p>
      )}

      {isResubmit && existing?.rejection_reason && (
        <p className="mb-4 rounded border border-error bg-error-container px-3 py-2 text-sm text-on-error-container">
          การสมัครก่อนหน้าถูกปฏิเสธ: {existing.rejection_reason} — กรุณาแก้ไขข้อมูลแล้วยื่นใหม่
        </p>
      )}

      <form action={registerSeller} className="card space-y-4 p-6">
        <Field label="ชื่อร้าน *" name="shop_name" defaultValue={existing?.shop_name ?? ""} required minLength={3} maxLength={60} />
        <Field label="เบอร์โทรติดต่อ *" name="contact_phone" defaultValue={existing?.contact_phone ?? ""} required />
        <Field label="LINE ID" name="contact_line" defaultValue={existing?.contact_line ?? ""} />
        <Field label="Facebook (URL)" name="contact_facebook" defaultValue={existing?.contact_facebook ?? ""} type="url" />

        <div>
          <label className="mb-1 block text-sm font-medium">จังหวัด</label>
          <select
            name="province_id"
            defaultValue={existing?.province_id ?? ""}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          >
            <option value="">— เลือกจังหวัด —</option>
            {(provinces ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name_th}</option>
            ))}
          </select>
        </div>

        <Field label="ที่อยู่ (อำเภอ/ตำบล)" name="address" defaultValue={existing?.address ?? ""} />
        <Field label="URL โลโก้ร้าน" name="logo_url" defaultValue={existing?.logo_url ?? ""} type="url" placeholder="https://..." />

        <div>
          <label className="mb-1 block text-sm font-medium">คำอธิบายร้าน</label>
          <textarea
            name="description"
            defaultValue={existing?.description ?? ""}
            rows={5}
            className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="accept" value="1" required className="mt-0.5 h-4 w-4" />
          <span>
            ยอมรับเงื่อนไขการเป็นผู้ขาย — สินค้าทุกชิ้นต้องถูกกฎหมาย ไม่หลอกลวง
            และยินยอมให้ admin ตรวจสอบและระงับการใช้งานได้ตามดุลพินิจ
          </span>
        </label>

        <div className="flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            * จำเป็น · หลังยื่นใบสมัคร admin จะตรวจสอบและแจ้งผล
          </p>
          <button type="submit" className="btn-primary">
            {isUpdate ? "บันทึก" : "ยื่นใบสมัคร"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
  required,
  minLength,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
