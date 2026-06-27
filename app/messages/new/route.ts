import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** เริ่ม/หาห้องสนทนากับผู้ใช้ ?to=<uuid> แล้ว redirect ไปห้องนั้น */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const to = request.nextUrl.searchParams.get("to");
  const listingRaw = request.nextUrl.searchParams.get("listing");
  const listingId = listingRaw ? Number(listingRaw) : null;
  const origin = request.nextUrl.origin;

  if (!user) {
    const redirectTo = to ? `/messages/new?to=${encodeURIComponent(to)}` : "/messages";
    return NextResponse.redirect(
      `${origin}/auth/login?redirect=${encodeURIComponent(redirectTo)}`,
    );
  }
  if (!to) {
    return NextResponse.redirect(`${origin}/messages`);
  }
  if (to === user.id) {
    return NextResponse.redirect(`${origin}/messages?error=ส่งข้อความถึงตัวเองไม่ได้`);
  }

  // ตรวจว่ามีโปรไฟล์เป้าหมายจริง
  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", to)
    .maybeSingle();
  if (!target) {
    return NextResponse.redirect(`${origin}/messages?error=ไม่พบสมาชิกที่ต้องการ`);
  }

  const { data, error } = await supabase.rpc("start_conversation", {
    other_user: to,
    ...(listingId && Number.isFinite(listingId) ? { p_listing: listingId } : {}),
  });
  if (error || !data) {
    const back = `/u/${target.username}?error=${encodeURIComponent("ไม่สามารถเริ่มการสนทนาได้")}`;
    return NextResponse.redirect(`${origin}${back}`);
  }
  return NextResponse.redirect(`${origin}/messages/${data}`);
}
