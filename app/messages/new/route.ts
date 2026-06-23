import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** เริ่ม/หาห้องสนทนากับผู้ใช้ ?to=<uuid> แล้ว redirect ไปห้องนั้น */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const to = request.nextUrl.searchParams.get("to");
  const origin = request.nextUrl.origin;

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?redirect=/messages`);
  }
  if (!to) {
    return NextResponse.redirect(`${origin}/messages`);
  }

  const { data, error } = await supabase.rpc("start_conversation", { other_user: to });
  if (error || !data) {
    return NextResponse.redirect(`${origin}/messages`);
  }
  return NextResponse.redirect(`${origin}/messages/${data}`);
}
