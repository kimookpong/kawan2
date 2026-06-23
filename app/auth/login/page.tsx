import Link from "next/link";
import { login } from "../actions";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";

export const metadata = {
  title: "เข้าสู่ระบบ",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-8">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          ยินดีต้อนรับกลับสู่ Kawan2
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
            {searchParams.error}
          </p>
        )}

        <div className="mt-6">
          <GoogleButton label="เข้าสู่ระบบด้วย Google" redirect={searchParams.redirect || "/"} />
        </div>
        <OrDivider />

        <form action={login} className="space-y-4">
          <input type="hidden" name="redirect" value={searchParams.redirect || "/"} />
          <div>
            <label className="mb-1 block text-sm font-medium">อีเมล</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">รหัสผ่าน</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary py-2.5 font-medium text-on-primary transition hover:opacity-90"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-on-surface-variant">
          ยังไม่มีบัญชี?{" "}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}
