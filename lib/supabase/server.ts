import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase client สำหรับ Server Components / Route Handlers / Server Actions */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // เรียกจาก Server Component — มี middleware refresh session อยู่แล้ว ปลอดภัยที่จะ ignore
          }
        },
      },
    }
  );
}
