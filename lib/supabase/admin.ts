import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service role) — bypass RLS
 * ใช้เฉพาะฝั่ง server ที่เชื่อถือได้ เช่น Stripe webhook
 * ห้าม import เข้า client component เด็ดขาด
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
