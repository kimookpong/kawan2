import Link from "next/link";
import { signup } from "../actions";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-8">
        <h1 className="text-2xl font-bold text-primary">สมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          ร่วมเป็นส่วนหนึ่งของชุมชนชายแดนใต้
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
            {searchParams.error}
          </p>
        )}

        <div className="mt-6">
          <GoogleButton label="สมัครด้วย Google" redirect="/" />
        </div>
        <OrDivider />

        <form action={signup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">ชื่อผู้ใช้ (username)</label>
            <input
              name="username"
              type="text"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
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
              minLength={6}
              className="w-full rounded border border-outline-variant px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-tertiary-container py-2.5 font-medium text-on-tertiary transition hover:opacity-90"
          >
            สมัครสมาชิก
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-on-surface-variant">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
